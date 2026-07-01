import connectDb from "@/lib/connectDB";
import { buildPricePredictorResult } from "@/lib/ml/pricing";
import { findSameProductListings } from "@/lib/ml/productMatch";
import Product from "@/model/product.model";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    await connectDb();
    const productId = req.nextUrl.searchParams.get("productId");
    if (!productId) {
      return NextResponse.json({ message: "productId required" }, { status: 400 });
    }

    const product = await Product.findById(productId)
      .populate("vendor", "shopName name")
      .lean();

    if (!product || !product.isActive || product.verificationStatus !== "approved") {
      return NextResponse.json({ message: "Product not found" }, { status: 404 });
    }

    const [candidates, pendingCandidates] = await Promise.all([
      Product.find({
        verificationStatus: "approved",
        isActive: true,
        _id: { $ne: product._id },
      })
        .populate("vendor", "shopName name")
        .select("title price reviews vendor")
        .lean(),
      Product.find({
        verificationStatus: "pending",
        _id: { $ne: product._id },
      })
        .select("title")
        .lean(),
    ]);

    const pendingMatches = findSameProductListings(product, pendingCandidates);

    const result = buildPricePredictorResult(product, candidates, {
      pendingMatchesCount: pendingMatches.length,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: `Price comparison failed: ${error}` },
      { status: 500 }
    );
  }
}
