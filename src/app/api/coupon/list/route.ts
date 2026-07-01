import connectDb from "@/lib/connectDB";
import { listAvailableCoupons } from "@/lib/couponUtils";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    await connectDb();
    const subtotal = Number(req.nextUrl.searchParams.get("subtotal") || 0);
    const coupons = await listAvailableCoupons();

    return NextResponse.json(
      {
        coupons: coupons.map((c) => ({
          ...c,
          eligible: subtotal <= 0 || subtotal >= c.minOrderAmount,
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: `Failed to load coupons: ${error}` },
      { status: 500 }
    );
  }
}
