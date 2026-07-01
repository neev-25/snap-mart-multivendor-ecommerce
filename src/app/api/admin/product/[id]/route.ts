import { auth } from "@/auth";
import connectDb from "@/lib/connectDB";
import Product from "@/model/product.model";
import User from "@/model/user.model";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDb();
    const session = await auth();
    const adminUser = await User.findById(session?.user?.id);
    if (!adminUser || adminUser.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const product = await Product.findById(id).populate("vendor", "name email shopName");
    if (!product) {
      return NextResponse.json({ message: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(product, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: `Failed to fetch product ${error}` },
      { status: 500 }
    );
  }
}
