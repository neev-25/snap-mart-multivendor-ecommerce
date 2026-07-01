import { auth } from "@/auth";
import connectDb from "@/lib/connectDB";
import Product from "@/model/product.model";
import User from "@/model/user.model";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { productId, quantity } = await req.json();
    if (!productId || quantity < 1) {
      return NextResponse.json({ message: "Invalid data" }, { status: 400 });
    }

    const [user, product] = await Promise.all([
      User.findById(session.user.id),
      Product.findById(productId),
    ]);

    if (!user?.cart) {
      return NextResponse.json({ message: "Cart not found" }, { status: 404 });
    }
    if (!product) {
      return NextResponse.json({ message: "Product not found" }, { status: 404 });
    }
    if (product.verificationStatus !== "approved" || !product.isActive) {
      return NextResponse.json({ message: "Product is not available" }, { status: 400 });
    }
    if (quantity > product.stock) {
      return NextResponse.json(
        { message: `Only ${product.stock} item(s) in stock` },
        { status: 400 }
      );
    }

    const item = user.cart.find(
      (cartItem: { product: { toString(): string } }) =>
        String(cartItem.product) === String(productId)
    );
    if (!item) {
      return NextResponse.json({ message: "Item not in cart" }, { status: 404 });
    }

    item.quantity = quantity;
    await user.save();

    return NextResponse.json(
      { message: "Quantity updated", cart: user.cart },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: `failed to update cart ${error}` },
      { status: 500 }
    );
  }
}
