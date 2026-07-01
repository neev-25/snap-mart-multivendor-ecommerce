import connectDb from "@/lib/connectDB";
import { sendPasswordResetEmail } from "@/lib/mailer";
import User from "@/model/user.model";
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

function baseUrl() {
  return process.env.NEXT_BASE_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
}

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    const { email } = await req.json();

    if (!email?.trim()) {
      return NextResponse.json({ message: "Email is required" }, { status: 400 });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });

    // Always respond success to avoid email enumeration
    if (!user || !user.password) {
      return NextResponse.json(
        { message: "If that email exists, a reset link has been sent." },
        { status: 200 }
      );
    }

    const token = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = crypto.createHash("sha256").update(token).digest("hex");
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    const resetUrl = `${baseUrl()}/reset-password?token=${token}`;

    await sendPasswordResetEmail({
      email: user.email,
      name: user.name,
      resetUrl,
    });

    return NextResponse.json(
      { message: "If that email exists, a reset link has been sent." },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: `Failed to send reset email: ${error}` },
      { status: 500 }
    );
  }
}
