import { auth } from "@/auth";
import connectDb from "@/lib/connectDB";
import { getBaseAmounts, isReturnWindowOpen } from "@/lib/orderFinances";
import { normalizeOrderIdParam } from "@/lib/orderDisplay";
import Order from "@/model/order.model";
import Product from "@/model/product.model";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { orderId: rawOrderId } = await req.json();
    const orderId = normalizeOrderIdParam(rawOrderId);
    if (!orderId) {
      return NextResponse.json({ message: "orderId is required" }, { status: 400 });
    }

    const order = await Order.findById(orderId).populate(
      "products.product",
      "replacementDays title"
    );
    if (!order) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    if (String(order.buyer) !== session.user.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    if (order.orderStatus === "cancelled") {
      return NextResponse.json({ message: "Cancelled order cannot be returned" }, { status: 400 });
    }
    if (order.orderStatus === "returned") {
      return NextResponse.json({ message: "Order already returned" }, { status: 400 });
    }
    if (order.orderStatus !== "delivered") {
      return NextResponse.json({ message: "Only delivered orders can be returned" }, { status: 400 });
    }

    const orderPlain = JSON.parse(JSON.stringify(order));
    if (!isReturnWindowOpen(orderPlain)) {
      return NextResponse.json(
        { message: "Return window has expired for this order" },
        { status: 400 }
      );
    }

    const amounts = getBaseAmounts(orderPlain);

    order.orderStatus = "returned";
    order.returnedAmount = amounts.productsTotal;
    order.refundedCommission = amounts.platformCommission;
    order.refundedVendorAmount = amounts.vendorEarning;
    order.returnedAt = new Date();
    await order.save();

    for (const item of order.products) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity },
      });
    }

    return NextResponse.json(
      {
        message: "Return processed",
        order,
        settlement: {
          customerRefund: amounts.productsTotal,
          refundedCommission: amounts.platformCommission,
          refundedVendor: amounts.vendorEarning,
          platformKeeps: amounts.serviceCharge + amounts.deliveryCharge,
          note: "Delivery and service charges are non-refundable. Product amount is refunded to customer.",
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: `failed to return order ${error}` },
      { status: 500 }
    );
  }
}
