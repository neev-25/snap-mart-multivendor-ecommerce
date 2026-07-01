"use client";

import { normalizeVector } from "./vectors";

const MODEL_ID = "Xenova/clip-vit-base-patch32";
const TRANSFORMERS_CDN =
  "https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2/dist/transformers.min.js";

type FeatureExtractor = (
  input: unknown,
  options?: { pooling?: string; normalize?: boolean }
) => Promise<{ data: Float32Array | number[] }>;

type RawImageCtor = new (
  data: Uint8ClampedArray | Uint8Array,
  width: number,
  height: number,
  channels: number
) => unknown;

type TransformersModule = {
  pipeline: (
    task: string,
    model: string,
    options?: { quantized?: boolean }
  ) => Promise<FeatureExtractor>;
  env: {
    allowLocalModels: boolean;
    useBrowserCache: boolean;
    backends?: { onnx?: { wasm?: { numThreads?: number } } };
  };
  RawImage: RawImageCtor;
};

let transformersPromise: Promise<TransformersModule> | null = null;
let embedPromise: Promise<(file: File) => Promise<number[]>> | null = null;

/** Load the browser build from CDN — avoids Next.js bundling Node-only deps from env.js. */
async function loadBrowserTransformers(): Promise<TransformersModule> {
  if (!transformersPromise) {
    transformersPromise = import(
      /* webpackIgnore: true */
      TRANSFORMERS_CDN
    ) as Promise<TransformersModule>;
  }
  return transformersPromise;
}

async function fileToRawImage(file: File, RawImage: RawImageCtor) {
  const bitmap = await createImageBitmap(file);
  try {
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Could not read image for visual search.");
    }
    ctx.drawImage(bitmap, 0, 0);
    const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return new RawImage(data, width, height, 4);
  } finally {
    bitmap.close();
  }
}

/** Run CLIP in the browser — model caches in IndexedDB after first download. */
export async function embedImageInBrowser(file: File): Promise<number[]> {
  try {
    if (!embedPromise) {
      embedPromise = (async () => {
        const { pipeline, env, RawImage } = await loadBrowserTransformers();
        env.allowLocalModels = false;
        env.useBrowserCache = true;
        if (env.backends?.onnx?.wasm) {
          env.backends.onnx.wasm.numThreads = 1;
        }

        const extractor = await pipeline("image-feature-extraction", MODEL_ID, {
          quantized: true,
        });

        return async (imageFile: File) => {
          const image = await fileToRawImage(imageFile, RawImage);
          const output = await extractor(image, {
            pooling: "mean",
            normalize: true,
          });
          const data = output?.data;
          if (!data || !("length" in data) || data.length === 0) {
            throw new Error("Could not analyze this image. Try a clearer product photo.");
          }
          return normalizeVector(Array.from(data as Float32Array));
        };
      })();
    }

    const embed = await embedPromise;
    return embed(file);
  } catch (error) {
    embedPromise = null;
    transformersPromise = null;
    throw error;
  }
}

export function getBrowserClipModelName() {
  return MODEL_ID;
}
