import { getOrderDisplayId } from "@/lib/orderDisplay";
import {
  getAdminEmails,
  getUserEmails,
  sendNewProductEmails,
  sendNewVendorAnnouncementToUsers,
  sendNewVendorRequestToAdmin,
  sendOrderPlacedEmails,
  sendOrderStatusUpdateEmails,
  sendProductStatusEmail,
  sendVendorStatusEmail,
} from "@/lib/emailNotifications";
import Order from "@/model/order.model";
import Product from "@/model/product.model";
import User from "@/model/user.model";

export async function notifyOrderPlaced(orderId: string) {
  try {
    const order = await Order.findById(orderId)
      .populate("buyer", "name email")
      .populate("productVendor", "name email shopName")
      .populate("products.product", "title");

    if (!order) return;

    const product = order.products[0]?.product as { title?: string } | undefined;
    const buyer = order.buyer as { name?: string; email?: string } | undefined;
    const vendor = order.productVendor as {
      name?: string;
      email?: string;
      shopName?: string;
    } | undefined;

    const adminEmails = await getAdminEmails();
    if (!buyer?.email || !vendor?.email) return;

    await sendOrderPlacedEmails({
      orderId: getOrderDisplayId(order),
      buyerName: buyer.name || "Customer",
      buyerEmail: buyer.email,
      vendorName: vendor.shopName || vendor.name || "Vendor",
      vendorEmail: vendor.email,
      adminEmails,
      productTitle: product?.title || "Product",
      totalAmount: order.totalAmount,
      paymentMethod: order.paymentMethod,
    });
  } catch (error) {
    console.error("notifyOrderPlaced error:", error);
  }
}

export async function notifyOrderStatusUpdated(orderId: string, status: string) {
  try {
    const order = await Order.findById(orderId)
      .populate("buyer", "name email")
      .populate("productVendor", "name email shopName")
      .populate("products.product", "title");

    if (!order) return;

    const product = order.products[0]?.product as { title?: string } | undefined;
    const buyer = order.buyer as { name?: string; email?: string } | undefined;
    const vendor = order.productVendor as { name?: string; shopName?: string } | undefined;
    const adminEmails = await getAdminEmails();

    if (!buyer?.email) return;

    await sendOrderStatusUpdateEmails({
      orderId: getOrderDisplayId(order),
      status,
      buyerEmail: buyer.email,
      buyerName: buyer.name || "Customer",
      adminEmails,
      productTitle: product?.title || "Product",
      vendorName: vendor?.shopName || vendor?.name || "Vendor",
    });
  } catch (error) {
    console.error("notifyOrderStatusUpdated error:", error);
  }
}

export async function notifyVendorStatusChange(vendorId: string, status: "approved" | "rejected", rejectedReason?: string) {
  try {
    const vendor = await User.findById(vendorId);
    if (!vendor?.email) return;

    await sendVendorStatusEmail({
      vendorEmail: vendor.email,
      vendorName: vendor.name,
      shopName: vendor.shopName,
      status,
      rejectedReason,
    });
  } catch (error) {
    console.error("notifyVendorStatusChange error:", error);
  }
}

export async function notifyProductStatusChange(productId: string, status: "approved" | "rejected", rejectedReason?: string) {
  try {
    const product = await Product.findById(productId).populate("vendor", "name email");
    if (!product) return;

    const vendor = product.vendor as { name?: string; email?: string } | undefined;
    if (!vendor?.email) return;

    await sendProductStatusEmail({
      vendorEmail: vendor.email,
      vendorName: vendor.name || "Vendor",
      productTitle: product.title,
      productId: product._id.toString(),
      status,
      rejectedReason,
    });
  } catch (error) {
    console.error("notifyProductStatusChange error:", error);
  }
}

export async function notifyNewVendorRequest(vendorId: string) {
  try {
    const vendor = await User.findById(vendorId);
    const [adminEmails, userEmails] = await Promise.all([
      getAdminEmails(),
      getUserEmails(),
    ]);
    if (!vendor || adminEmails.length === 0) return;

    await sendNewVendorRequestToAdmin({
      adminEmails,
      vendorName: vendor.name,
      vendorEmail: vendor.email,
      shopName: vendor.shopName || "",
      shopAddress: vendor.shopAddress || "",
      gstNumber: vendor.gstNumber || "",
    });

    if (vendor.shopName) {
      await sendNewVendorAnnouncementToUsers({
        userEmails,
        vendorName: vendor.name,
        shopName: vendor.shopName,
        shopAddress: vendor.shopAddress || "",
      });
    }
  } catch (error) {
    console.error("notifyNewVendorRequest error:", error);
  }
}

export async function notifyNewProduct(productId: string, vendorId: string) {
  try {
    const [product, vendor, adminEmails] = await Promise.all([
      Product.findById(productId),
      User.findById(vendorId),
      getAdminEmails(),
    ]);

    if (!product || !vendor || adminEmails.length === 0) return;

    const followers = await User.find({
      followingVendors: vendorId,
      role: "user",
    }).select("email");
    const followerEmails = followers.map((u) => u.email).filter(Boolean);

    const { sendNewProductEmails, sendFollowerNewProductEmail } = await import(
      "@/lib/emailNotifications"
    );

    await sendNewProductEmails({
      adminEmails,
      userEmails: [],
      vendorName: vendor.name,
      shopName: vendor.shopName,
      productTitle: product.title,
      productId: product._id.toString(),
      price: product.price,
      category: product.category,
    });

    if (followerEmails.length > 0) {
      await sendFollowerNewProductEmail({
        followerEmails,
        shopName: vendor.shopName || vendor.name,
        productTitle: product.title,
        productId: product._id.toString(),
        price: product.price,
      });
    }
  } catch (error) {
    console.error("notifyNewProduct error:", error);
  }
}
