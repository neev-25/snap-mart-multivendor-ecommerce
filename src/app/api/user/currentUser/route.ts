import { safeAuth } from "@/lib/safeAuth";
import connectDb from "@/lib/connectDB";
import User from "@/model/user.model";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await safeAuth();
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDb();
    const user = await User.findOne({ email: session.user.email }).select("-password");
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: `get currentUser error ${error}` },
      { status: 500 }
    );
  }
}
