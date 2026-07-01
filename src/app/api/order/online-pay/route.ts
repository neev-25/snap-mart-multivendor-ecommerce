import { auth } from "@/auth";
import connectDb from "@/lib/connectDB";
import { orderErrorResponse, placeOrder, rollbackPlacedOrder } from "@/lib/placeOrder";
import Product from "@/model/product.model";
import Order from "@/model/order.model";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

function baseUrl() {
  return process.env.NEXT_BASE_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
}

export async function POST(req: NextRequest) {
  let orderId: string | null = null;
  let productId: string | null = null;
  let quantity = 1;

  try {
    await connectDb();

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { message: "Stripe is not configured. Use Cash on Delivery or set STRIPE_SECRET_KEY." },
        { status: 503 }
      );
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const normalizedProductId = String(body.productId);
    productId = normalizedProductId;
    quantity = body.quantity ?? 1;
    const { address, couponCode } = body;

    if (!normalizedProductId || !quantity) {
      return NextResponse.json(
        { message: "ProductId and quantity required" },
        { status: 400 }
      );
    }

    if (
      !address?.name ||
      !address?.phone ||
      !address?.address ||
      !address?.city ||
      !address?.pincode
    ) {
      return NextResponse.json(
        { message: "All address fields are required" },
        { status: 400 }
      );
    }

    const order = await placeOrder({
      userId: session.user.id,
      productId: normalizedProductId,
      quantity,
      address,
      paymentMethod: "stripe",
      couponCode,
    });

    const placedOrderId = order._id.toString();
    orderId = placedOrderId;
    const origin = baseUrl();

    if (order.totalAmount <= 0) {
      await Order.findByIdAndUpdate(placedOrderId, { isPaid: true });
      return NextResponse.json({ url: `${origin}/order-success` }, { status: 200 });
    }

    const amountPaise = Math.round(order.totalAmount * 100);
    if (amountPaise < 50) {
      await rollbackPlacedOrder(placedOrderId, session.user.id, normalizedProductId, quantity);
      orderId = null;
      return NextResponse.json(
        { message: "Order amount is too low for online payment. Try Cash on Delivery." },
        { status: 400 }
      );
    }

    const productDoc = await Product.findById(normalizedProductId);

    const stripeSession = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      success_url: `${origin}/order-success`,
      cancel_url: `${origin}/order-failed?reason=${encodeURIComponent("Payment was cancelled")}`,
      line_items: [
        {
          price_data: {
            currency: "inr",
            product_data: { name: productDoc?.title || "SnapMart Order" },
            unit_amount: amountPaise,
          },
          quantity: 1,
        },
      ],
      metadata: {
        orderId: placedOrderId,
        orderIds: placedOrderId,
      },
    });

    if (!stripeSession.url) {
      await rollbackPlacedOrder(placedOrderId, session.user.id, normalizedProductId, quantity);
      orderId = null;
      return NextResponse.json(
        { message: "Could not start Stripe checkout. Please try again." },
        { status: 502 }
      );
    }

    return NextResponse.json({ url: stripeSession.url }, { status: 200 });
  } catch (error) {
    if (orderId && productId) {
      try {
        const session = await auth();
        if (session?.user?.id) {
          await rollbackPlacedOrder(orderId, session.user.id, productId, quantity);
        }
      } catch {
        /* best effort */
      }
    }
    const err = orderErrorResponse(error);
    return NextResponse.json({ message: err.message }, { status: err.status });
  }
}
