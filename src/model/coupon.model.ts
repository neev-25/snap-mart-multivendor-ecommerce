import mongoose from "mongoose";

export interface ICoupon {
  _id?: mongoose.Types.ObjectId;
  code: string;
  discountType: "percent" | "fixed";
  discountValue: number;
  minOrderAmount?: number;
  maxUses?: number;
  usedCount: number;
  isActive: boolean;
  expiresAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const couponSchema = new mongoose.Schema<ICoupon>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    discountType: { type: String, enum: ["percent", "fixed"], required: true },
    discountValue: { type: Number, required: true, min: 1 },
    minOrderAmount: { type: Number, default: 0 },
    maxUses: { type: Number },
    usedCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

const Coupon =
  mongoose.models?.Coupon || mongoose.model<ICoupon>("Coupon", couponSchema);
export default Coupon;
