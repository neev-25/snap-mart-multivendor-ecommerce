import { auth } from "@/auth";
import connectDb from "@/lib/connectDB";
import { notifyOrderPlaced } from "@/lib/notifyHelpers";
import { orderErrorResponse, placeOrder } from "@/lib/placeOrder";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { productId, quantity, address, couponCode } = await req.json();

    if (!productId || !quantity) {
      return NextResponse.json(
        { message: "ProductId and quantity required" },
        { status: 400 }
      );
    }

    if (
      !address?.name ||
      !address?.phone ||
      !address?.address ||
      !address?.city ||
      !address?.pincode
    ) {
      return NextResponse.json(
        { message: "All address fields are required" },
        { status: 400 }
      );
    }

    const order = await placeOrder({
      userId: session.user.id,
      productId,
      quantity,
      address,
      paymentMethod: "cod",
      couponCode,
    });

    void notifyOrderPlaced(order._id.toString());

    return NextResponse.json(
      { message: "COD Order placed successfully.", order },
      { status: 201 }
    );
  } catch (error) {
    const err = orderErrorResponse(error);
    return NextResponse.json({ message: err.message }, { status: err.status });
  }
}
