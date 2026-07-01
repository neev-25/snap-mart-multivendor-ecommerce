'use client'

import { AppDispatch, RootState } from '@/redux/store'
import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { AnimatePresence, motion } from 'motion/react';
import axios from 'axios';
import { setAllProductsData } from '@/redux/vendorSlice';
import { ClipLoader } from 'react-spinners';
import UseGetAllProducts from '@/hooks/UseGetAllProductsData';
import { IProduct } from '@/model/product.model';
import Image from 'next/image';
import { getDisplayCommission } from '@/lib/commissionUtils';

function formatBool(value?: boolean) {
  return value ? "Yes" : "No";
}

function FieldRow({
  label,
  value,
  previous,
}: {
  label: string;
  value: React.ReactNode;
  previous?: React.ReactNode;
}) {
  const changed =
    previous !== undefined &&
    String(previous ?? "") !== String(value ?? "");

  return (
    <div
      className={`rounded-lg p-2 ${
        changed ? "bg-yellow-500/10 border border-yellow-500/30" : ""
      }`}
    >
      <p>
        <b>{label}:</b> {value}
      </p>
      {changed && (
        <p className="text-xs text-yellow-300 mt-1">
          Previous: {previous ?? "—"}
        </p>
      )}
    </div>
  );
}

function ProductApproval() {
  const dispatch = useDispatch<AppDispatch>();
  UseGetAllProducts();
  const allProductsData: IProduct[] = useSelector(
    (state: RootState) => state.vendor.allProductsData
  );
  const pendingProducts = Array.isArray(allProductsData)
    ? allProductsData.filter(
        (p) =>
          p.verificationStatus === "pending" &&
          p.commissionStatus !== "admin_countered"
      )
    : [];

  const [selectedProduct, setSelectedProduct] = useState<IProduct | null>(null);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [rejectModel, setRejectModel] = useState(false);
  const [counterModel, setCounterModel] = useState(false);
  const [rejectedReason, setRejectedReason] = useState("");
  const [adminCounterCommission, setAdminCounterCommission] = useState("");
  const [adminApproveCommission, setAdminApproveCommission] = useState("");

  const openProductDetails = async (product: IProduct) => {
    setDetailLoading(true);
    try {
      const result = await axios.get(`/api/admin/product/${product._id}`);
      setSelectedProduct(result.data);
      const rate =
        result.data.vendorCommissionPercent ??
        result.data.agreedCommissionPercent ??
        5;
      setAdminApproveCommission(String(rate));
      setAdminCounterCommission(String(Math.max(Number(rate) + 2, 5)));
    } catch (error) {
      console.log(error);
      setSelectedProduct(product);
      setAdminApproveCommission("5");
      setAdminCounterCommission("7");
    } finally {
      setDetailLoading(false);
    }
  };

  const openRejectedReasonArea = () => {
    setRejectModel(true);
    setRejectedReason("");
  };

  const handleRejected = async () => {
    if (!selectedProduct) return;
    if (!rejectedReason.trim()) {
      alert("Please enter a rejection reason");
      return;
    }

    setLoading(true);
    try {
      await axios.post("/api/admin/update-product-status", {
        productId: selectedProduct._id,
        status: "rejected",
        rejectedReason: rejectedReason.trim(),
      });
      const updated = allProductsData.filter(
        (p) => p._id !== selectedProduct._id
      );
      dispatch(setAllProductsData(updated));
      setSelectedProduct(null);
      setRejectModel(false);
      setRejectedReason("");
      setLoading(false);
      alert("Product Rejected");
    } catch (error) {
      console.log(error);
      setLoading(false);
      alert("Rejection Failed");
    }
  };

  const handleApproved = async () => {
    if (!selectedProduct) return;

    setLoading(true);
    try {
      const rate =
        selectedProduct.vendorCommissionPercent ??
        Number(adminApproveCommission);

      await axios.post("/api/admin/update-product-status", {
        productId: selectedProduct._id,
        status: "approved",
        approvedCommissionPercent: rate,
      });
      const updated = allProductsData.filter(
        (p) => p._id !== selectedProduct._id
      );
      dispatch(setAllProductsData(updated));
      setSelectedProduct(null);
      setLoading(false);
      alert("Commission approved. Vendor can now enable the product.");
    } catch (error) {
      console.log(error);
      setLoading(false);
      alert("Approval failed");
    }
  };

  const handleCounterOffer = async () => {
    if (!selectedProduct) return;
    const rate = Number(adminCounterCommission);
    if (!rate || rate < 5) {
      alert("Enter a valid commission rate (minimum 5%)");
      return;
    }

    setLoading(true);
    try {
      await axios.post("/api/admin/update-product-status", {
        productId: selectedProduct._id,
        status: "counter",
        adminCounterCommissionPercent: rate,
      });
      const updated = allProductsData.filter(
        (p) => p._id !== selectedProduct._id
      );
      dispatch(setAllProductsData(updated));
      setSelectedProduct(null);
      setCounterModel(false);
      setAdminCounterCommission("");
      setLoading(false);
      alert("Counter-offer sent to vendor.");
    } catch (error: any) {
      console.log(error);
      setLoading(false);
      alert(error?.response?.data?.message || "Counter-offer failed");
    }
  };

  const prev = selectedProduct?.lastApprovedSnapshot;
  const vendor = selectedProduct?.vendor as
    | { name?: string; shopName?: string; email?: string }
    | undefined;

  return (
    <div className="w-full px-3 sm:px-6 lg:px-10 py-6 text-white">
      <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-6 text-center sm:text-left">
        Product Approval Request
      </h1>
      <div className="hidden md:block overflow-x-auto bg-white/5 rounded-xl border border-white/10">
        <table className="w-full text-left">
          <thead className="bg-white/10">
            <tr>
              <th className="p-4">Image</th>
              <th className="p-4">Title</th>
              <th className="p-4">Price</th>
              <th className="p-4">Category</th>
              <th className="p-4">Commission</th>
              <th className="p-4">Type</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {pendingProducts.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-6 text-center text-gray-400">
                  No Product Approval requests found
                </td>
              </tr>
            ) : (
              pendingProducts.map((product, index) => (
                <tr
                  key={index}
                  className="border-t border-white/10 hover:bg-white/5"
                >
                  <td className="p-4">
                    <Image
                      src={product.image1}
                      alt="img"
                      width={50}
                      height={50}
                      className="rounded object-cover"
                    />
                  </td>
                  <td className="p-4">{product.title}</td>
                  <td className="p-4">₹ {product.price}</td>
                  <td className="p-4">{product.category}</td>
                  <td className="p-4 text-yellow-300">
                    {getDisplayCommission(product)}
                  </td>
                  <td className="p-4">
                    {product.isUpdateRequest ? (
                      <span className="px-2 py-1 rounded-full text-xs bg-orange-500/30 text-orange-200">
                        Update
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-full text-xs bg-blue-500/30 text-blue-200">
                        New
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    <span className="px-3 py-1 rounded-full text-xs bg-yellow-500/30 text-yellow-300">
                      {product?.verificationStatus}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => openProductDetails(product)}
                      className="px-4 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-sm"
                    >
                      Check Details
                    </motion.button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="md:hidden flex flex-col gap-4">
        {pendingProducts.length === 0 ? (
          <div className="text-center text-gray-400 mt-10">
            No Product Approval requests found
          </div>
        ) : (
          pendingProducts.map((product, index) => (
            <div
              key={index}
              className="bg-white/10 border border-white/20 rounded-xl p-4 space-y-2"
            >
              <div className="flex items-center gap-3">
                <Image
                  src={product.image1}
                  alt="img"
                  width={60}
                  height={60}
                  className="rounded"
                />
                <div>
                  <h3 className="font-semibold">{product.title}</h3>
                  <p className="text-sm text-gray-400">₹ {product.price}</p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => openProductDetails(product)}
                className="w-full px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-sm"
              >
                Check Details
              </motion.button>
            </div>
          ))
        )}
      </div>

      <AnimatePresence>
        {(selectedProduct || detailLoading) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              transition={{ duration: 0.6 }}
              className="bg-gray-900 p-6 rounded-2xl w-full max-w-2xl border border-white/10 max-h-[90vh] overflow-y-auto"
            >
              {detailLoading ? (
                <div className="flex justify-center py-10">
                  <ClipLoader size={28} color="white" />
                </div>
              ) : selectedProduct ? (
                <>
                  <h3 className="text-xl sm:text-2xl font-bold mb-4">
                    {selectedProduct.isUpdateRequest
                      ? "Product Update Request"
                      : "New Product Request"}
                  </h3>

                  {selectedProduct.isUpdateRequest && (
                    <p className="text-sm text-yellow-300 mb-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                      Vendor updated an approved product. Highlighted fields show
                      what changed from the last approved version.
                    </p>
                  )}

                  <Image
                    src={selectedProduct.image1}
                    alt="img"
                    width={80}
                    height={80}
                    className="rounded mb-4 object-cover"
                  />

                  <div className="space-y-2 text-sm">
                    <FieldRow
                      label="Vendor Commission Offer"
                      value={
                        selectedProduct.vendorCommissionPercent != null
                          ? `${selectedProduct.vendorCommissionPercent}% of product price per sale`
                          : "Not submitted by vendor (set rate below to approve)"
                      }
                    />
                    {selectedProduct.vendorCommissionPercent == null && (
                      <div className="rounded-lg p-3 bg-amber-500/10 border border-amber-500/30 text-sm">
                        <label className="block mb-2 font-semibold text-amber-200">
                          Set commission to approve (%)
                        </label>
                        <input
                          type="number"
                          min={5}
                          max={40}
                          className="w-full bg-white/10 border border-white/20 rounded-lg p-2"
                          value={adminApproveCommission}
                          onChange={(e) => setAdminApproveCommission(e.target.value)}
                        />
                      </div>
                    )}
                    <FieldRow label="Title" value={selectedProduct.title} previous={prev?.title} />
                    <FieldRow label="Price" value={`₹ ${selectedProduct.price}`} previous={prev?.price !== undefined ? `₹ ${prev.price}` : undefined} />
                    <FieldRow label="Stock" value={selectedProduct.stock} previous={prev?.stock} />
                    <FieldRow label="Category" value={selectedProduct.category} previous={prev?.category} />
                    <FieldRow label="Description" value={selectedProduct.description} previous={prev?.description} />
                    <FieldRow label="Free Delivery" value={formatBool(selectedProduct.freeDelivery)} previous={prev ? formatBool(prev.freeDelivery) : undefined} />
                    <FieldRow label="Cash on Delivery" value={formatBool(selectedProduct.payOnDelivery !== false)} previous={prev ? formatBool(prev.payOnDelivery !== false) : undefined} />
                    <FieldRow label="Warranty" value={selectedProduct.warranty || "No Warranty"} previous={prev?.warranty} />
                    <FieldRow label="Replacement Days" value={selectedProduct.replacementDays ?? 0} previous={prev?.replacementDays} />
                    <FieldRow label="Wearable" value={formatBool(selectedProduct.isWearable)} previous={prev ? formatBool(prev.isWearable) : undefined} />
                    {selectedProduct.isWearable && (
                      <FieldRow label="Sizes" value={(selectedProduct.sizes || []).join(", ") || "—"} previous={(prev?.sizes || []).join(", ") || undefined} />
                    )}
                    <FieldRow
                      label="Detail Points"
                      value={(selectedProduct.detailsPoints || []).join(" | ") || "—"}
                      previous={(prev?.detailsPoints || []).join(" | ") || undefined}
                    />
                    {vendor && (
                      <p>
                        <b>Vendor:</b> {vendor.shopName || vendor.name} ({vendor.email})
                      </p>
                    )}
                    <p>
                      <b>Status:</b>{" "}
                      <span className="text-yellow-400 capitalize">
                        {selectedProduct.verificationStatus}
                      </span>
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 mt-6">
                    <button
                      disabled={loading}
                      className="flex-1 bg-green-600 hover:bg-green-700 py-2 rounded-lg text-sm"
                      onClick={handleApproved}
                    >
                      {loading ? (
                        <ClipLoader size={20} color="white" />
                      ) : (
                        "Accept Commission"
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setCounterModel(true);
                        setAdminCounterCommission(
                          String(
                            Math.max(
                              Number(
                                selectedProduct.vendorCommissionPercent ??
                                  adminApproveCommission ??
                                  5
                              ) + 2,
                              5
                            )
                          )
                        );
                      }}
                      className="flex-1 bg-orange-600 hover:bg-orange-700 py-2 rounded-lg text-sm"
                    >
                      Counter Offer
                    </button>
                    <button
                      onClick={openRejectedReasonArea}
                      className="flex-1 bg-red-600 hover:bg-red-700 py-2 rounded-lg text-sm"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => setSelectedProduct(null)}
                      className="flex-1 bg-gray-600 hover:bg-gray-700 py-2 rounded-lg text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : null}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {rejectModel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] px-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              transition={{ duration: 0.6 }}
              className="bg-gray-900 p-6 rounded-2xl w-full max-w-lg border border-white/10"
            >
              <h3 className="text-xl sm:text-2xl font-bold mb-4">
                Enter Rejection Reason
              </h3>
              <textarea
                className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-sm"
                rows={3}
                placeholder="Enter rejection reason..."
                onChange={(e) => setRejectedReason(e.target.value)}
                value={rejectedReason}
              />
              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <button
                  disabled={loading}
                  onClick={handleRejected}
                  className="flex-1 bg-red-600 hover:bg-red-700 py-2 rounded-lg text-sm"
                >
                  {loading ? (
                    <ClipLoader size={20} color="white" />
                  ) : (
                    "Confirm Reject"
                  )}
                </button>
                <button
                  onClick={() => setRejectModel(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 py-2 rounded-lg text-sm"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {counterModel && selectedProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] px-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-gray-900 p-6 rounded-2xl w-full max-w-lg border border-white/10"
            >
              <h3 className="text-xl font-bold mb-2">Counter Commission Offer</h3>
              <p className="text-sm text-gray-400 mb-4">
                Vendor offered{" "}
                <b>
                  {selectedProduct.vendorCommissionPercent != null
                    ? `${selectedProduct.vendorCommissionPercent}%`
                    : "no rate"}
                </b>
                . Propose a higher rate. The vendor must accept before the product can go live.
              </p>
              <input
                type="number"
                min={5}
                max={40}
                className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-sm mb-4"
                value={adminCounterCommission}
                onChange={(e) => setAdminCounterCommission(e.target.value)}
                placeholder="Your commission %"
              />
              <div className="flex gap-3">
                <button
                  disabled={loading}
                  onClick={handleCounterOffer}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 py-2 rounded-lg text-sm"
                >
                  Send Counter-Offer
                </button>
                <button
                  onClick={() => setCounterModel(false)}
                  className="flex-1 bg-gray-600 py-2 rounded-lg text-sm"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ProductApproval;
