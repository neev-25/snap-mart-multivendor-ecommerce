import { auth } from "@/auth";
import connectDb from "@/lib/connectDB";
import {
  aggregatePlatformSentiment,
  aggregateProductSentiment,
} from "@/lib/ml/sentiment";
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
    if (!user || (user.role !== "vendor" && user.role !== "admin")) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const filter =
      user.role === "vendor"
        ? { vendor: user._id, "reviews.0": { $exists: true } }
        : { "reviews.0": { $exists: true } };

    const products = await Product.find(filter).select("title reviews vendor");

    const summaries = products
      .map((p) =>
        aggregateProductSentiment(String(p._id), p.title, p.reviews || [])
      )
      .filter(Boolean);

    const platform = aggregatePlatformSentiment(summaries as NonNullable<(typeof summaries)[0]>[]);

    return NextResponse.json(
      {
        role: user.role,
        platform,
        products: summaries,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: `Sentiment analysis failed: ${error}` },
      { status: 500 }
    );
  }
}
