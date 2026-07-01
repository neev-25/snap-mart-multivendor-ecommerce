import { auth } from "@/auth";
import connectDb from "@/lib/connectDB";
import User from "@/model/user.model";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectDb();
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = await User.findById(session.user.id).populate("cart.product");
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ cart: user.cart ?? [] }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: `failed to get cart ${error}` },
      { status: 500 }
    );
  }
}
