import { auth } from "@/auth";
import connectDb from "@/lib/connectDB";
import {
  orderErrorResponse,
  placeAllCartOrders,
  rollbackPlacedOrders,
} from "@/lib/placeOrder";
import Order from "@/model/order.model";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

function baseUrl() {
  return process.env.NEXT_BASE_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
}

export async function POST(req: NextRequest) {
  let placed: { orderId: string; productId: string; quantity: number }[] = [];
  let userId: string | null = null;

  try {
    await connectDb();

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { message: "Stripe is not configured. Use Cash on Delivery or set STRIPE_SECRET_KEY." },
        { status: 503 }
      );
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    userId = session.user.id;

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

    const result = await placeAllCartOrders({
      userId: session.user.id,
      address,
      paymentMethod: "stripe",
      couponCode,
    });

    placed = result.placed;
    const orderIds = result.orders.map((o) => o._id.toString());
    const origin = baseUrl();
    const totalAmount = result.totalAmount;

    if (totalAmount <= 0) {
      await Order.updateMany({ _id: { $in: orderIds } }, { isPaid: true });
      return NextResponse.json({ url: `${origin}/order-success` }, { status: 200 });
    }

    const amountPaise = Math.round(totalAmount * 100);
    if (amountPaise < 50) {
      await rollbackPlacedOrders(session.user.id, placed);
      placed = [];
      return NextResponse.json(
        { message: "Order amount is too low for online payment. Try Cash on Delivery." },
        { status: 400 }
      );
    }

    const stripeSession = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      success_url: `${origin}/order-success`,
      cancel_url: `${origin}/order-failed?reason=${encodeURIComponent("Payment was cancelled")}`,
      line_items: [
        {
          price_data: {
            currency: "inr",
            product_data: {
              name: `SnapMart cart (${result.orders.length} item${result.orders.length === 1 ? "" : "s"})`,
            },
            unit_amount: amountPaise,
          },
          quantity: 1,
        },
      ],
      metadata: {
        orderId: orderIds[0] ?? "",
        orderIds: orderIds.join(","),
      },
    });

    if (!stripeSession.url) {
      await rollbackPlacedOrders(session.user.id, placed);
      placed = [];
      return NextResponse.json(
        { message: "Could not start Stripe checkout. Please try again." },
        { status: 502 }
      );
    }

    return NextResponse.json({ url: stripeSession.url }, { status: 200 });
  } catch (error) {
    if (placed.length && userId) {
      await rollbackPlacedOrders(userId, placed);
    }
    const err = orderErrorResponse(error);
    return NextResponse.json({ message: err.message }, { status: err.status });
  }
}
