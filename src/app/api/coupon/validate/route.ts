import connectDb from "@/lib/connectDB";
import { validateCoupon } from "@/lib/couponUtils";
import { calculateOrderPricing } from "@/lib/orderPricing";
import Product from "@/model/product.model";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    const { code, productId, quantity = 1 } = await req.json();

    if (!code || !productId) {
      return NextResponse.json({ message: "code and productId required" }, { status: 400 });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return NextResponse.json({ message: "Product not found" }, { status: 404 });
    }

    const prePricing = calculateOrderPricing(product, quantity);
    const couponResult = await validateCoupon(code, prePricing.totalAmount);

    if (!couponResult) {
      return NextResponse.json({ message: "Invalid or expired coupon" }, { status: 400 });
    }

    const pricing = calculateOrderPricing(product, quantity, couponResult.coupon);

    return NextResponse.json(
      {
        valid: true,
        code: couponResult.code,
        couponDiscount: pricing.couponDiscount,
        totalAmount: pricing.totalAmount,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json({ message: `failed ${error}` }, { status: 500 });
  }
}
