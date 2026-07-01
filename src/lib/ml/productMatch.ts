/** Generic words — not product identity */
const STOP_WORDS = new Set([
  "with",
  "and",
  "the",
  "for",
  "new",
  "latest",
  "original",
  "smartphone",
  "mobile",
  "phone",
  "inch",
  "inches",
  "display",
  "screen",
  "black",
  "white",
  "blue",
  "red",
  "green",
  "gold",
  "silver",
  "dual",
  "sim",
  "wifi",
  "bluetooth",
  "available",
  "free",
  "delivery",
  "warranty",
  "pack",
  "box",
  "set",
  "piece",
  "fully",
  "automatic",
  "front",
  "load",
  "top",
  "loading",
  "machine",
  "smart",
  "led",
  "tv",
  "television",
  "refrigerator",
  "fridge",
  "laptop",
  "notebook",
  "tablet",
  "watch",
  "earbuds",
  "headphones",
  "camera",
  "series",
  "edition",
  "5g",
  "4g",
  "lte",
  "android",
  "ios",
]);

/** Variant suffixes — S26 Ultra vs S26 Plus are different SKUs */
const VARIANT_TOKENS = new Set([
  "ultra",
  "plus",
  "pro",
  "max",
  "mini",
  "lite",
  "se",
  "fe",
  "edge",
]);

const BRAND_ALIASES: Record<string, string> = {
  iphone: "apple",
  galaxy: "samsung",
  macbook: "apple",
  ipad: "apple",
  redmi: "xiaomi",
  pocophone: "poco",
  oneplus: "oneplus",
  realme: "realme",
  motorola: "motorola",
};

const KNOWN_BRANDS = new Set([
  "apple",
  "samsung",
  "xiaomi",
  "oneplus",
  "realme",
  "oppo",
  "vivo",
  "motorola",
  "nokia",
  "sony",
  "lg",
  "google",
  "poco",
  "iqoo",
  "nothing",
  "asus",
  "lenovo",
  "hp",
  "dell",
  "acer",
  "whirlpool",
  "lg",
]);

/** s26, a36, iphone17, xm5, 256gb */
const MODEL_TOKEN =
  /\b(iphone\s?\d{1,2}[a-z]*|galaxy\s?[a-z]?\d{1,3}[a-z]*|[a-z]{1,4}\d{2,4}[a-z]*|\d{2,3}\s?gb|\d{2}\s?inch|\d{4})\b/gi;

export interface ProductMatchResult {
  score: number;
  isSameProduct: boolean;
  identityLabel: string;
  sharedModelTokens: string[];
  productKey: string;
}

export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function extractVariants(title: string): string[] {
  const norm = normalizeTitle(title);
  return [...new Set(norm.split(/\s+/).filter((w) => VARIANT_TOKENS.has(w)))];
}

export function extractIdentityTokens(title: string): string[] {
  const norm = normalizeTitle(title);
  const rawTokens = norm.split(/\s+/).filter((w) => w.length > 1);
  const tokens = new Set<string>();

  for (const w of rawTokens) {
    if (STOP_WORDS.has(w)) continue;
    if (VARIANT_TOKENS.has(w)) {
      tokens.add(w);
      continue;
    }
    const alias = BRAND_ALIASES[w];
    tokens.add(alias || w);
  }

  const modelMatches = norm.match(MODEL_TOKEN) || [];
  for (const m of modelMatches) {
    tokens.add(m.replace(/\s+/g, ""));
  }

  for (let i = 0; i < rawTokens.length - 1; i++) {
    const combined = `${rawTokens[i]}${rawTokens[i + 1]}`;
    if (/^[a-z]+\d+[a-z]*$/i.test(combined)) {
      tokens.add(combined);
    }
  }

  return [...tokens];
}

export function extractModelTokens(title: string): string[] {
  const norm = normalizeTitle(title);
  const matches = norm.match(MODEL_TOKEN) || [];
  const models = matches.map((m) => m.replace(/\s+/g, "").toLowerCase());

  for (const w of norm.split(/\s+/)) {
    if (/^[a-z]\d{1,3}[a-z]*$/i.test(w)) models.push(w.toLowerCase());
    if (/^iphone\d{1,2}[a-z]*$/i.test(w.replace(/\s/g, "")))
      models.push(w.replace(/\s/g, "").toLowerCase());
  }

  return [...new Set(models.filter((m) => /\d/.test(m)))];
}

export function extractBrandTokens(title: string): string[] {
  const norm = normalizeTitle(title);
  const brands: string[] = [];
  for (const w of norm.split(/\s+/)) {
    const b = BRAND_ALIASES[w] || w;
    if (KNOWN_BRANDS.has(b)) brands.push(b);
  }
  return [...new Set(brands)];
}

/** Canonical key e.g. "samsung s26 ultra" for cross-vendor matching */
export function buildProductKey(title: string): string {
  const brands = extractBrandTokens(title);
  const models = extractModelTokens(title);
  const variants = extractVariants(title);
  const brand = brands[0] || "";
  const model = models[0] || "";
  const variant = variants[0] || "";
  if (model) return [brand, model, variant].filter(Boolean).join(" ").trim();
  return extractIdentityTokens(title).slice(0, 4).join(" ");
}

export function buildIdentityLabel(title: string): string {
  const key = buildProductKey(title);
  if (key) return key;
  return title.split(/\s+/).slice(0, 4).join(" ");
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const t of a) {
    if (b.has(t)) inter++;
  }
  return inter / (a.size + b.size - inter);
}

function variantsCompatible(a: string[], b: string[]): boolean {
  if (!a.length || !b.length) return true;
  const setA = new Set(a);
  for (const v of b) {
    if (setA.has(v)) return true;
  }
  return false;
}

function brandsCompatible(a: string[], b: string[]): boolean {
  if (!a.length || !b.length) return true;
  const setA = new Set(a);
  for (const bnd of b) {
    if (setA.has(bnd)) return true;
  }
  return false;
}

function sharedModels(a: string[], b: string[]): string[] {
  const setB = new Set(b.map((x) => x.toLowerCase()));
  return a.filter((m) => setB.has(m.toLowerCase()));
}

function modelAppearsInTitle(model: string, title: string): boolean {
  const norm = normalizeTitle(title).replace(/\s+/g, "");
  return norm.includes(model.replace(/\s+/g, "").toLowerCase());
}

/**
 * Match whether two listings are the same product across different vendors.
 * Model token match (s26, iphone17) is the primary signal.
 */
export function matchSameProduct(titleA: string, titleB: string): ProductMatchResult {
  const tokensA = extractIdentityTokens(titleA);
  const tokensB = extractIdentityTokens(titleB);
  const modelsA = extractModelTokens(titleA);
  const modelsB = extractModelTokens(titleB);
  const variantsA = extractVariants(titleA);
  const variantsB = extractVariants(titleB);
  const brandsA = extractBrandTokens(titleA);
  const brandsB = extractBrandTokens(titleB);

  const sharedModelTokens = sharedModels(modelsA, modelsB);
  const jaccardScore = jaccard(new Set(tokensA), new Set(tokensB));
  const keyA = buildProductKey(titleA);
  const keyB = buildProductKey(titleB);
  const identityLabel = buildIdentityLabel(titleA);

  const brandsOk = brandsCompatible(brandsA, brandsB);
  const variantsOk = variantsCompatible(variantsA, variantsB);

  let isSameProduct = false;
  let score = jaccardScore;

  if (sharedModelTokens.length > 0 && brandsOk && variantsOk) {
    isSameProduct = true;
    score = Math.max(jaccardScore, 0.72);
  } else if (keyA && keyB && keyA === keyB) {
    isSameProduct = true;
    score = 1;
  } else if (modelsA.length === 1 && modelsB.length === 0 && modelAppearsInTitle(modelsA[0], titleB) && variantsOk) {
    isSameProduct = true;
    score = Math.max(jaccardScore, 0.65);
  } else if (modelsB.length === 1 && modelsA.length === 0 && modelAppearsInTitle(modelsB[0], titleA) && variantsOk) {
    isSameProduct = true;
    score = Math.max(jaccardScore, 0.65);
  } else if (
    sharedModelTokens.length > 0 &&
    jaccardScore >= 0.28 &&
    variantsOk &&
    brandsOk
  ) {
    isSameProduct = true;
    score = Math.max(jaccardScore, 0.55);
  }

  if (sharedModelTokens.length > 0 && !variantsOk) {
    isSameProduct = false;
  }

  if (brandsA.length && brandsB.length && !brandsOk) {
    isSameProduct = false;
  }

  if (modelsA.length && modelsB.length && !sharedModelTokens.length) {
    isSameProduct = false;
  }

  return {
    score: Number(score.toFixed(2)),
    isSameProduct,
    identityLabel,
    sharedModelTokens,
    productKey: keyA,
  };
}

export function findSameProductListings<
  T extends { _id: unknown; title?: string; vendor?: unknown }
>(target: T, candidates: T[], minScore = 0.45): (T & { matchScore: number; title: string })[] {
  const results: (T & { matchScore: number; title: string })[] = [];
  const targetTitle = String(target.title ?? "");

  for (const raw of candidates) {
    const c = toPlainDoc(raw);
    if (String(c._id) === String(target._id)) continue;

    const candidateTitle = String(c.title ?? "");
    if (!targetTitle || !candidateTitle) continue;

    const match = matchSameProduct(targetTitle, candidateTitle);
    if (match.isSameProduct && match.score >= minScore) {
      results.push({ ...c, title: candidateTitle, matchScore: match.score });
    }
  }

  return results.sort((a, b) => b.matchScore - a.matchScore);
}

function toPlainDoc<T extends { _id: unknown; title?: string }>(doc: T): T {
  const maybe = doc as T & { toObject?: () => T };
  if (typeof maybe.toObject === "function") {
    return maybe.toObject();
  }
  return { ...doc };
}
