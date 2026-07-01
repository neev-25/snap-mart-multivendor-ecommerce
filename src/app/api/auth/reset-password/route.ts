import connectDb from "@/lib/connectDB";
import User from "@/model/user.model";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json(
        { message: "Token and new password are required" },
        { status: 400 }
      );
    }

    if (String(password).length < 6) {
      return NextResponse.json(
        { message: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const hashedToken = crypto.createHash("sha256").update(String(token)).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Reset link is invalid or has expired" },
        { status: 400 }
      );
    }

    user.password = await bcrypt.hash(String(password), 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return NextResponse.json({ message: "Password updated successfully" }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: `Failed to reset password: ${error}` },
      { status: 500 }
    );
  }
}
