import { auth } from "@/auth";
import connectDb from "@/lib/connectDB";
import { normalizeOrderIdParam } from "@/lib/orderDisplay";
import { notifyOrderStatusUpdated } from "@/lib/notifyHelpers";
import Order from "@/model/order.model";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { otp, orderId: rawOrderId } = await req.json();
    const orderId = normalizeOrderIdParam(rawOrderId);
    if (!orderId || !otp) {
      return NextResponse.json({ message: "orderId and otp required" }, { status: 400 });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    const userId = session.user.id;
    const isVendor = String(order.productVendor) === userId;
    const isBuyer = String(order.buyer) === userId;

    if (!isVendor && !isBuyer) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    if (order.orderStatus === "delivered") {
      return NextResponse.json({ message: "Order already delivered" }, { status: 400 });
    }

    if (
      String(order.deliveryOtp) !== String(otp).trim() ||
      !order.otpExpiresAt ||
      order.otpExpiresAt < new Date()
    ) {
      return NextResponse.json({ message: "Invalid or expired OTP" }, { status: 400 });
    }

    order.orderStatus = "delivered";
    if (order.paymentMethod === "cod") {
      order.isPaid = true;
    }
    order.deliveryDate = new Date().toISOString();
    order.deliveryOtp = undefined;
    order.otpExpiresAt = undefined;
    await order.save();

    void notifyOrderStatusUpdated(orderId, "delivered");

    return NextResponse.json({ message: "Order delivered" }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: `failed to verify delivery otp ${error}` },
      { status: 500 }
    );
  }
}
