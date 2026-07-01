/**
 * Decode images without sharp/libvips (avoids GLib-GObject-CRITICAL crashes on Windows).
 */
export async function loadRawImageForClip(source: string | Blob) {
  const { RawImage } = await import("@xenova/transformers");

  let buffer: Buffer;
  if (typeof source === "string") {
    const res = await fetch(source, { signal: AbortSignal.timeout(30_000) });
    if (!res.ok) {
      throw new Error(`Image fetch failed (${res.status}): ${source}`);
    }
    buffer = Buffer.from(await res.arrayBuffer());
  } else {
    buffer = Buffer.from(await source.arrayBuffer());
  }

  const Jimp = (await import("jimp")).default;
  const image = await Jimp.read(buffer);
  const { width, height, data } = image.bitmap;

  return new RawImage(new Uint8ClampedArray(data), width, height, 4);
}

export async function configureTransformersEnv() {
  const { env } = await import("@xenova/transformers");
  env.cacheDir = "./.cache/transformers";
  env.allowLocalModels = true;
  env.backends.onnx.wasm.numThreads = 1;
}
