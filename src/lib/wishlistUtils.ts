import mongoose from "mongoose";

export function toObjectId(id: string): mongoose.Types.ObjectId | null {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  return new mongoose.Types.ObjectId(String(id));
}

export function wishlistIdStrings(wishlist: unknown[] | undefined): string[] {
  if (!Array.isArray(wishlist)) return [];
  return [...new Set(wishlist.map((entry) => {
    if (entry && typeof entry === "object" && "_id" in entry) {
      return String((entry as { _id: unknown })._id);
    }
    return String(entry);
  }))].filter(Boolean);
}

export async function addToWishlist(userId: string, productId: string) {
  const objectId = toObjectId(productId);
  if (!objectId) {
    throw new Error("Invalid product id");
  }

  const User = (await import("@/model/user.model")).default;
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  const current = wishlistIdStrings(user.wishlist as unknown[]);
  if (!current.includes(String(productId))) {
    user.wishlist = [...(user.wishlist || []), objectId] as typeof user.wishlist;
    await user.save();
  }

  return user;
}

export async function removeFromWishlist(userId: string, productId: string) {
  const User = (await import("@/model/user.model")).default;
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  user.wishlist = (user.wishlist || []).filter(
    (id: mongoose.Types.ObjectId) => String(id) !== String(productId)
  ) as typeof user.wishlist;
  await user.save();

  return user;
}
