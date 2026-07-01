import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

function baseUrl() {
  return process.env.NEXT_BASE_URL || "http://localhost:3000";
}

function emailShell(title: string, body: string) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#111">
      <div style="background:#111;color:#fff;padding:16px 20px;border-radius:8px 8px 0 0">
        <h2 style="margin:0;font-size:20px">SnapMart</h2>
        <p style="margin:4px 0 0;opacity:0.85;font-size:13px">${title}</p>
      </div>
      <div style="border:1px solid #e5e5e5;border-top:none;padding:20px;border-radius:0 0 8px 8px">
        ${body}
      </div>
    </div>
  `;
}

function actionButton(label: string, href: string) {
  return `<p style="margin:24px 0 0">
    <a href="${href}" style="background:#2563eb;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:600">
      ${label}
    </a>
  </p>`;
}

export async function sendMail(options: {
  intendedRecipients: string | string[];
  subject: string;
  html: string;
}) {
  const intended = (
    Array.isArray(options.intendedRecipients)
      ? options.intendedRecipients
      : [options.intendedRecipients]
  ).filter(Boolean);

  if (intended.length === 0) return;

  const testMail = process.env.TEST_MAIL?.trim();
  const testBanner = testMail
    ? `<p style="background:#fff3cd;padding:10px;border-radius:6px;border:1px solid #f0c040;margin-bottom:16px">
        <b>TEST MODE:</b> This email was intended for —
        ${intended.map((e) => `<br/>• ${e}`).join("")}
      </p>`
    : "";

  const html = `${testBanner}${options.html}`;
  const subject = testMail ? `[TEST] ${options.subject}` : options.subject;

  if (testMail) {
    await transporter.sendMail({
      from: `"SnapMart" <${process.env.GMAIL_USER}>`,
      to: testMail,
      subject,
      html,
    });
    return;
  }

  await Promise.all(
    intended.map((to) =>
      transporter.sendMail({
        from: `"SnapMart" <${process.env.GMAIL_USER}>`,
        to,
        subject: options.subject,
        html: options.html,
      })
    )
  );
}

export async function sendDEliveryOtpEmail(
  email: string,
  otp: string,
  orderRef?: string
) {
  const orderLine = orderRef
    ? `<p><b>Order:</b> ${orderRef}</p>`
    : "";
  await sendMail({
    intendedRecipients: email,
    subject: "Your Delivery OTP — SnapMart",
    html: emailShell(
      "Delivery Verification",
      `${orderLine}<p>Your order delivery OTP is:</p>
       <h1 style="letter-spacing:4px">${otp}</h1>
       <p>This OTP is valid for 10 minutes. Share it with the delivery agent only after you receive your items.</p>`
    ),
  });
}

export async function sendPasswordResetEmail(params: {
  email: string;
  name: string;
  resetUrl: string;
}) {
  await sendMail({
    intendedRecipients: params.email,
    subject: "Reset your SnapMart password",
    html: emailShell(
      "Password reset",
      `<p>Hi ${params.name || "there"},</p>
       <p>We received a request to reset your SnapMart password. Click below to choose a new password. This link expires in 1 hour.</p>
       ${actionButton("Reset password", params.resetUrl)}
       <p style="margin-top:20px;font-size:13px;color:#666">If you did not request this, you can ignore this email.</p>`
    ),
  });
}

export async function sendOrderPlacedEmails(params: {
  orderId: string;
  buyerName: string;
  buyerEmail: string;
  vendorName: string;
  vendorEmail: string;
  adminEmails: string[];
  productTitle: string;
  totalAmount: number;
  paymentMethod: string;
}) {
  const ordersLink = `${baseUrl()}/orders`;
  const adminLink = `${baseUrl()}/`;
  const vendorLink = `${baseUrl()}/`;

  const summary = `
    <p><b>Order ID:</b> ${params.orderId}</p>
    <p><b>Product:</b> ${params.productTitle}</p>
    <p><b>Buyer:</b> ${params.buyerName} (${params.buyerEmail})</p>
    <p><b>Vendor:</b> ${params.vendorName}</p>
    <p><b>Total:</b> ₹${params.totalAmount}</p>
    <p><b>Payment:</b> ${params.paymentMethod.toUpperCase()}</p>
  `;

  await sendMail({
    intendedRecipients: params.adminEmails,
    subject: `New Order Placed — ${params.productTitle}`,
    html: emailShell(
      "New Order (Admin)",
      `${summary}${actionButton("Open Admin Panel → Orders", adminLink)}`
    ),
  });

  await sendMail({
    intendedRecipients: params.vendorEmail,
    subject: `New Order Received — ${params.productTitle}`,
    html: emailShell(
      "New Order (Vendor)",
      `<p>Hi ${params.vendorName},</p>
       <p>You have received a new order on SnapMart.</p>
       ${summary}
       ${actionButton("Open Vendor Dashboard → Orders", vendorLink)}`
    ),
  });

  await sendMail({
    intendedRecipients: params.buyerEmail,
    subject: `Order Confirmed — ${params.productTitle}`,
    html: emailShell(
      "Order Confirmation",
      `<p>Hi ${params.buyerName},</p>
       <p>Thank you for your order on SnapMart. We have received it and the seller will process it soon.</p>
       ${summary.replace(
         `<p><b>Buyer:</b> ${params.buyerName} (${params.buyerEmail})</p>`,
         ""
       )}
       ${actionButton("Track Your Order", ordersLink)}`
    ),
  });
}

export async function sendVendorStatusEmail(params: {
  vendorEmail: string;
  vendorName: string;
  shopName?: string;
  status: "approved" | "rejected";
  rejectedReason?: string;
}) {
  const isApproved = params.status === "approved";
  const link = `${baseUrl()}/`;

  await sendMail({
    intendedRecipients: params.vendorEmail,
    subject: isApproved
      ? "Vendor Account Approved — SnapMart"
      : "Vendor Account Rejected — SnapMart",
    html: emailShell(
      isApproved ? "Vendor Approved" : "Vendor Rejected",
      `<p>Hi ${params.vendorName},</p>
       <p>Your vendor account${params.shopName ? ` for <b>${params.shopName}</b>` : ""} has been <b>${params.status}</b>.</p>
       ${
         !isApproved && params.rejectedReason
           ? `<p style="background:#fee2e2;padding:10px;border-radius:6px"><b>Reason:</b> ${params.rejectedReason}</p>`
           : ""
       }
       ${actionButton(isApproved ? "Open Vendor Dashboard" : "Verify Again", link)}`
    ),
  });
}

export async function sendProductStatusEmail(params: {
  vendorEmail: string;
  vendorName: string;
  productTitle: string;
  productId: string;
  status: "approved" | "rejected";
  rejectedReason?: string;
}) {
  const isApproved = params.status === "approved";
  const productLink = `${baseUrl()}/viewProduct/${params.productId}`;
  const vendorLink = `${baseUrl()}/`;

  await sendMail({
    intendedRecipients: params.vendorEmail,
    subject: isApproved
      ? `Product Approved — ${params.productTitle}`
      : `Product Rejected — ${params.productTitle}`,
    html: emailShell(
      isApproved ? "Product Approved" : "Product Rejected",
      `<p>Hi ${params.vendorName},</p>
       <p>Your product <b>${params.productTitle}</b> has been <b>${params.status}</b> by admin.</p>
       ${
         !isApproved && params.rejectedReason
           ? `<p style="background:#fee2e2;padding:10px;border-radius:6px"><b>Reason:</b> ${params.rejectedReason}</p>`
           : ""
       }
       ${actionButton(isApproved ? "View Product" : "Edit Product", isApproved ? productLink : `${baseUrl()}/updateProduct/${params.productId}`)}
       ${actionButton("Vendor Dashboard", vendorLink)}`
    ),
  });
}

export async function sendNewVendorAnnouncementToUsers(params: {
  userEmails: string[];
  vendorName: string;
  shopName: string;
  shopAddress: string;
}) {
  if (params.userEmails.length === 0) return;

  const shopLink = `${baseUrl()}/shop`;

  await sendMail({
    intendedRecipients: params.userEmails,
    subject: `New Shop on SnapMart — ${params.shopName}`,
    html: emailShell(
      "New Seller Joined SnapMart",
      `<p>Hi there 👋</p>
       <p>A new verified seller is joining SnapMart!</p>
       <p><b>${params.shopName}</b> by ${params.vendorName}</p>
       <p><b>Location:</b> ${params.shopAddress}</p>
       ${actionButton("Explore Shops", shopLink)}`
    ),
  });
}

export async function sendNewVendorRequestToAdmin(params: {
  adminEmails: string[];
  vendorName: string;
  vendorEmail: string;
  shopName: string;
  shopAddress: string;
  gstNumber: string;
}) {
  const link = `${baseUrl()}/`;

  await sendMail({
    intendedRecipients: params.adminEmails,
    subject: `New Vendor Verification Request — ${params.shopName}`,
    html: emailShell(
      "Vendor Approval Needed",
      `<p>A new vendor has submitted shop details for verification.</p>
       <p><b>Name:</b> ${params.vendorName}</p>
       <p><b>Email:</b> ${params.vendorEmail}</p>
       <p><b>Shop:</b> ${params.shopName}</p>
       <p><b>Address:</b> ${params.shopAddress}</p>
       <p><b>GST:</b> ${params.gstNumber}</p>
       ${actionButton("Open Admin Panel → Vendor Approval", link)}`
    ),
  });
}

export async function sendNewProductEmails(params: {
  adminEmails: string[];
  userEmails: string[];
  vendorName: string;
  shopName?: string;
  productTitle: string;
  productId: string;
  price: number;
  category: string;
}) {
  const productLink = `${baseUrl()}/viewProduct/${params.productId}`;
  const adminLink = `${baseUrl()}/`;

  await sendMail({
    intendedRecipients: params.adminEmails,
    subject: `New Product Pending Approval — ${params.productTitle}`,
    html: emailShell(
      "Product Approval Needed",
      `<p><b>${params.vendorName}</b> added a new product awaiting approval.</p>
       <p><b>Product:</b> ${params.productTitle}</p>
       <p><b>Category:</b> ${params.category}</p>
       <p><b>Price:</b> ₹${params.price}</p>
       ${actionButton("Open Admin Panel → Product Approval", adminLink)}`
    ),
  });

  if (params.userEmails.length === 0) return;

  await sendMail({
    intendedRecipients: params.userEmails,
    subject: `New on SnapMart — ${params.productTitle}`,
    html: emailShell(
      "Discover Something New",
      `<p>Hi there 👋</p>
       <p><b>${params.shopName || params.vendorName}</b> just listed a new product on SnapMart!</p>
       <p><b>${params.productTitle}</b></p>
       <p><b>Category:</b> ${params.category}</p>
       <p><b>Price:</b> ₹${params.price}</p>
       ${actionButton("Shop Now", productLink)}`
    ),
  });
}

export async function sendFollowerNewProductEmail(params: {
  followerEmails: string[];
  shopName: string;
  productTitle: string;
  productId: string;
  price: number;
}) {
  if (params.followerEmails.length === 0) return;

  const productLink = `${baseUrl()}/viewProduct/${params.productId}`;

  await sendMail({
    intendedRecipients: params.followerEmails,
    subject: `New from ${params.shopName} — ${params.productTitle}`,
    html: emailShell(
      "Shop You Follow Has a New Product",
      `<p>Hi there 👋</p>
       <p><b>${params.shopName}</b>, a shop you follow, just added:</p>
       <p><b>${params.productTitle}</b> — ₹${params.price}</p>
       ${actionButton("View Product", productLink)}`
    ),
  });
}

export async function sendOrderStatusUpdateEmails(params: {
  orderId: string;
  status: string;
  buyerEmail: string;
  buyerName: string;
  adminEmails: string[];
  productTitle: string;
  vendorName: string;
}) {
  const userLink = `${baseUrl()}/orders`;
  const adminLink = `${baseUrl()}/`;
  const statusLabel = params.status.charAt(0).toUpperCase() + params.status.slice(1);

  await sendMail({
    intendedRecipients: params.buyerEmail,
    subject: `Order ${statusLabel} — SnapMart`,
    html: emailShell(
      "Order Status Update",
      `<p>Hi ${params.buyerName},</p>
       <p>Your order status has been updated to <b>${statusLabel}</b>.</p>
       <p><b>Order ID:</b> ${params.orderId}</p>
       <p><b>Product:</b> ${params.productTitle}</p>
       <p><b>Vendor:</b> ${params.vendorName}</p>
       ${actionButton("Track Your Order", userLink)}`
    ),
  });

  await sendMail({
    intendedRecipients: params.adminEmails,
    subject: `Order ${statusLabel} — ${params.productTitle}`,
    html: emailShell(
      "Order Status Update (Admin)",
      `<p>Order <b>${params.orderId}</b> is now <b>${statusLabel}</b>.</p>
       <p><b>Buyer:</b> ${params.buyerName}</p>
       <p><b>Product:</b> ${params.productTitle}</p>
       <p><b>Vendor:</b> ${params.vendorName}</p>
       ${actionButton("Open Admin Panel → Orders", adminLink)}`
    ),
  });
}

export async function getAdminEmails(): Promise<string[]> {
  const User = (await import("@/model/user.model")).default;
  const admins = await User.find({ role: "admin" }).select("email");
  return admins.map((a) => a.email).filter(Boolean);
}

export async function getUserEmails(): Promise<string[]> {
  const User = (await import("@/model/user.model")).default;
  const users = await User.find({ role: "user" }).select("email");
  return users.map((u) => u.email).filter(Boolean);
}
