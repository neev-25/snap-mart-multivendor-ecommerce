import { auth } from "@/auth";
import connectDb from "@/lib/connectDB";
import User from "@/model/user.model";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { productId } = await req.json();
    if (!productId) {
      return NextResponse.json({ message: "productId is required" }, { status: 400 });
    }

    const user = await User.findById(session.user.id);
    if (!user?.cart) {
      return NextResponse.json({ message: "Cart not found" }, { status: 404 });
    }

    user.cart = user.cart.filter(
      (item: { product: { toString(): string } }) =>
        String(item.product) !== String(productId)
    );
    await user.save();

    return NextResponse.json({ message: "Item removed from cart" }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: `failed to remove cart item ${error}` },
      { status: 500 }
    );
  }
}
