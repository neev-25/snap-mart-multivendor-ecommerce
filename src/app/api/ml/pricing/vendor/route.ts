import { auth } from "@/auth";
import connectDb from "@/lib/connectDB";
import { buildVendorPricingInsight, PricingPeer } from "@/lib/ml/pricing";
import { findSameProductListings } from "@/lib/ml/productMatch";
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
    if (!user || user.role !== "vendor") {
      return NextResponse.json({ message: "Vendor only" }, { status: 403 });
    }

    const vendorProducts = await Product.find({ vendor: user._id });
    const allActive = await Product.find({
      verificationStatus: "approved",
      isActive: true,
    }).populate("vendor", "shopName name");

    const orderCounts = await Order.aggregate([
      { $unwind: "$products" },
      {
        $group: {
          _id: "$products.product",
          count: { $sum: "$products.quantity" },
        },
      },
    ]);
    const orderMap = new Map(
      orderCounts.map((o: { _id: unknown; count: number }) => [
        String(o._id),
        o.count,
      ])
    );

    const insights = vendorProducts.map((product) => {
      const sameListings = findSameProductListings(product, allActive);

      const peers: PricingPeer[] = sameListings.map((p) => {
        const reviews = p.reviews || [];
        const avgRating = reviews.length
          ? reviews.reduce((s: number, r: { rating?: number }) => s + (r.rating ?? 3), 0) /
            reviews.length
          : 0;
        const vendor = p.vendor as { shopName?: string; name?: string };
        return {
          productId: String(p._id),
          title: p.title,
          price: p.price,
          avgRating,
          reviewCount: reviews.length,
          vendorName: vendor?.shopName || vendor?.name,
          orderCount: orderMap.get(String(p._id)) || 0,
          matchScore: p.matchScore,
        };
      });

      return buildVendorPricingInsight(
        {
          _id: String(product._id),
          title: product.title,
          price: product.price,
          reviews: product.reviews,
        },
        peers
      );
    });

    return NextResponse.json({ insights }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: `Pricing analysis failed: ${error}` },
      { status: 500 }
    );
  }
}
