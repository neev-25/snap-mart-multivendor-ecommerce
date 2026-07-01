import {
  DEFAULT_DELIVERY_CHARGE,
  SERVICE_CHARGE,
} from "./constants";
import { getAgreedCommissionPercent, CommissionStatus } from "./commissionUtils";

export { findCartItem, cartItemProductId } from "./cartUtils";

export interface CouponInput {
  discountType: "percent" | "fixed";
  discountValue: number;
}

export function calculateOrderPricing(
  product: {
    price: number;
    freeDelivery?: boolean;
    agreedCommissionPercent?: number;
    verificationStatus?: string;
    commissionStatus?: CommissionStatus;
  },
  quantity: number,
  coupon?: CouponInput | null
) {
  const productsTotal = product.price * quantity;
  const deliveryCharge = product.freeDelivery ? 0 : DEFAULT_DELIVERY_CHARGE;
  const serviceCharge = SERVICE_CHARGE;
  const subtotal = productsTotal + deliveryCharge + serviceCharge;

  let couponDiscount = 0;
  if (coupon) {
    couponDiscount =
      coupon.discountType === "percent"
        ? Math.round((subtotal * coupon.discountValue) / 100)
        : coupon.discountValue;
    couponDiscount = Math.min(Math.max(couponDiscount, 0), subtotal);
  }

  const totalAmount = subtotal - couponDiscount;
  const commissionPercent = getAgreedCommissionPercent(product);
  const platformCommission = Math.round(
    (productsTotal * commissionPercent) / 100
  );
  const vendorEarning = productsTotal - platformCommission;

  return {
    productsTotal,
    deliveryCharge,
    serviceCharge,
    couponDiscount,
    totalAmount,
    platformCommission,
    vendorEarning,
    commissionPercent,
  };
}
