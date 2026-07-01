import { generateOrderNumber } from "@/lib/orderDisplay";
import connectDb from "@/lib/connectDB";
import { cartItemProductId, findCartItem } from "@/lib/cartUtils";
import { incrementCouponUse, validateCoupon } from "@/lib/couponUtils";
import { calculateOrderPricing } from "@/lib/orderPricing";
import Order from "@/model/order.model";
import Product from "@/model/product.model";
import { IProduct } from "@/model/product.model";
import User from "@/model/user.model";
import mongoose from "mongoose";

interface AddressInput {
  name: string;
  phone: string;
  address: string;
  city: string;
  pincode: string;
}

export async function rollbackPlacedOrder(
  orderId: string,
  userId: string,
  productId: string,
  quantity: number
) {
  await connectDb();
  await Order.findByIdAndDelete(orderId);
  await Product.findByIdAndUpdate(productId, { $inc: { stock: quantity } });

  const user = await User.findById(userId);
  if (!user) return;

  user.orders = (user.orders ?? []).filter(
    (id: mongoose.Types.ObjectId) => String(id) !== String(orderId)
  );

  if (!Array.isArray(user.cart)) {
    user.cart = [];
  }
  const existing = findCartItem(user.cart, productId);
  if (existing) {
    existing.quantity += quantity;
  } else {
    user.cart.push({
      product: new mongoose.Types.ObjectId(productId),
      quantity,
    });
  }
  await user.save();
}

export async function placeOrder(params: {
  userId: string;
  productId: string;
  quantity?: number;
  address: AddressInput;
  paymentMethod: "cod" | "stripe";
  couponCode?: string;
}) {
  await connectDb();

  const { userId, productId, address, paymentMethod, couponCode } = params;
  const normalizedProductId = String(productId);

  const user = await User.findById(userId);
  if (!user) {
    throw new Error("USER_CART_NOT_FOUND");
  }

  if (!Array.isArray(user.cart) || user.cart.length === 0) {
    throw new Error("PRODUCT_NOT_IN_CART");
  }

  const cartItem = findCartItem(user.cart, normalizedProductId);
  if (!cartItem) {
    throw new Error("PRODUCT_NOT_IN_CART");
  }

  const quantity = params.quantity ?? cartItem.quantity;
  if (quantity < 1 || quantity > cartItem.quantity) {
    throw new Error("INVALID_QUANTITY");
  }

  const product = await Product.findById(normalizedProductId);
  if (!product) {
    throw new Error("PRODUCT_NOT_FOUND");
  }

  if (product.verificationStatus !== "approved" || !product.isActive) {
    throw new Error("PRODUCT_NOT_AVAILABLE");
  }

  if (product.stock < quantity) {
    throw new Error("INSUFFICIENT_STOCK");
  }

  if (paymentMethod === "cod" && product.payOnDelivery === false) {
    throw new Error("COD_NOT_AVAILABLE");
  }

  const preCouponPricing = calculateOrderPricing(product, quantity);
  const couponResult = couponCode
    ? await validateCoupon(couponCode, preCouponPricing.totalAmount)
    : null;

  const pricing = calculateOrderPricing(product, quantity, couponResult?.coupon ?? null);

  if (pricing.totalAmount < 0) {
    throw new Error("INVALID_ORDER_TOTAL");
  }

  const updated = await Product.findOneAndUpdate(
    { _id: normalizedProductId, stock: { $gte: quantity } },
    { $inc: { stock: -quantity } },
    { new: true }
  );

  if (!updated) {
    throw new Error("INSUFFICIENT_STOCK");
  }

  let order;
  try {
    order = await Order.create({
      orderNumber: generateOrderNumber(),
      buyer: userId,
      products: [{ product: product._id, quantity, price: product.price }],
      productVendor: product.vendor,
      productsTotal: pricing.productsTotal,
      deliveryCharge: pricing.deliveryCharge,
      serviceCharge: pricing.serviceCharge,
      couponCode: couponResult?.code,
      couponDiscount: pricing.couponDiscount,
      totalAmount: pricing.totalAmount,
      platformCommission: pricing.platformCommission,
      vendorEarning: pricing.vendorEarning,
      commissionPercent: pricing.commissionPercent,
      paymentMethod,
      isPaid: false,
      orderStatus: "pending",
      returnedAmount: 0,
      address,
    });

    user.cart = user.cart.filter(
      (item: { product: unknown; quantity: number }) =>
        cartItemProductId(item) !== normalizedProductId
    );

    if (!Array.isArray(user.orders)) {
      user.orders = [];
    }
    user.orders.push(order._id as mongoose.Types.ObjectId);
    await user.save();

    if (couponResult?.code) {
      await incrementCouponUse(couponResult.code);
    }
  } catch (error) {
    await Product.findByIdAndUpdate(normalizedProductId, { $inc: { stock: quantity } });
    throw error;
  }

  return order;
}

export interface PlacedOrderMeta {
  orderId: string;
  productId: string;
  quantity: number;
}

export async function rollbackPlacedOrders(userId: string, items: PlacedOrderMeta[]) {
  for (const item of items) {
    try {
      await rollbackPlacedOrder(item.orderId, userId, item.productId, item.quantity);
    } catch {
      /* best effort */
    }
  }
}

export async function placeAllCartOrders(params: {
  userId: string;
  address: AddressInput;
  paymentMethod: "cod" | "stripe";
  couponCode?: string;
}) {
  await connectDb();

  const { userId, address, paymentMethod, couponCode } = params;
  const user = await User.findById(userId);
  if (!user || !Array.isArray(user.cart) || user.cart.length === 0) {
    throw new Error("PRODUCT_NOT_IN_CART");
  }

  type LineItem = {
    productId: string;
    quantity: number;
    product: IProduct;
    preCouponTotal: number;
    pricing: ReturnType<typeof calculateOrderPricing>;
  };

  const lines: LineItem[] = [];

  for (const cartItem of user.cart) {
    const productId = cartItemProductId(cartItem);
    const quantity = cartItem.quantity;
    const product = await Product.findById(productId);

    if (!product) throw new Error("PRODUCT_NOT_FOUND");
    const productDoc = product as IProduct;
    if (productDoc.verificationStatus !== "approved" || !productDoc.isActive) {
      throw new Error("PRODUCT_NOT_AVAILABLE");
    }
    if (productDoc.stock < quantity) throw new Error("INSUFFICIENT_STOCK");
    if (paymentMethod === "cod" && productDoc.payOnDelivery === false) {
      throw new Error("COD_NOT_AVAILABLE");
    }

    const pricing = calculateOrderPricing(productDoc, quantity);
    lines.push({ productId, quantity, product: productDoc, preCouponTotal: pricing.totalAmount, pricing });
  }

  const combinedPreTotal = lines.reduce((sum, line) => sum + line.preCouponTotal, 0);
  const couponResult = couponCode
    ? await validateCoupon(couponCode, combinedPreTotal)
    : null;

  let totalCouponDiscount = 0;
  if (couponResult) {
    const c = couponResult.coupon;
    totalCouponDiscount =
      c.discountType === "percent"
        ? Math.round((combinedPreTotal * c.discountValue) / 100)
        : c.discountValue;
    totalCouponDiscount = Math.min(Math.max(totalCouponDiscount, 0), combinedPreTotal);
  }

  const placed: PlacedOrderMeta[] = [];
  const orders = [];
  let discountAssigned = 0;

  try {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const product = line.product;
      const basePricing = line.pricing;

      const lineDiscount =
        totalCouponDiscount === 0
          ? 0
          : i === lines.length - 1
            ? totalCouponDiscount - discountAssigned
            : combinedPreTotal > 0
              ? Math.round((totalCouponDiscount * line.preCouponTotal) / combinedPreTotal)
              : 0;
      discountAssigned += lineDiscount;

      const totalAmount = line.preCouponTotal - lineDiscount;
      if (totalAmount < 0) throw new Error("INVALID_ORDER_TOTAL");

      const updated = await Product.findOneAndUpdate(
        { _id: line.productId, stock: { $gte: line.quantity } },
        { $inc: { stock: -line.quantity } },
        { new: true }
      );
      if (!updated) throw new Error("INSUFFICIENT_STOCK");

      const order = await Order.create({
        orderNumber: generateOrderNumber(),
        buyer: userId,
        products: [{ product: product._id, quantity: line.quantity, price: product.price }],
        productVendor: product.vendor,
        productsTotal: basePricing.productsTotal,
        deliveryCharge: basePricing.deliveryCharge,
        serviceCharge: basePricing.serviceCharge,
        couponCode: couponResult?.code,
        couponDiscount: lineDiscount,
        totalAmount,
        platformCommission: basePricing.platformCommission,
        vendorEarning: basePricing.vendorEarning,
        commissionPercent: basePricing.commissionPercent,
        paymentMethod,
        isPaid: false,
        orderStatus: "pending",
        returnedAmount: 0,
        address,
      });

      placed.push({
        orderId: order._id.toString(),
        productId: line.productId,
        quantity: line.quantity,
      });
      orders.push(order);
    }

    user.cart = [];
    if (!Array.isArray(user.orders)) user.orders = [];
    for (const order of orders) {
      user.orders.push(order._id as mongoose.Types.ObjectId);
    }
    await user.save();

    if (couponResult?.code) {
      await incrementCouponUse(couponResult.code);
    }
  } catch (error) {
    await rollbackPlacedOrders(userId, placed);
    throw error;
  }

  const totalAmount = orders.reduce(
    (sum, o) => sum + (o.totalAmount as number),
    0
  );

  return { orders, totalAmount, placed };
}

export function orderErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "ORDER_FAILED";
  const map: Record<string, { status: number; message: string }> = {
    USER_CART_NOT_FOUND: { status: 404, message: "User or cart not found" },
    PRODUCT_NOT_IN_CART: {
      status: 400,
      message: "Product not found in cart. Please add it again from the product page.",
    },
    PRODUCT_NOT_FOUND: { status: 404, message: "Product not found" },
    PRODUCT_NOT_AVAILABLE: {
      status: 400,
      message: "Product is not available for purchase",
    },
    INSUFFICIENT_STOCK: { status: 400, message: "Insufficient stock" },
    COD_NOT_AVAILABLE: {
      status: 400,
      message: "Cash on delivery is not available for this product",
    },
    INVALID_QUANTITY: { status: 400, message: "Invalid quantity for this cart item" },
    INVALID_ORDER_TOTAL: { status: 400, message: "Order total is invalid" },
  };
  return map[message] ?? { status: 500, message: `Order failed: ${message}` };
}
