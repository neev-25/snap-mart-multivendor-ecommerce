import { auth } from "@/auth";
import connectDb from "@/lib/connectDB";
import { wishlistIdStrings } from "@/lib/wishlistUtils";
import Product from "@/model/product.model";
import User from "@/model/user.model";
import mongoose from "mongoose";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectDb();
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role && session.user.role !== "user") {
      return NextResponse.json({ wishlist: [], wishlistIds: [] }, { status: 200 });
    }

    const user = await User.findById(session.user.id).select("wishlist");
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const wishlistIds = wishlistIdStrings(user.wishlist as unknown[]);

    if (!wishlistIds.length) {
      return NextResponse.json({ wishlist: [], wishlistIds: [] }, { status: 200 });
    }

    const objectIds = wishlistIds
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id));

    const products = await Product.find({ _id: { $in: objectIds } })
      .populate("vendor", "name shopName")
      .lean();

    const byId = new Map(products.map((p) => [String(p._id), p]));
    const ordered = wishlistIds
      .map((id) => byId.get(id))
      .filter(Boolean);

    const validIds = ordered.map((p) => String(p!._id));

    if (validIds.length !== wishlistIds.length) {
      user.wishlist = validIds.map(
        (id) => new mongoose.Types.ObjectId(id)
      ) as typeof user.wishlist;
      await user.save();
    }

    return NextResponse.json(
      {
        wishlist: JSON.parse(JSON.stringify(ordered)),
        wishlistIds: validIds,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json({ message: `failed ${error}` }, { status: 500 });
  }
}
