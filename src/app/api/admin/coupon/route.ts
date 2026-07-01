import { auth } from "@/auth";
import connectDb from "@/lib/connectDB";
import Coupon from "@/model/coupon.model";
import User from "@/model/user.model";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    await connectDb();
    const session = await auth();
    const admin = await User.findById(session?.user?.id);
    if (!admin || admin.role !== "admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const coupons = await Coupon.find().sort({ createdAt: -1 });
    return NextResponse.json(coupons, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: `failed ${error}` }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    const session = await auth();
    const admin = await User.findById(session?.user?.id);
    if (!admin || admin.role !== "admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { code, discountType, discountValue, minOrderAmount, maxUses, expiresAt, isActive } =
      await req.json();

    if (!code || !discountType || !discountValue) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    const coupon = await Coupon.create({
      code: code.toUpperCase(),
      discountType,
      discountValue,
      minOrderAmount: minOrderAmount || 0,
      maxUses,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      isActive: isActive !== false,
    });

    return NextResponse.json(coupon, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: `failed ${error}` }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await connectDb();
    const session = await auth();
    const admin = await User.findById(session?.user?.id);
    if (!admin || admin.role !== "admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { couponId, isActive } = await req.json();
    if (!couponId || typeof isActive !== "boolean") {
      return NextResponse.json(
        { message: "couponId and isActive (boolean) required" },
        { status: 400 }
      );
    }

    const coupon = await Coupon.findByIdAndUpdate(
      couponId,
      { isActive },
      { new: true }
    );

    if (!coupon) {
      return NextResponse.json({ message: "Coupon not found" }, { status: 404 });
    }

    return NextResponse.json(coupon, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: `failed ${error}` }, { status: 500 });
  }
}
