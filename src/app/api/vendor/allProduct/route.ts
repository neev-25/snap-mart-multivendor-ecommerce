import { safeAuth } from "@/lib/safeAuth";
import connectDb from "@/lib/connectDB";
import Product from "@/model/product.model";
import User from "@/model/user.model";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectDb();
    const session = await safeAuth();
    let role: string | null = null;
    let userId: string | null = null;

    if (session?.user?.id) {
      const user = await User.findById(session.user.id).select("role");
      if (user) {
        role = user.role;
        userId = String(user._id);
      }
    }

    let filter: Record<string, unknown> = {};
    if (role === "admin") {
      filter = {};
    } else if (role === "vendor" && userId) {
      filter = {
        $or: [
          { verificationStatus: "approved", isActive: true },
          { vendor: userId },
        ],
      };
    } else {
      filter = { verificationStatus: "approved", isActive: true };
    }

    const products = await Product.find(filter)
      .populate("vendor", "name email shopName")
      .populate({ path: "reviews.user", select: "name email image" })
      .sort({ createdAt: -1 });

    return NextResponse.json(products, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: `failed to getAll Products ${error}` },
      { status: 500 }
    );
  }
}
