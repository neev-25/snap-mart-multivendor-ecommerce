import connectDb from "@/lib/connectDB";
import {
  getVisualSearchModelName,
  visualSearchInCatalog,
} from "@/lib/visualSearch/clipSearch";
import { ensureCatalogIndexed } from "@/lib/visualSearch/productIndexer";
import Product from "@/model/product.model";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 180;

export async function POST(req: NextRequest) {
  try {
    await connectDb();

    const formData = await req.formData();
    const file = formData.get("image") as File | null;
    if (!file) {
      return NextResponse.json({ message: "image file required" }, { status: 400 });
    }

    await ensureCatalogIndexed();

    const products = await Product.find({
      isActive: true,
      verificationStatus: "approved",
      visualEmbeddings: { $exists: true, $not: { $size: 0 } },
    })
      .populate("vendor", "name shopName")
      .lean();

    const blob = new Blob([await file.arrayBuffer()], {
      type: file.type || "image/jpeg",
    });

    const result = await visualSearchInCatalog(blob, products);

    return NextResponse.json({
      found: result.found,
      message: result.message,
      model: getVisualSearchModelName(),
      matchType: "clip-catalog-indexed",
      detectedCategory: result.detectedCategory,
      topScore: result.topScore,
      products: result.products.map((r) => ({
        ...r.product,
        visualScore: r.score,
      })),
    });
  } catch (error) {
    console.error("Visual search error:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Visual search failed" },
      { status: 500 }
    );
  }
}
