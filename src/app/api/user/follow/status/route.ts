import { auth } from "@/auth";
import connectDb from "@/lib/connectDB";
import User from "@/model/user.model";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    await connectDb();
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ following: false }, { status: 200 });
    }

    const vendorId = req.nextUrl.searchParams.get("vendorId");
    if (!vendorId) {
      return NextResponse.json({ message: "vendorId required" }, { status: 400 });
    }

    const user = await User.findById(session.user.id);
    const following = user?.followingVendors?.some((id: unknown) => String(id) === vendorId) ?? false;

    return NextResponse.json({ following }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: `failed ${error}` }, { status: 500 });
  }
}
