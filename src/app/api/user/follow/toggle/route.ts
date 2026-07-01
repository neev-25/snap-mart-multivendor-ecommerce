import { auth } from "@/auth";
import connectDb from "@/lib/connectDB";
import User from "@/model/user.model";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { vendorId } = await req.json();
    if (!vendorId) {
      return NextResponse.json({ message: "vendorId required" }, { status: 400 });
    }

    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    user.followingVendors = user.followingVendors || [];
    const index = user.followingVendors.findIndex((id: unknown) => String(id) === vendorId);
    let following = false;

    if (index >= 0) {
      user.followingVendors.splice(index, 1);
      following = false;
    } else {
      user.followingVendors.push(vendorId);
      following = true;
    }

    await user.save();
    return NextResponse.json({ following, message: following ? "Following shop" : "Unfollowed shop" });
  } catch (error) {
    return NextResponse.json({ message: `failed ${error}` }, { status: 500 });
  }
}
