import { auth } from "@/auth";
import connectDb from "@/lib/connectDB";
import { validateCommissionPercent } from "@/lib/commissionUtils";
import { notifyProductStatusChange } from "@/lib/notifyHelpers";
import Product from "@/model/product.model";
import User from "@/model/user.model";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    const session = await auth();
    const adminUser = await User.findById(session?.user?.id);
    if (!adminUser || adminUser.role !== "admin") {
      return NextResponse.json({ message: "Only admin can update product status" }, { status: 403 });
    }

    const { productId, status, rejectedReason, adminCounterCommissionPercent, approvedCommissionPercent } =
      await req.json();

    if (!productId || !status) {
      return NextResponse.json({ message: "productId and status are required" }, { status: 400 });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return NextResponse.json({ message: "Product not found" }, { status: 404 });
    }

    if (status === "approved") {
      const rate =
        product.vendorCommissionPercent ??
        (approvedCommissionPercent != null ? Number(approvedCommissionPercent) : null);

      if (rate == null || Number.isNaN(rate)) {
        return NextResponse.json(
          { message: "Commission rate is required to approve this product" },
          { status: 400 }
        );
      }

      const commissionError = validateCommissionPercent(rate);
      if (commissionError) {
        return NextResponse.json({ message: commissionError }, { status: 400 });
      }

      product.vendorCommissionPercent = product.vendorCommissionPercent ?? rate;
      product.agreedCommissionPercent = rate;
      product.commissionStatus = "agreed";
      product.adminCounterCommissionPercent = undefined;
      product.verificationStatus = "approved";
      product.approvedAt = new Date();
      product.rejectedReason = undefined;
      product.isUpdateRequest = false;
      product.lastApprovedSnapshot = undefined;
      product.isActive = false;
    } else if (status === "counter") {
      const counterRate = Number(adminCounterCommissionPercent);
      const commissionError = validateCommissionPercent(counterRate);
      if (commissionError) {
        return NextResponse.json({ message: commissionError }, { status: 400 });
      }

      product.adminCounterCommissionPercent = counterRate;
      product.commissionStatus = "admin_countered";
      product.agreedCommissionPercent = undefined;
      product.verificationStatus = "pending";
      product.isActive = false;
    } else if (status === "rejected") {
      product.verificationStatus = "rejected";
      product.commissionStatus = "pending";
      product.rejectedReason = rejectedReason || "Rejected by admin";
      product.isActive = false;
    } else {
      return NextResponse.json({ message: "Invalid status" }, { status: 400 });
    }

    await product.save();

    if (status === "approved" || status === "rejected") {
      void notifyProductStatusChange(
        productId,
        status as "approved" | "rejected",
        product.rejectedReason
      );
    }

    return NextResponse.json({ message: "Product status updated", product }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: `product status error ${error}` }, { status: 500 });
  }
}
