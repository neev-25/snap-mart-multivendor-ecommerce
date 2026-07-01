export type StockAlertLevel = "critical" | "warning" | "ok" | "no_data";

export interface StockAlert {
  productId: string;
  title: string;
  currentStock: number;
  unitsSold14d: number;
  avgDailySales: number;
  daysUntilStockout: number | null;
  alertLevel: StockAlertLevel;
  message: string;
  reorderSuggestion: number;
}

const MS_DAY = 24 * 60 * 60 * 1000;

export function computeStockAlerts(
  products: {
    _id: string;
    title: string;
    stock: number;
  }[],
  orderLines: {
    productId: string;
    quantity: number;
    createdAt: Date;
    orderStatus: string;
  }[],
  lookbackDays = 14
): StockAlert[] {
  const cutoff = Date.now() - lookbackDays * MS_DAY;
  const activeStatuses = new Set(["pending", "confirmed", "shipped", "delivered"]);

  return products.map((product) => {
    const pid = String(product._id);
    const relevant = orderLines.filter(
      (o) =>
        o.productId === pid &&
        activeStatuses.has(o.orderStatus) &&
        new Date(o.createdAt).getTime() >= cutoff
    );

    const unitsSold14d = relevant.reduce((s, o) => s + o.quantity, 0);
    const avgDailySales = unitsSold14d / lookbackDays;

    if (unitsSold14d === 0) {
      const alertLevel: StockAlertLevel =
        product.stock <= 5 ? "warning" : "no_data";
      return {
        productId: pid,
        title: product.title,
        currentStock: product.stock,
        unitsSold14d: 0,
        avgDailySales: 0,
        daysUntilStockout: null,
        alertLevel,
        message:
          product.stock <= 5
            ? "Low stock but no recent sales — monitor inventory."
            : "No sales in last 14 days — stock level OK.",
        reorderSuggestion: 0,
      };
    }

    const daysUntilStockout =
      avgDailySales > 0 ? Math.floor(product.stock / avgDailySales) : null;

    let alertLevel: StockAlertLevel = "ok";
    let message = `~${daysUntilStockout} days of stock left at current sales pace.`;
    let reorderSuggestion = 0;

    if (product.stock === 0) {
      alertLevel = "critical";
      message = "Out of stock — restock immediately.";
      reorderSuggestion = Math.max(10, Math.ceil(avgDailySales * 14));
    } else if (daysUntilStockout !== null && daysUntilStockout <= 7) {
      alertLevel = "critical";
      message = `Critical: stock may run out in ~${daysUntilStockout} days.`;
      reorderSuggestion = Math.ceil(avgDailySales * 21);
    } else if (daysUntilStockout !== null && daysUntilStockout <= 14) {
      alertLevel = "warning";
      message = `Warning: reorder within ~${daysUntilStockout} days.`;
      reorderSuggestion = Math.ceil(avgDailySales * 14);
    } else {
      reorderSuggestion = Math.ceil(avgDailySales * 7);
    }

    return {
      productId: pid,
      title: product.title,
      currentStock: product.stock,
      unitsSold14d,
      avgDailySales: Number(avgDailySales.toFixed(2)),
      daysUntilStockout,
      alertLevel,
      message,
      reorderSuggestion,
    };
  }).sort((a, b) => {
    const rank = { critical: 0, warning: 1, ok: 2, no_data: 3 };
    return rank[a.alertLevel] - rank[b.alertLevel];
  });
}
