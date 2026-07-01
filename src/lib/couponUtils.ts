import Coupon from "@/model/coupon.model";
import { CouponInput } from "./orderPricing";

export async function validateCoupon(
  code: string,
  orderSubtotal: number
): Promise<{ coupon: CouponInput; code: string } | null> {
  if (!code?.trim()) return null;

  const coupon = await Coupon.findOne({
    code: code.trim().toUpperCase(),
    isActive: true,
  });

  if (!coupon) return null;
  if (coupon.expiresAt && coupon.expiresAt < new Date()) return null;
  if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) return null;
  if (coupon.minOrderAmount && orderSubtotal < coupon.minOrderAmount) return null;

  return {
    code: coupon.code,
    coupon: {
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
    },
  };
}

export async function incrementCouponUse(code: string) {
  await Coupon.findOneAndUpdate({ code: code.toUpperCase() }, { $inc: { usedCount: 1 } });
}

export interface PublicCoupon {
  code: string;
  discountType: "percent" | "fixed";
  discountValue: number;
  minOrderAmount: number;
  expiresAt: string | null;
}

export async function listAvailableCoupons(): Promise<PublicCoupon[]> {
  const now = new Date();
  const coupons = await Coupon.find({ isActive: true }).sort({ createdAt: -1 }).lean();

  return coupons
    .filter((c) => {
      if (c.expiresAt && new Date(c.expiresAt) < now) return false;
      if (c.maxUses != null && c.usedCount >= c.maxUses) return false;
      return true;
    })
    .map((c) => ({
      code: c.code,
      discountType: c.discountType,
      discountValue: c.discountValue,
      minOrderAmount: c.minOrderAmount ?? 0,
      expiresAt: c.expiresAt ? new Date(c.expiresAt).toISOString() : null,
    }));
}
