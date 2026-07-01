import { cosineSimilarity, normalizeVector } from "./vectors";
import { configureTransformersEnv, loadRawImageForClip } from "./imageLoader";

export type VisualSearchResult = {
  product: Record<string, unknown>;
  score: number;
  model: string;
  category: string;
};

export type VisualSearchResponse = {
  found: boolean;
  products: VisualSearchResult[];
  message: string;
  detectedCategory?: string;
  topScore?: number;
  model: string;
};

const MODEL_ID = "Xenova/clip-vit-base-patch32";

/** Minimum cosine similarity to count as a real visual match (catalog-trained gate) */
const MIN_SIMILARITY = 0.72;
/** Max score drop from best match when showing related items in same category */
const RELATED_SCORE_GAP = 0.08;
/** Zero-shot category must reach this to trust category filter */
const MIN_CATEGORY_CONFIDENCE = 0.1;

const embeddingCache = new Map<string, number[]>();

type FeatureExtractor = (
  input: unknown,
  options?: { pooling?: string; normalize?: boolean }
) => Promise<{ data: Float32Array | number[] }>;

type ZeroShotClassifier = (
  input: unknown,
  labels: string[]
) => Promise<Array<{ label: string; score: number }>>;

let extractorPromise: Promise<FeatureExtractor> | null = null;
let zeroShotPromise: Promise<ZeroShotClassifier> | null = null;

async function getExtractor(): Promise<FeatureExtractor> {
  if (!extractorPromise) {
    extractorPromise = (async () => {
      await configureTransformersEnv();
      const { pipeline } = await import("@xenova/transformers");
      return pipeline("image-feature-extraction", MODEL_ID, {
        quantized: true,
      }) as Promise<FeatureExtractor>;
    })();
  }
  return extractorPromise;
}

async function getZeroShotClassifier(): Promise<ZeroShotClassifier> {
  if (!zeroShotPromise) {
    zeroShotPromise = (async () => {
      await configureTransformersEnv();
      const { pipeline } = await import("@xenova/transformers");
      return pipeline("zero-shot-image-classification", MODEL_ID, {
        quantized: true,
      }) as Promise<ZeroShotClassifier>;
    })();
  }
  return zeroShotPromise;
}

async function loadRawImage(source: string | Blob) {
  return loadRawImageForClip(source);
}

export async function embedProductImage(imageUrl: string): Promise<number[]> {
  if (embeddingCache.has(imageUrl)) {
    return embeddingCache.get(imageUrl)!;
  }

  const extractor = await getExtractor();
  const image = await loadRawImage(imageUrl);
  const output = await extractor(image, { pooling: "mean", normalize: true });
  const vector = normalizeVector(Array.from(output.data as Float32Array));
  embeddingCache.set(imageUrl, vector);
  return vector;
}

export function getProductImageUrls(product: {
  image1?: string;
  image2?: string;
  image3?: string;
  image4?: string;
}): string[] {
  return [product.image1, product.image2, product.image3, product.image4].filter(
    (url): url is string => Boolean(url?.trim())
  );
}

function bestSimilarityAcrossImages(
  queryEmbedding: number[],
  embeddings: number[][]
): number {
  let best = 0;
  for (const emb of embeddings) {
    if (emb?.length) {
      best = Math.max(best, cosineSimilarity(queryEmbedding, emb));
    }
  }
  return best;
}

async function embedUpload(file: Blob): Promise<number[]> {
  const extractor = await getExtractor();
  const image = await loadRawImage(file);
  const output = await extractor(image, { pooling: "mean", normalize: true });
  return normalizeVector(Array.from(output.data as Float32Array));
}

async function classifyCatalogCategory(
  file: Blob,
  categories: string[]
): Promise<Array<{ label: string; score: number }>> {
  if (!categories.length) return [];
  const classifier = await getZeroShotClassifier();
  const image = await loadRawImage(file);
  const results = await classifier(image, categories);
  return results.sort((a, b) => b.score - a.score);
}

type CatalogProduct = {
  _id: unknown;
  title?: string;
  category?: string;
  image1?: string;
  image2?: string;
  image3?: string;
  image4?: string;
  visualEmbeddings?: number[][];
  [key: string]: unknown;
};

export async function visualSearchInCatalog(
  file: Blob,
  products: CatalogProduct[],
  limit = 8
): Promise<VisualSearchResponse> {
  const indexed = products.filter(
    (p) =>
      p.visualEmbeddings?.length &&
      p.visualEmbeddings.some((e) => e?.length) &&
      p.category &&
      p.image1
  );

  if (!indexed.length) {
    return {
      found: false,
      products: [],
      message: "No product images indexed in catalog yet. Add active products first.",
      model: MODEL_ID,
    };
  }

  const categories = [...new Set(indexed.map((p) => p.category as string))];
  const categoryPredictions = await classifyCatalogCategory(file, categories);
  const queryEmbedding = await embedUpload(file);

  const scored: VisualSearchResult[] = [];
  for (const product of indexed) {
    const score = bestSimilarityAcrossImages(
      queryEmbedding,
      product.visualEmbeddings!
    );
    scored.push({
      product,
      score: Math.round(score * 1000) / 1000,
      model: MODEL_ID,
      category: product.category as string,
    });
  }

  scored.sort((a, b) => b.score - a.score);
  const best = scored[0];

  if (!best || best.score < MIN_SIMILARITY) {
    return {
      found: false,
      products: [],
      message: "No similar products found in SnapMart catalog for this image.",
      topScore: best?.score,
      detectedCategory: categoryPredictions[0]?.label,
      model: MODEL_ID,
    };
  }

  let targetCategory = best.category;

  const zeroShotTop = categoryPredictions[0];
  if (zeroShotTop && zeroShotTop.score >= MIN_CATEGORY_CONFIDENCE) {
    const inTop3 = categoryPredictions
      .slice(0, 3)
      .some((c) => c.label === best.category);
    if (inTop3) {
      targetCategory = best.category;
    } else if (zeroShotTop.score >= 0.18) {
      targetCategory = zeroShotTop.label;
    }
  }

  const bestInTarget = scored.find(
    (s) => s.category === targetCategory && s.score >= MIN_SIMILARITY
  );

  if (!bestInTarget) {
    return {
      found: false,
      products: [],
      message: `No matching products found in category "${targetCategory}".`,
      detectedCategory: targetCategory,
      topScore: best.score,
      model: MODEL_ID,
    };
  }

  const floor = Math.max(MIN_SIMILARITY, bestInTarget.score - RELATED_SCORE_GAP);

  const related = scored.filter(
    (s) =>
      s.category === targetCategory &&
      s.score >= floor &&
      s.score >= MIN_SIMILARITY
  );

  return {
    found: true,
    products: related.slice(0, limit),
    message: `Found ${related.length} related product(s) in ${targetCategory}.`,
    detectedCategory: targetCategory,
    topScore: bestInTarget.score,
    model: MODEL_ID,
  };
}

export function getVisualSearchModelName() {
  return MODEL_ID;
}
