import {
  MAX_PLATFORM_COMMISSION_PERCENT,
  MIN_PLATFORM_COMMISSION_PERCENT,
  PLATFORM_COMMISSION_PERCENT,
} from "./constants";

export type CommissionStatus = "pending" | "admin_countered" | "agreed";

export function validateCommissionPercent(value: number): string | null {
  if (!Number.isFinite(value) || value < MIN_PLATFORM_COMMISSION_PERCENT) {
    return `Commission must be at least ${MIN_PLATFORM_COMMISSION_PERCENT}%`;
  }
  if (value > MAX_PLATFORM_COMMISSION_PERCENT) {
    return `Commission cannot exceed ${MAX_PLATFORM_COMMISSION_PERCENT}%`;
  }
  return null;
}

export function getAgreedCommissionPercent(product: {
  agreedCommissionPercent?: number;
  verificationStatus?: string;
  commissionStatus?: CommissionStatus;
}): number {
  if (product.agreedCommissionPercent != null) {
    return product.agreedCommissionPercent;
  }
  if (product.verificationStatus === "approved") {
    return PLATFORM_COMMISSION_PERCENT;
  }
  return PLATFORM_COMMISSION_PERCENT;
}

/** Product can be sold / enabled only when commission is agreed with admin */
export function isCommissionAgreed(product: {
  agreedCommissionPercent?: number;
  verificationStatus?: string;
  commissionStatus?: CommissionStatus;
  vendorCommissionPercent?: number;
}): boolean {
  if (product.commissionStatus === "agreed" && product.agreedCommissionPercent != null) {
    return true;
  }
  if (
    product.verificationStatus === "approved" &&
    product.agreedCommissionPercent != null
  ) {
    return true;
  }
  // Legacy products approved before commission negotiation
  if (
    product.verificationStatus === "approved" &&
    !product.commissionStatus &&
    product.vendorCommissionPercent == null
  ) {
    return true;
  }
  return false;
}

export function canActivateProduct(product: {
  verificationStatus?: string;
  agreedCommissionPercent?: number;
  commissionStatus?: CommissionStatus;
  vendorCommissionPercent?: number;
}): boolean {
  return product.verificationStatus === "approved" && isCommissionAgreed(product);
}

/** Human-readable commission for admin/vendor tables */
export function getDisplayCommission(product: {
  vendorCommissionPercent?: number | null;
  adminCounterCommissionPercent?: number | null;
  agreedCommissionPercent?: number | null;
  commissionStatus?: CommissionStatus;
}): string {
  if (
    product.commissionStatus === "admin_countered" &&
    product.adminCounterCommissionPercent != null
  ) {
    const vendor =
      product.vendorCommissionPercent != null
        ? ` (vendor offered ${product.vendorCommissionPercent}%)`
        : "";
    return `${product.adminCounterCommissionPercent}%${vendor}`;
  }
  if (product.vendorCommissionPercent != null) {
    return `${product.vendorCommissionPercent}%`;
  }
  if (product.agreedCommissionPercent != null) {
    return `${product.agreedCommissionPercent}% agreed`;
  }
  return "Not set";
}

export function getEffectiveVendorCommission(product: {
  vendorCommissionPercent?: number | null;
  agreedCommissionPercent?: number | null;
}): number | null {
  if (product.vendorCommissionPercent != null) {
    return product.vendorCommissionPercent;
  }
  if (product.agreedCommissionPercent != null) {
    return product.agreedCommissionPercent;
  }
  return null;
}
