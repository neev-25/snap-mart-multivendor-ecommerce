import { auth } from "@/auth";
import connectDb from "@/lib/connectDB";
import { canActivateProduct } from "@/lib/commissionUtils";
import Product from "@/model/product.model";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { productId, isActive } = await req.json();
    if (!productId) {
      return NextResponse.json({ message: "Product ID required" }, { status: 400 });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return NextResponse.json({ message: "Product not found" }, { status: 404 });
    }

    if (String(product.vendor) !== session.user.id) {
      return NextResponse.json({ message: "Not allowed" }, { status: 403 });
    }

    if (isActive && !canActivateProduct(product)) {
      if (product.commissionStatus === "admin_countered") {
        return NextResponse.json(
          {
            message:
              "Admin proposed a different commission. Accept it or edit your offer before enabling.",
          },
          { status: 400 }
        );
      }
      if (product.commissionStatus === "pending") {
        return NextResponse.json(
          {
            message:
              "Commission is pending admin approval. Product cannot be enabled yet.",
          },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { message: "Product must be approved with agreed commission before activation" },
        { status: 400 }
      );
    }

    product.isActive = Boolean(isActive);
    await product.save();

    if (product.isActive) {
      const { indexProductVisual } = await import("@/lib/visualSearch/productIndexer");
      void indexProductVisual(String(product._id)).catch((err) => {
        console.error("[visual-index] background indexing failed:", err);
      });
    }

    return NextResponse.json(product, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: `failed to update product status ${error}` },
      { status: 500 }
    );
  }
}
