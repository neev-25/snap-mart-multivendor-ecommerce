import connectDb from "@/lib/connectDB";
import { notifyOrderPlaced } from "@/lib/notifyHelpers";
import {
  getStripeWebhookSecret,
  parseOrderIdsFromMetadata,
  stripeWebhookMisconfiguredResponse,
} from "@/lib/stripeWebhook";
import Order from "@/model/order.model";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const webhookSecret = getStripeWebhookSecret();

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const sig = req.headers.get("stripe-signature");
  const rawBody = await req.text();

  if (!webhookSecret) {
    console.warn(
      "[Stripe webhook] STRIPE_WEBHOOKS_KEY is empty — webhooks will work after you set it on deploy."
    );
    return stripeWebhookMisconfiguredResponse();
  }

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (error) {
    console.error("[Stripe webhook] signature verification failed", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    await connectDb();

    const orderIds = parseOrderIdsFromMetadata(session.metadata ?? undefined);
    if (orderIds.length === 0) {
      console.warn("[Stripe webhook] checkout.session.completed without order metadata");
    }

    for (const orderId of orderIds) {
      const updated = await Order.findByIdAndUpdate(
        orderId,
        {
          isPaid: true,
          "paymentDetails.stripeSessionId": session.id,
          "paymentDetails.stripePaymentId": session.payment_intent,
        },
        { new: true }
      );
      if (updated) {
        void notifyOrderPlaced(orderId);
      }
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
