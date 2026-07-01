export type SentimentLabel = "positive" | "neutral" | "negative";

export type ReviewAspect = "quality" | "delivery" | "price" | "packaging" | "service";

export interface AspectSentiment {
  aspect: ReviewAspect;
  score: number;
  label: SentimentLabel;
  mentionCount: number;
}

export interface ReviewSentimentResult {
  score: number;
  label: SentimentLabel;
  rating: number;
  comment: string;
  aspects: AspectSentiment[];
}

export interface ProductSentimentSummary {
  productId: string;
  title: string;
  reviewCount: number;
  avgRating: number;
  avgSentiment: number;
  sentimentLabel: SentimentLabel;
  aspects: AspectSentiment[];
  recentReviews: ReviewSentimentResult[];
}

const POSITIVE = new Set([
  "good", "great", "excellent", "amazing", "love", "perfect", "best", "awesome",
  "nice", "happy", "satisfied", "recommend", "worth", "quality", "fast", "smooth",
  "beautiful", "fantastic", "superb", "delighted", "impressed", "comfortable",
]);

const NEGATIVE = new Set([
  "bad", "poor", "worst", "terrible", "awful", "broken", "damaged", "fake",
  "slow", "late", "disappointed", "waste", "cheap", "defect", "return", "refund",
  "missing", "wrong", "horrible", "useless", "never", "not good", "don't buy",
]);

const ASPECT_KEYWORDS: Record<ReviewAspect, string[]> = {
  quality: ["quality", "build", "material", "durable", " sturdy", "broken", "defect", "fake"],
  delivery: ["delivery", "deliver", "shipping", "courier", "late", "delay", "packaging arrived"],
  price: ["price", "cost", "expensive", "cheap", "value", "worth", "money", "overpriced"],
  packaging: ["packaging", "packed", "box", "damage", "sealed", "wrap"],
  service: ["service", "support", "vendor", "seller", "response", "customer"],
};

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

export function analyzeReviewSentiment(
  comment: string,
  rating: number = 3
): ReviewSentimentResult {
  const tokens = tokenize(comment || "");
  let pos = 0;
  let neg = 0;

  for (const t of tokens) {
    if (POSITIVE.has(t)) pos++;
    if (NEGATIVE.has(t)) neg++;
  }

  const textScore = tokens.length
    ? Math.max(-1, Math.min(1, (pos - neg) / Math.max(tokens.length * 0.3, 1)))
    : 0;
  const ratingNorm = (Math.max(1, Math.min(5, rating)) - 3) / 2;
  const score = Math.max(-1, Math.min(1, ratingNorm * 0.55 + textScore * 0.45));

  const lower = (comment || "").toLowerCase();
  const aspects: AspectSentiment[] = (Object.keys(ASPECT_KEYWORDS) as ReviewAspect[]).map(
    (aspect) => {
      const keywords = ASPECT_KEYWORDS[aspect];
      const mentionCount = keywords.filter((k) => lower.includes(k.trim())).length;
      let aspectScore = score;
      if (mentionCount > 0) {
        const localPos = keywords.filter((k) => POSITIVE.has(k.trim())).length;
        const localNeg = keywords.filter((k) => NEGATIVE.has(k.trim()) || k.includes("broken") || k.includes("late")).length;
        aspectScore = mentionCount > 0 ? score + (localPos - localNeg) * 0.1 : score;
      }
      aspectScore = Math.max(-1, Math.min(1, aspectScore));
      return {
        aspect,
        score: aspectScore,
        label: sentimentLabel(aspectScore),
        mentionCount,
      };
    }
  );

  return {
    score,
    label: sentimentLabel(score),
    rating,
    comment: comment || "",
    aspects: aspects.filter((a) => a.mentionCount > 0),
  };
}

export function sentimentLabel(score: number): SentimentLabel {
  if (score >= 0.15) return "positive";
  if (score <= -0.15) return "negative";
  return "neutral";
}

export function aggregateProductSentiment(
  productId: string,
  title: string,
  reviews: { rating?: number; comment?: string }[]
): ProductSentimentSummary | null {
  if (!reviews.length) return null;

  const analyzed = reviews.map((r) =>
    analyzeReviewSentiment(r.comment || "", r.rating ?? 3)
  );

  const avgSentiment =
    analyzed.reduce((s, r) => s + r.score, 0) / analyzed.length;
  const avgRating =
    reviews.reduce((s, r) => s + (r.rating ?? 3), 0) / reviews.length;

  const aspectMap = new Map<ReviewAspect, { total: number; count: number; mentions: number }>();
  for (const r of analyzed) {
    for (const a of r.aspects) {
      const cur = aspectMap.get(a.aspect) || { total: 0, count: 0, mentions: 0 };
      cur.total += a.score;
      cur.count += 1;
      cur.mentions += a.mentionCount;
      aspectMap.set(a.aspect, cur);
    }
  }

  const aspects: AspectSentiment[] = [...aspectMap.entries()].map(([aspect, v]) => {
    const score = v.total / v.count;
    return {
      aspect,
      score,
      label: sentimentLabel(score),
      mentionCount: v.mentions,
    };
  });

  return {
    productId,
    title,
    reviewCount: reviews.length,
    avgRating: Number(avgRating.toFixed(1)),
    avgSentiment: Number(avgSentiment.toFixed(2)),
    sentimentLabel: sentimentLabel(avgSentiment),
    aspects,
    recentReviews: analyzed.slice(-5),
  };
}

export function aggregatePlatformSentiment(
  products: ProductSentimentSummary[]
) {
  if (!products.length) {
    return {
      totalReviews: 0,
      avgSentiment: 0,
      sentimentLabel: "neutral" as SentimentLabel,
      positivePct: 0,
      negativePct: 0,
      topAspects: [] as AspectSentiment[],
    };
  }

  const totalReviews = products.reduce((s, p) => s + p.reviewCount, 0);
  const avgSentiment =
    products.reduce((s, p) => s + p.avgSentiment * p.reviewCount, 0) / totalReviews;

  const positive = products.filter((p) => p.sentimentLabel === "positive").length;
  const negative = products.filter((p) => p.sentimentLabel === "negative").length;

  const aspectTotals = new Map<ReviewAspect, { score: number; count: number }>();
  for (const p of products) {
    for (const a of p.aspects) {
      const cur = aspectTotals.get(a.aspect) || { score: 0, count: 0 };
      cur.score += a.score;
      cur.count += 1;
      aspectTotals.set(a.aspect, cur);
    }
  }

  const topAspects = [...aspectTotals.entries()]
    .map(([aspect, v]) => ({
      aspect,
      score: v.score / v.count,
      label: sentimentLabel(v.score / v.count),
      mentionCount: v.count,
    }))
    .sort((a, b) => b.mentionCount - a.mentionCount);

  return {
    totalReviews,
    avgSentiment: Number(avgSentiment.toFixed(2)),
    sentimentLabel: sentimentLabel(avgSentiment),
    positivePct: Math.round((positive / products.length) * 100),
    negativePct: Math.round((negative / products.length) * 100),
    topAspects,
  };
}
