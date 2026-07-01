import { auth } from "@/auth";
import connectDb from "@/lib/connectDB";
import { getOrderDisplayId, normalizeOrderIdParam } from "@/lib/orderDisplay";
import { notifyOrderStatusUpdated } from "@/lib/notifyHelpers";
import Order from "@/model/order.model";
import User from "@/model/user.model";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = await User.findById(session.user.id);
    if (!user || user.role !== "vendor") {
      return NextResponse.json({ message: "Only vendors can update status" }, { status: 403 });
    }

    const { orderId: rawOrderId, status } = await req.json();
    const orderId = normalizeOrderIdParam(rawOrderId);
    if (!orderId) {
      return NextResponse.json({ message: "orderId is required" }, { status: 400 });
    }
    const order = await Order.findById(orderId).populate("buyer");
    if (!order) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    if (String(order.productVendor) !== session.user.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    if (status === "confirmed" || status === "shipped") {
      order.orderStatus = status;
      await order.save();
      void notifyOrderStatusUpdated(orderId, status);
      return NextResponse.json({ message: "orderStatus updated" }, { status: 200 });
    }

    if (status === "delivered") {
      const otp = Math.floor(1000 + Math.random() * 9000).toString();
      order.deliveryOtp = otp;
      order.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
      await order.save();

      const email = (order.buyer as { email?: string })?.email;
      if (!email) {
        return NextResponse.json({ message: "Buyer email not found" }, { status: 400 });
      }

      const { sendDEliveryOtpEmail } = await import("@/lib/mailer");
      await sendDEliveryOtpEmail(email, otp, getOrderDisplayId(order));
      void notifyOrderStatusUpdated(orderId, "Delivery OTP sent");
      return NextResponse.json({ message: "OTP sent to buyer email" });
    }

    return NextResponse.json({ message: "Invalid status" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { message: `failed to update order status ${error}` },
      { status: 500 }
    );
  }
}
