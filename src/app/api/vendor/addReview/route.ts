import { auth } from "@/auth";
import uploadOnCloudinary from "@/lib/cloudinary";
import connectDb from "@/lib/connectDB";
import Order from "@/model/order.model";
import Product from "@/model/product.model";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const formData = await req.formData();
    const productId = formData.get("productId") as string;
    const rating = Number(formData.get("rating"));
    const comment = formData.get("comment") as string;
    const file = formData.get("image") as File | null;

    if (!productId) {
      return NextResponse.json({ message: "Product ID is required" }, { status: 400 });
    }
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ message: "Rating must be between 1 and 5" }, { status: 400 });
    }
    if (!comment?.trim()) {
      return NextResponse.json({ message: "Comment is required" }, { status: 400 });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return NextResponse.json({ message: "Product not found" }, { status: 404 });
    }

    const hasDeliveredOrder = await Order.exists({
      buyer: userId,
      orderStatus: "delivered",
      "products.product": productId,
    });

    if (!hasDeliveredOrder) {
      return NextResponse.json(
        { message: "You can review only after your order is delivered" },
        { status: 403 }
      );
    }

    const alreadyReviewed = product.reviews?.some(
      (r: { user: unknown }) => String(r.user) === userId
    );
    if (alreadyReviewed) {
      return NextResponse.json({ message: "You already reviewed this product" }, { status: 400 });
    }

    let imageUrl;
    if (file) {
      imageUrl = await uploadOnCloudinary(file);
    }

    product.reviews.push({
      rating,
      user: userId as unknown as import("mongoose").Types.ObjectId,
      comment,
      image: imageUrl,
    });
    await product.save();

    return NextResponse.json({ message: "Review added successfully" }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: `failed to add review ${error}` },
      { status: 500 }
    );
  }
}
