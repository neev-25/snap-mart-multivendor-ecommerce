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
const MIN_SIMILARITY = 0.72;
const RELATED_SCORE_GAP = 0.08;

const embeddingCache = new Map<string, number[]>();

type FeatureExtractor = (
  input: unknown,
  options?: { pooling?: string; normalize?: boolean }
) => Promise<{ data: Float32Array | number[] }>;

let extractorPromise: Promise<FeatureExtractor> | null = null;

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

export async function embedProductImage(imageUrl: string): Promise<number[]> {
  if (embeddingCache.has(imageUrl)) {
    return embeddingCache.get(imageUrl)!;
  }

  const extractor = await getExtractor();
  const image = await loadRawImageForClip(imageUrl);
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

export type CatalogProduct = {
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

/** Compare a query vector against pre-indexed catalog embeddings (no ML on server). */
export function searchCatalogByEmbedding(
  queryEmbedding: number[],
  products: CatalogProduct[],
  limit = 8
): VisualSearchResponse {
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
      message:
        "No indexed products yet. Active approved products are indexed when vendors enable them.",
      model: MODEL_ID,
    };
  }

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
      detectedCategory: best?.category,
      model: MODEL_ID,
    };
  }

  const targetCategory = best.category;
  const floor = Math.max(MIN_SIMILARITY, best.score - RELATED_SCORE_GAP);

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
    topScore: best.score,
    model: MODEL_ID,
  };
}

export async function visualSearchInCatalog(
  file: Blob,
  products: CatalogProduct[],
  limit = 8
): Promise<VisualSearchResponse> {
  const extractor = await getExtractor();
  const image = await loadRawImageForClip(file);
  const output = await extractor(image, { pooling: "mean", normalize: true });
  const queryEmbedding = normalizeVector(Array.from(output.data as Float32Array));
  return searchCatalogByEmbedding(queryEmbedding, products, limit);
}

export function getVisualSearchModelName() {
  return MODEL_ID;
}
