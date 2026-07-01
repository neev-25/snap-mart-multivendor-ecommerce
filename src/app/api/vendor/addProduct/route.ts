import { auth } from "@/auth";
import uploadOnCloudinary from "@/lib/cloudinary";
import connectDb from "@/lib/connectDB";
import { validateCommissionPercent } from "@/lib/commissionUtils";
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

    const user = await User.findById(session.user.id);
    if (!user || user.role !== "vendor" || user.verificationStatus !== "approved") {
      return NextResponse.json(
        { message: "Only approved vendors can add products" },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const price = Number(formData.get("price"));
    const stock = Number(formData.get("stock"));
    const category = formData.get("category") as string;
    const isWearable = formData.get("isWearable") === "true";
    const sizes = formData.getAll("sizes");
    const replacementDays = Number(formData.get("replacementDays") || 0);
    const freeDelivery = formData.get("freeDelivery") === "true";
    const warranty = (formData.get("warranty") as string) || "No Warranty";
    const payOnDelivery = formData.get("payOnDelivery") !== "false";
    const vendorCommissionPercent = Number(formData.get("vendorCommissionPercent"));
    const detailsPoints = formData.getAll("detailsPoints");
    const img1 = formData.get("image1") as Blob;
    const img2 = formData.get("image2") as Blob;
    const img3 = formData.get("image3") as Blob;
    const img4 = formData.get("image4") as Blob;

    if (!title || !description || !price || !stock || !category || !img1 || !img2 || !img3 || !img4) {
      return NextResponse.json({ message: "All Fields & 4 images required" }, { status: 400 });
    }

    if (isWearable && sizes.length === 0) {
      return NextResponse.json({ message: "Sizes are required for wearable product" }, { status: 400 });
    }

    const commissionError = validateCommissionPercent(vendorCommissionPercent);
    if (commissionError) {
      return NextResponse.json({ message: commissionError }, { status: 400 });
    }

    const image1 = await uploadOnCloudinary(img1);
    const image2 = await uploadOnCloudinary(img2);
    const image3 = await uploadOnCloudinary(img3);
    const image4 = await uploadOnCloudinary(img4);

    const product = await Product.create({
      title,
      description,
      price,
      stock,
      isStockAvailable: stock > 0,
      image1,
      image2,
      image3,
      image4,
      category,
      vendor: session.user.id,
      isWearable,
      sizes: isWearable ? sizes : [],
      replacementDays,
      warranty,
      payOnDelivery,
      freeDelivery,
      detailsPoints,
      vendorCommissionPercent,
      commissionStatus: "pending",
      verificationStatus: "pending",
      isActive: false,
      requestedAt: new Date(),
    });

    await User.findByIdAndUpdate(session.user.id, {
      $push: { vendorProducts: product._id },
    });

    const { notifyNewProduct } = await import("@/lib/notifyHelpers");
    void notifyNewProduct(product._id.toString(), session.user.id);

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: `failed to create new product error ${error}` },
      { status: 500 }
    );
  }
}
