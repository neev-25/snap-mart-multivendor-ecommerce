import { auth } from "@/auth";
import connectDb from "@/lib/connectDB";
import { validateCoupon } from "@/lib/couponUtils";
import { calculateOrderPricing } from "@/lib/orderPricing";
import { cartItemProductId } from "@/lib/cartUtils";
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

    const { code } = await req.json();
    if (!code?.trim()) {
      return NextResponse.json({ message: "Coupon code required" }, { status: 400 });
    }

    const user = await User.findById(session.user.id);
    if (!user?.cart?.length) {
      return NextResponse.json({ message: "Cart is empty" }, { status: 400 });
    }

    let combinedPreTotal = 0;
    for (const item of user.cart) {
      const product = await Product.findById(cartItemProductId(item));
      if (!product) continue;
      combinedPreTotal += calculateOrderPricing(product, item.quantity).totalAmount;
    }

    const couponResult = await validateCoupon(code.trim(), combinedPreTotal);
    if (!couponResult) {
      return NextResponse.json({ message: "Invalid or expired coupon" }, { status: 400 });
    }

    const c = couponResult.coupon;
    let couponDiscount =
      c.discountType === "percent"
        ? Math.round((combinedPreTotal * c.discountValue) / 100)
        : c.discountValue;
    couponDiscount = Math.min(Math.max(couponDiscount, 0), combinedPreTotal);

    return NextResponse.json(
      {
        code: couponResult.code,
        couponDiscount,
        totalAmount: combinedPreTotal - couponDiscount,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json({ message: `Coupon validation failed: ${error}` }, { status: 500 });
  }
}
