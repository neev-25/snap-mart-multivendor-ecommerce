"use client";

import { normalizeVector } from "./vectors";

const MODEL_ID = "Xenova/clip-vit-base-patch32";

type FeatureExtractor = (
  input: unknown,
  options?: { pooling?: string; normalize?: boolean }
) => Promise<{ data: Float32Array | number[] }>;

let embedPromise: Promise<(file: File) => Promise<number[]>> | null = null;

/** Run CLIP in the browser — model caches in IndexedDB after first download. */
export async function embedImageInBrowser(file: File): Promise<number[]> {
  if (!embedPromise) {
    embedPromise = (async () => {
      const { pipeline, env, RawImage } = await import("@xenova/transformers");
      env.allowLocalModels = false;
      env.useBrowserCache = true;

      const extractor = (await pipeline("image-feature-extraction", MODEL_ID, {
        quantized: true,
      })) as FeatureExtractor;

      return async (imageFile: File) => {
        const url = URL.createObjectURL(imageFile);
        try {
          const image = await RawImage.fromURL(url);
          const output = await (extractor as FeatureExtractor)(image, {
            pooling: "mean",
            normalize: true,
          });
          return normalizeVector(Array.from(output.data as Float32Array));
        } finally {
          URL.revokeObjectURL(url);
        }
      };
    })();
  }

  const embed = await embedPromise;
  return embed(file);
}

export function getBrowserClipModelName() {
  return MODEL_ID;
}
