import { auth } from "@/auth";
import connectDb from "@/lib/connectDB";
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

    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    if (String(order.buyer) !== session.user.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    if (["delivered", "returned", "cancelled"].includes(order.orderStatus)) {
      return NextResponse.json(
        { message: "This order cannot be cancelled" },
        { status: 400 }
      );
    }

    if (order.isPaid && order.paymentMethod === "stripe") {
      return NextResponse.json(
        { message: "Paid online orders cannot be cancelled. Contact support for help." },
        { status: 400 }
      );
    }

    order.orderStatus = "cancelled";
    order.cancelledAt = new Date();
    await order.save();

    for (const item of order.products) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity },
      });
    }

    return NextResponse.json({ message: "Order Cancelled" }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: `failed to cancel order ${error}` },
      { status: 500 }
    );
  }
}
