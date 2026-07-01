import { auth } from "@/auth";
import connectDb from "@/lib/connectDB";
import { addToWishlist, wishlistIdStrings } from "@/lib/wishlistUtils";
import Product from "@/model/product.model";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role && session.user.role !== "user") {
      return NextResponse.json(
        { message: "Wishlist is available for customer accounts only" },
        { status: 403 }
      );
    }

    const { productId } = await req.json();
    if (!productId) {
      return NextResponse.json({ message: "productId required" }, { status: 400 });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return NextResponse.json({ message: "Product not found" }, { status: 404 });
    }

    const user = await addToWishlist(session.user.id, String(productId));
    const wishlistIds = wishlistIdStrings(user.wishlist as unknown[]);

    return NextResponse.json(
      {
        message: "Added to wishlist",
        product: JSON.parse(JSON.stringify(product)),
        wishlistIds,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : `failed ${error}` },
      { status: 500 }
    );
  }
}
