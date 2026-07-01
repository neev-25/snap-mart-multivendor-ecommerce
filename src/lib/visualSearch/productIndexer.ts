import Product from "@/model/product.model";
import { embedProductImage, getProductImageUrls } from "./clipSearch";

export async function indexProductVisual(productId: string) {
  const product = await Product.findById(productId);
  if (!product?.image1 || !product.isActive || product.verificationStatus !== "approved") {
    return false;
  }

  const urls = getProductImageUrls(product);
  const embeddings: number[][] = [];
  for (const url of urls) {
    embeddings.push(await embedProductImage(url));
  }

  product.visualEmbeddings = embeddings;
  product.visualIndexedAt = new Date();
  await product.save();
  return true;
}

function needsReindex(product: {
  image1?: string;
  image2?: string;
  image3?: string;
  image4?: string;
  visualEmbeddings?: number[][];
}) {
  const imageCount = getProductImageUrls(product).length;
  const embCount = product.visualEmbeddings?.length ?? 0;
  return imageCount > 0 && embCount !== imageCount;
}

export async function ensureCatalogIndexed() {
  const products = await Product.find({
    isActive: true,
    verificationStatus: "approved",
    image1: { $exists: true, $ne: "" },
  }).select("_id image1 image2 image3 image4 visualEmbeddings");

  let indexed = 0;
  for (const p of products) {
    if (!needsReindex(p)) continue;
    try {
      const urls = getProductImageUrls(p);
      const embeddings: number[][] = [];
      for (const url of urls) {
        embeddings.push(await embedProductImage(url));
      }
      await Product.findByIdAndUpdate(p._id, {
        visualEmbeddings: embeddings,
        visualIndexedAt: new Date(),
      });
      indexed++;
    } catch (error) {
      console.error("Index failed for product", p._id, error);
    }
  }
  return indexed;
}
