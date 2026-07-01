import { auth } from "@/auth";
import connectDb from "@/lib/connectDB";
import Product from "@/model/product.model";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { productId } = await req.json();
    if (!productId) {
      return NextResponse.json({ message: "productId required" }, { status: 400 });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return NextResponse.json({ message: "Product not found" }, { status: 404 });
    }

    if (String(product.vendor) !== session.user.id) {
      return NextResponse.json({ message: "Not allowed" }, { status: 403 });
    }

    if (product.commissionStatus !== "admin_countered") {
      return NextResponse.json(
        { message: "No admin counter-offer to accept" },
        { status: 400 }
      );
    }

    if (product.adminCounterCommissionPercent == null) {
      return NextResponse.json({ message: "Invalid counter-offer" }, { status: 400 });
    }

    product.agreedCommissionPercent = product.adminCounterCommissionPercent;
    product.commissionStatus = "agreed";
    product.verificationStatus = "approved";
    product.approvedAt = new Date();
    product.rejectedReason = undefined;
    product.isUpdateRequest = false;
    product.lastApprovedSnapshot = undefined;
    product.isActive = false;

    await product.save();

    return NextResponse.json(
      {
        message: "Commission accepted. You may now enable the product for customers.",
        product,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: `failed to accept commission ${error}` },
      { status: 500 }
    );
  }
}
