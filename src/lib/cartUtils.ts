export function cartItemProductId(item: { product: unknown }): string {
  if (item.product == null) return "";
  if (typeof item.product === "object" && "_id" in (item.product as object)) {
    return String((item.product as { _id: unknown })._id);
  }
  return String(item.product);
}

export function findCartItem(
  cart: { product: unknown; quantity: number }[] | undefined | null,
  productId: string
) {
  if (!Array.isArray(cart)) return undefined;
  const target = String(productId);
  return cart.find((item) => cartItemProductId(item) === target);
}
