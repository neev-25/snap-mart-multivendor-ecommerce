import { safeAuth } from "@/lib/safeAuth";
import connectDb from "@/lib/connectDB";
import User from "@/model/user.model";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    const { phone, role } = await req.json();
    const session = await safeAuth();

    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!phone || !role) {
      return NextResponse.json({ message: "Phone and role are required" }, { status: 400 });
    }

    if (!/^\d{10}$/.test(String(phone))) {
      return NextResponse.json(
        { message: "Enter a valid 10-digit phone number" },
        { status: 400 }
      );
    }

    if (!["user", "vendor", "admin"].includes(role)) {
      return NextResponse.json({ message: "Invalid role selected" }, { status: 400 });
    }

    const currentUser = await User.findOne({ email: session.user.email });
    if (!currentUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    if (role === "admin") {
      const existingAdmin = await User.findOne({ role: "admin" });
      if (existingAdmin && String(existingAdmin._id) !== String(currentUser._id)) {
        return NextResponse.json({ message: "Admin already exists" }, { status: 400 });
      }
    }

    const update: { phone: string; role: string; requestedAt?: Date } = { phone, role };
    if (role === "vendor") {
      update.requestedAt = new Date();
    }

    const user = await User.findOneAndUpdate(
      { email: session.user.email },
      update,
      { returnDocument: "after" }
    ).select("-password");

    if (!user) {
      return NextResponse.json({ message: "user is not found" }, { status: 404 });
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: `edit role and phone error ${error}` },
      { status: 500 }
    );
  }
}
