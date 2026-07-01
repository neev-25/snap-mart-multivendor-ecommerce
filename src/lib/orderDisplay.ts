/** Customer-facing order reference e.g. SM20250630A3F9K2 */
export function generateOrderNumber(): string {
  const now = new Date();
  const y = now.getFullYear();
  const mo = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const seq = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `SM${y}${mo}${d}${seq}`;
}

export function getOrderDisplayId(order: {
  orderNumber?: string;
  _id?: unknown;
}): string {
  if (order.orderNumber?.trim()) {
    return order.orderNumber.trim();
  }
  const id = String(order._id ?? "");
  if (id.length >= 8) {
    return `SM-${id.slice(-8).toUpperCase()}`;
  }
  return id || "—";
}

export function normalizeOrderIdParam(orderId: unknown): string {
  return String(orderId ?? "").trim();
}
