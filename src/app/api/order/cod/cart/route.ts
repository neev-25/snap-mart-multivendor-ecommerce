import { auth } from "@/auth";
import connectDb from "@/lib/connectDB";
import { notifyOrderPlaced } from "@/lib/notifyHelpers";
import { orderErrorResponse, placeAllCartOrders } from "@/lib/placeOrder";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { address, couponCode } = await req.json();

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

    const { orders } = await placeAllCartOrders({
      userId: session.user.id,
      address,
      paymentMethod: "cod",
      couponCode,
    });

    for (const order of orders) {
      void notifyOrderPlaced(order._id.toString());
    }

    return NextResponse.json(
      { message: "Cart order placed successfully.", orders },
      { status: 201 }
    );
  } catch (error) {
    const err = orderErrorResponse(error);
    return NextResponse.json({ message: err.message }, { status: err.status });
  }
}
