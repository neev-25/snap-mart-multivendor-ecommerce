import { auth } from "@/auth";
import connectDb from "@/lib/connectDB";
import { computeStockAlerts } from "@/lib/ml/stockAlerts";
import Order from "@/model/order.model";
import Product from "@/model/product.model";
import User from "@/model/user.model";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectDb();
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = await User.findById(session.user.id);
    if (!user || user.role !== "vendor") {
      return NextResponse.json({ message: "Vendor only" }, { status: 403 });
    }

    const products = await Product.find({ vendor: user._id }).select("title stock");
    const productIds = products.map((p) => p._id);

    const orders = await Order.find({
      "products.product": { $in: productIds },
    }).select("products orderStatus createdAt");

    const orderLines: {
      productId: string;
      quantity: number;
      createdAt: Date;
      orderStatus: string;
    }[] = [];

    for (const order of orders) {
      for (const line of order.products) {
        orderLines.push({
          productId: String(line.product),
          quantity: line.quantity,
          createdAt: order.createdAt,
          orderStatus: order.orderStatus,
        });
      }
    }

    const alerts = computeStockAlerts(
      products.map((p) => ({
        _id: String(p._id),
        title: p.title,
        stock: p.stock,
      })),
      orderLines
    );

    const critical = alerts.filter((a) => a.alertLevel === "critical").length;
    const warning = alerts.filter((a) => a.alertLevel === "warning").length;

    return NextResponse.json(
      {
        summary: { critical, warning, total: alerts.length },
        alerts,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: `Stock alert failed: ${error}` },
      { status: 500 }
    );
  }
}
