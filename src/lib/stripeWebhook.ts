import { NextResponse } from "next/server";

/** Stripe webhook signing secret — set STRIPE_WEBHOOKS_KEY in production (Stripe Dashboard → Webhooks). */
export function getStripeWebhookSecret(): string {
  return (
    process.env.STRIPE_WEBHOOKS_KEY?.trim() ||
    process.env.STRIPE_WEBHOOK_SECRET?.trim() ||
    process.env.STRIPE_WEBHOOK_KEY?.trim() ||
    ""
  );
}

export function parseOrderIdsFromMetadata(metadata: Record<string, string> | null | undefined) {
  if (!metadata) return [] as string[];
  const ids = new Set<string>();
  if (metadata.orderIds) {
    metadata.orderIds.split(",").forEach((id) => {
      const trimmed = id.trim();
      if (trimmed) ids.add(trimmed);
    });
  }
  if (metadata.orderId?.trim()) {
    ids.add(metadata.orderId.trim());
  }
  return [...ids];
}

export function stripeWebhookMisconfiguredResponse() {
  return NextResponse.json(
    {
      error:
        "Stripe webhook secret is not configured. Set STRIPE_WEBHOOKS_KEY when deploying.",
    },
    { status: 503 }
  );
}
