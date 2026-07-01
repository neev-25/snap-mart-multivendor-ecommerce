import { buildIdentityLabel, findSameProductListings } from "./productMatch";

export interface PricingPeer {
  productId: string;
  title: string;
  price: number;
  avgRating: number;
  reviewCount: number;
  vendorName?: string;
  orderCount: number;
  matchScore: number;
}

export interface VendorPricingInsight {
  productId: string;
  title: string;
  currentPrice: number;
  suggestedMin: number;
  suggestedMax: number;
  suggestedOptimal: number;
  marketMedian: number;
  marketMin: number;
  marketMax: number;
  peerCount: number;
  position: "below_market" | "at_market" | "above_market";
  insight: string;
  avgRating: number;
  productIdentity: string;
  sameProductSellers: number;
}

export interface UserPriceComparison {
  productId: string;
  title: string;
  price: number;
  avgRating: number;
  reviewCount: number;
  vendorName?: string;
  similarityScore: number;
  valueScore: number;
  priceDiff: number;
  priceDiffPct: number;
  verdict: "best_value" | "cheapest" | "premium" | "same_product";
  isCurrentListing?: boolean;
}

export interface PricePredictorResult {
  productIdentity: string;
  matchType: "same_product";
  currentListing: {
    productId: string;
    title: string;
    price: number;
    vendorName?: string;
    avgRating: number;
  };
  fairPrice: number;
  priceSummary: string;
  listingCount: number;
  pendingMatchesCount: number;
  cheapestOffer: UserPriceComparison | null;
  comparisons: UserPriceComparison[];
}

function median(values: number[]): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function avgRating(reviews?: { rating?: number }[]): number {
  if (!reviews?.length) return 0;
  return reviews.reduce((s, r) => s + (r.rating ?? 3), 0) / reviews.length;
}

function vendorName(vendor: unknown): string | undefined {
  if (vendor && typeof vendor === "object") {
    const v = vendor as { shopName?: string; name?: string };
    return v.shopName || v.name;
  }
  return undefined;
}

export function buildVendorPricingInsight(
  product: {
    _id: string;
    title: string;
    price: number;
    reviews?: { rating?: number }[];
  },
  peers: PricingPeer[]
): VendorPricingInsight {
  const prices = peers.map((p) => p.price).filter((p) => p > 0);
  const marketMedian = median(prices);
  const marketMin = prices.length ? Math.min(...prices) : product.price;
  const marketMax = prices.length ? Math.max(...prices) : product.price;

  const productRating = avgRating(product.reviews) || 3;
  const peerRatings = peers.map((p) => p.avgRating).filter((r) => r > 0);
  const avgPeerRating = peerRatings.length
    ? peerRatings.reduce((a, b) => a + b, 0) / peerRatings.length
    : 3;

  const ratingFactor = productRating >= avgPeerRating ? 1.05 : 0.95;
  const suggestedOptimal = peers.length ? Math.round(marketMedian * ratingFactor) : product.price;
  const suggestedMin = peers.length ? Math.round(marketMin * 0.98) : product.price;
  const suggestedMax = peers.length ? Math.round(marketMax * 1.02) : product.price;

  let position: VendorPricingInsight["position"] = "at_market";
  if (peers.length && product.price < marketMedian * 0.95) position = "below_market";
  else if (peers.length && product.price > marketMedian * 1.05) position = "above_market";

  const identity = buildIdentityLabel(product.title);

  let insight = "";
  if (peers.length === 0) {
    insight = `You are the only seller for "${identity}" on SnapMart — set a competitive price.`;
  } else if (position === "below_market") {
    insight = `${peers.length} other seller(s) list the same product. You're ${Math.round(((marketMedian - product.price) / marketMedian) * 100)}% below them — good for sales, margin may be low.`;
  } else if (position === "above_market") {
    insight = `${peers.length} seller(s) offer the same product cheaper (from ₹${marketMin}). Consider ₹${suggestedOptimal} or highlight better ratings/service.`;
  } else {
    insight = `Aligned with ${peers.length} other seller(s) for "${identity}". Market median: ₹${Math.round(marketMedian)}.`;
  }

  return {
    productId: String(product._id),
    title: product.title,
    currentPrice: product.price,
    suggestedMin,
    suggestedMax,
    suggestedOptimal,
    marketMedian: Math.round(marketMedian),
    marketMin,
    marketMax,
    peerCount: peers.length,
    position,
    insight,
    avgRating: Number(productRating.toFixed(1)),
    productIdentity: identity,
    sameProductSellers: peers.length + 1,
  };
}

export function buildPricePredictorResult(
  target: {
    _id: string;
    title: string;
    price: number;
    reviews?: { rating?: number }[];
    vendor?: unknown;
  },
  allCandidates: {
    _id: string;
    title: string;
    price: number;
    reviews?: { rating?: number }[];
    vendor?: unknown;
  }[],
  options?: { pendingMatchesCount?: number }
): PricePredictorResult {
  const identity = buildIdentityLabel(target.title);
  const targetRating = avgRating(target.reviews);
  const pendingMatchesCount = options?.pendingMatchesCount ?? 0;

  const sameProduct = findSameProductListings(target, allCandidates);

  const comparisons: UserPriceComparison[] = sameProduct.map((c) => {
    const r = avgRating(c.reviews);
    const reviewCount = c.reviews?.length ?? 0;
    const priceDiff = c.price - target.price;
    const priceDiffPct = target.price > 0 ? Math.round((priceDiff / target.price) * 100) : 0;
    const valueScore = c.price > 0 ? (r || 3) / c.price : 0;

    let verdict: UserPriceComparison["verdict"] = "same_product";
    if (c.price < target.price * 0.98 && r >= targetRating - 0.5) verdict = "cheapest";
    else if (valueScore > (targetRating || 3) / Math.max(target.price, 1) * 1.08)
      verdict = "best_value";
    else if (c.price > target.price * 1.08 && r >= 4) verdict = "premium";

    return {
      productId: String(c._id),
      title: String(c.title ?? "Product listing"),
      price: Number(c.price) || 0,
      avgRating: Number(r.toFixed(1)),
      reviewCount,
      vendorName: vendorName(c.vendor),
      similarityScore: c.matchScore,
      valueScore: Number(valueScore.toFixed(4)),
      priceDiff,
      priceDiffPct,
      verdict,
    };
  });

  comparisons.sort((a, b) => a.price - b.price);

  const prediction = predictFairPriceFromListings(
    target.price,
    comparisons,
    pendingMatchesCount,
    identity
  );

  const cheapestOffer =
    comparisons.length > 0
      ? comparisons[0].price <= target.price
        ? comparisons[0]
        : {
            productId: String(target._id),
            title: target.title,
            price: target.price,
            avgRating: Number(targetRating.toFixed(1)),
            reviewCount: target.reviews?.length ?? 0,
            vendorName: vendorName(target.vendor),
            similarityScore: 1,
            valueScore: 0,
            priceDiff: 0,
            priceDiffPct: 0,
            verdict: "cheapest" as const,
            isCurrentListing: true,
          }
      : null;

  return {
    productIdentity: identity,
    matchType: "same_product",
    currentListing: {
      productId: String(target._id),
      title: String(target.title ?? "Product listing"),
      price: Number(target.price) || 0,
      vendorName: vendorName(target.vendor),
      avgRating: Number(targetRating.toFixed(1)),
    },
    fairPrice: prediction.fairPrice,
    priceSummary: prediction.summary,
    listingCount: comparisons.length + 1,
    pendingMatchesCount,
    cheapestOffer,
    comparisons,
  };
}

function predictFairPriceFromListings(
  currentPrice: number,
  comparisons: UserPriceComparison[],
  pendingMatchesCount = 0,
  productIdentity = ""
): { fairPrice: number; summary: string } {
  if (!comparisons.length) {
    if (pendingMatchesCount > 0) {
      return {
        fairPrice: currentPrice,
        summary: `${pendingMatchesCount} matching listing(s) from other seller(s) are waiting for admin approval. Once approved, they will appear here for price comparison.`,
      };
    }
    return {
      fairPrice: currentPrice,
      summary: `No other approved seller lists "${productIdentity || "this product"}" on SnapMart yet. New listings must be approved by admin before they show in comparisons.`,
    };
  }

  const allPrices = [currentPrice, ...comparisons.map((c) => c.price)];
  const weighted = comparisons.slice(0, 6).map((c) => ({
    price: c.price,
    weight: c.similarityScore * (1 + c.avgRating / 5),
  }));
  weighted.push({ price: currentPrice, weight: 1 });

  const totalW = weighted.reduce((s, w) => s + w.weight, 0);
  const fairPrice = Math.round(
    weighted.reduce((s, w) => s + w.price * w.weight, 0) / totalW
  );

  const minP = Math.min(...allPrices);
  const maxP = Math.max(...allPrices);
  const diff = currentPrice - fairPrice;
  const pct = fairPrice > 0 ? Math.round((diff / fairPrice) * 100) : 0;

  let summary = "";
  if (comparisons.length === 1) {
    const other = comparisons[0];
    if (currentPrice <= other.price) {
      summary = `Same product from ${other.vendorName || "another seller"} is ₹${other.price} (${other.priceDiffPct > 0 ? "+" : ""}${other.priceDiffPct}%). This listing is the better price.`;
    } else {
      summary = `Same product is ₹${other.price - currentPrice} cheaper at ${other.vendorName || "another seller"}. Fair market price ~₹${fairPrice}.`;
    }
  } else if (currentPrice === minP) {
    summary = `Best price among ${comparisons.length + 1} sellers for this product (lowest: ₹${minP}, highest: ₹${maxP}). Fair estimate ~₹${fairPrice}.`;
  } else if (pct >= 10) {
    summary = `This seller is ~${pct}% above fair price (₹${fairPrice}). ${comparisons.length} other seller(s) list the same product from ₹${minP}.`;
  } else if (pct <= -10) {
    summary = `Good deal — ~${Math.abs(pct)}% below fair price (₹${fairPrice}). Compare ${comparisons.length} other seller(s).`;
  } else {
    summary = `Price is fair vs ${comparisons.length + 1} sellers (range ₹${minP}–₹${maxP}, estimate ~₹${fairPrice}).`;
  }

  return { fairPrice, summary };
}

/** @deprecated use buildPricePredictorResult */
export function buildUserPriceComparisons(
  target: Parameters<typeof buildPricePredictorResult>[0],
  candidates: Parameters<typeof buildPricePredictorResult>[1]
): UserPriceComparison[] {
  return buildPricePredictorResult(target, candidates).comparisons;
}

/** @deprecated */
export function predictFairPrice(
  target: { price: number; reviews?: { rating?: number }[] },
  comparisons: UserPriceComparison[]
): { fairPrice: number; summary: string } {
  return predictFairPriceFromListings(target.price, comparisons);
}

export { matchSameProduct, buildIdentityLabel } from "./productMatch";
