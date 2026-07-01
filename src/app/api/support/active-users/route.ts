import { auth } from "@/auth";
import connectDb from "@/lib/connectDB";
import Order from "@/model/order.model";
import User from "@/model/user.model";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectDb();
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await User.findById(session.user.id);
    if (!currentUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    if (currentUser.role === "user") {
      const orders = await Order.find({
        buyer: currentUser._id,
      }).populate("productVendor", "name image shopName role");

      const vendorMap = new Map<string, unknown>();
      orders.forEach((order) => {
        const vendor = order.productVendor as { _id?: unknown } | null;
        if (vendor?._id) {
          vendorMap.set(String(vendor._id), vendor);
        }
      });
      return NextResponse.json([...vendorMap.values()]);
    }

    if (currentUser.role === "vendor") {
      const orders = await Order.find({
        productVendor: currentUser._id,
      }).populate("buyer", "name image role");

      const buyerMap = new Map<string, unknown>();
      orders.forEach((order) => {
        const buyer = order.buyer as { _id?: unknown } | null;
        if (buyer?._id) {
          buyerMap.set(String(buyer._id), buyer);
        }
      });

      const admin = await User.findOne({ role: "admin" }).select(
        "name image role"
      );
      return NextResponse.json([
        ...(admin ? [admin] : []),
        ...buyerMap.values(),
      ]);
    }

    if (currentUser.role === "admin") {
      const vendors = await User.find({ role: "vendor" }).select(
        "name image shopName role"
      );
      return NextResponse.json(vendors);
    }

    return NextResponse.json([]);
  } catch (error) {
    return NextResponse.json(
      { message: `failed to get active users for chat ${error}` },
      { status: 500 }
    );
  }
}
