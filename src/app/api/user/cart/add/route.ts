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

    const { productId, quantity = 1 } = await req.json();
    if (!productId) {
      return NextResponse.json({ message: "Product ID required" }, { status: 400 });
    }

    const user = await User.findById(session.user.id);
    const product = await Product.findById(productId);

    if (!user || !product) {
      return NextResponse.json({ message: "User or product not found" }, { status: 404 });
    }

    if (!Array.isArray(user.cart)) {
      user.cart = [];
    }

    const existingProduct = user.cart.find(
      (item: { product?: { toString(): string } }) =>
        String(item.product) === String(productId)
    );
    if (product.verificationStatus !== "approved" || !product.isActive) {
      return NextResponse.json({ message: "Product is not available" }, { status: 400 });
    }

    if (product.stock < quantity) {
      return NextResponse.json({ message: "Insufficient stock" }, { status: 400 });
    }

    if (existingProduct) {
      const newQty = existingProduct.quantity + quantity;
      if (newQty > product.stock) {
        return NextResponse.json(
          { message: `Only ${product.stock} item(s) in stock` },
          { status: 400 }
        );
      }
      existingProduct.quantity = newQty;
    } else {
      user.cart.push({ product: product._id, quantity });
    }
    await user.save();

    return NextResponse.json({ message: "Product added to cart" }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: `failed to add product in cart ${error}` },
      { status: 500 }
    );
  }
}
