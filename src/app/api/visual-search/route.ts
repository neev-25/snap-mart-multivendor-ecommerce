import connectDb from "@/lib/connectDB";
import {
  getVisualSearchModelName,
  searchCatalogByEmbedding,
  visualSearchInCatalog,
} from "@/lib/visualSearch/clipSearch";
import Product from "@/model/product.model";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

async function loadIndexedProducts() {
  return Product.find({
    isActive: true,
    verificationStatus: "approved",
    visualEmbeddings: { $exists: true, $not: { $size: 0 } },
  })
    .populate("vendor", "name shopName")
    .lean();
}

export async function POST(req: NextRequest) {
  try {
    await connectDb();

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const body = await req.json();
      const embedding = body?.embedding;
      if (!Array.isArray(embedding) || embedding.length === 0) {
        return NextResponse.json(
          { message: "embedding array required" },
          { status: 400 }
        );
      }

      const products = await loadIndexedProducts();
      const result = searchCatalogByEmbedding(embedding, products);

      return NextResponse.json({
        found: result.found,
        message: result.message,
        model: getVisualSearchModelName(),
        matchType: "clip-browser-embedding",
        detectedCategory: result.detectedCategory,
        topScore: result.topScore,
        products: result.products.map((r) => ({
          ...r.product,
          visualScore: r.score,
        })),
      });
    }

    const formData = await req.formData();
    const file = formData.get("image") as File | null;
    if (!file) {
      return NextResponse.json({ message: "image file required" }, { status: 400 });
    }

    const products = await loadIndexedProducts();
    const blob = new Blob([await file.arrayBuffer()], {
      type: file.type || "image/jpeg",
    });
    const result = await visualSearchInCatalog(blob, products);

    return NextResponse.json({
      found: result.found,
      message: result.message,
      model: getVisualSearchModelName(),
      matchType: "clip-server-fallback",
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
      {
        message:
          error instanceof Error
            ? error.message
            : "Visual search failed. Try uploading a clear product photo.",
      },
      { status: 500 }
    );
  }
}
