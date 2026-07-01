import { auth } from "@/auth";
import connectDb from "@/lib/connectDB";
import Order from "@/model/order.model";
import Product from "@/model/product.model";
import User from "@/model/user.model";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectDb();
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    let orders;
    if (user.role === "admin") {
      orders = await Order.find();
    } else if (user.role === "vendor") {
      orders = await Order.find({ productVendor: user._id });
    } else {
      orders = await Order.find({ buyer: user._id });
    }

    const populated = await Order.populate(orders, [
      { path: "buyer", select: "name email phone image" },
      { path: "productVendor", select: "name shopName email" },
      {
        path: "products.product",
        select: "title image1 price category stock vendor replacementDays",
      },
    ]);

    populated.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json(populated, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: `failed to get orders ${error}` },
      { status: 500 }
    );
  }
}
