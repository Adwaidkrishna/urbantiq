import Order from "../models/OrderModel.js";
import User from "../models/User.js";
import Product from "../models/ProductModel.js";

// ============================================================
//  GET /api/admin/dashboard/stats
//  Returns: summary cards + sales chart + order status breakdown
// ============================================================
export const getDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    // ── 1. TOTAL REVENUE (all non-cancelled orders) ──────────────────
    const revenueAgg = await Order.aggregate([
      { $match: { orderStatus: { $nin: ["Cancelled", "Returned"] } } },
      { $group: { _id: null, total: { $sum: "$finalAmount" } } }
    ]);
    const totalRevenue = revenueAgg[0]?.total || 0;

    // ── 2. REVENUE THIS MONTH vs LAST MONTH ──────────────────────────
    const thisMonthRevenueAgg = await Order.aggregate([
      {
        $match: {
          orderStatus: { $nin: ["Cancelled", "Returned"] },
          createdAt: { $gte: startOfThisMonth }
        }
      },
      { $group: { _id: null, total: { $sum: "$finalAmount" } } }
    ]);
    const lastMonthRevenueAgg = await Order.aggregate([
      {
        $match: {
          orderStatus: { $nin: ["Cancelled", "Returned"] },
          createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth }
        }
      },
      { $group: { _id: null, total: { $sum: "$finalAmount" } } }
    ]);
    const thisMonthRevenue = thisMonthRevenueAgg[0]?.total || 0;
    const lastMonthRevenue = lastMonthRevenueAgg[0]?.total || 0;
    const revenueGrowth = lastMonthRevenue > 0
      ? (((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100).toFixed(1)
      : null;

    // ── 3. TOTAL ORDERS ──────────────────────────────────────────────
    const [totalOrders, thisMonthOrders, lastMonthOrders] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ createdAt: { $gte: startOfThisMonth } }),
      Order.countDocuments({ createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } })
    ]);
    const ordersGrowth = lastMonthOrders > 0
      ? (((thisMonthOrders - lastMonthOrders) / lastMonthOrders) * 100).toFixed(1)
      : null;

    // ── 4. TOTAL CUSTOMERS ───────────────────────────────────────────
    const [totalCustomers, thisMonthCustomers, lastMonthCustomers] = await Promise.all([
      User.countDocuments({ isVerified: true }),
      User.countDocuments({ isVerified: true, createdAt: { $gte: startOfThisMonth } }),
      User.countDocuments({ isVerified: true, createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } })
    ]);
    const customersGrowth = lastMonthCustomers > 0
      ? (((thisMonthCustomers - lastMonthCustomers) / lastMonthCustomers) * 100).toFixed(1)
      : null;

    // ── 5. TOTAL PRODUCTS ─────────────────────────────────────────────
    const totalProducts = await Product.countDocuments({ status: true });

    // ── 6. MONTHLY SALES CHART (last 12 months) ─────────────────────
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    const monthlySalesAgg = await Order.aggregate([
      {
        $match: {
          orderStatus: { $nin: ["Cancelled", "Returned"] },
          createdAt: { $gte: twelveMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year:  { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          revenue: { $sum: "$finalAmount" },
          orders:  { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    // Build a full 12-month scaffold so months with no orders still show 0
    const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const chartLabels  = [];
    const chartRevenue = [];
    const chartOrders  = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      chartLabels.push(`${monthNames[m - 1]} ${y}`);
      const found = monthlySalesAgg.find(r => r._id.year === y && r._id.month === m);
      chartRevenue.push(found?.revenue || 0);
      chartOrders.push(found?.orders  || 0);
    }

    // ── 7. ORDER STATUS BREAKDOWN ─────────────────────────────────────
    const statusAgg = await Order.aggregate([
      { $group: { _id: "$orderStatus", count: { $sum: 1 } } }
    ]);
    const orderStatusBreakdown = {};
    statusAgg.forEach(s => { orderStatusBreakdown[s._id] = s.count; });

    // ── 8. RECENT ORDERS (last 5) ─────────────────────────────────────
    const recentOrders = await Order.find({})
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .limit(5)
      .select("_id user orderStatus finalAmount paymentMethod createdAt");

    // ── 9. LOW STOCK PRODUCTS (stock ≤ 5 across any size) ────────────
    const allProducts = await Product.find({ status: true })
      .populate("category", "name")
      .select("name variants category");

    const lowStockItems = [];
    for (const product of allProducts) {
      for (const variant of product.variants) {
        for (const sizeObj of variant.sizes) {
          if (sizeObj.stock <= 5) {
            lowStockItems.push({
              name: product.name,
              color: variant.colorName || variant.color,
              size: sizeObj.size,
              stock: sizeObj.stock
            });
          }
        }
      }
    }
    // Sort by stock ascending, take top 8
    lowStockItems.sort((a, b) => a.stock - b.stock);
    const topLowStock = lowStockItems.slice(0, 8);

    // ── 10. PAYMENT METHOD SPLIT (this month) ─────────────────────────
    const paymentSplitAgg = await Order.aggregate([
      { $match: { createdAt: { $gte: startOfThisMonth } } },
      { $group: { _id: "$paymentMethod", count: { $sum: 1 } } }
    ]);
    const paymentSplit = { COD: 0, Online: 0, Wallet: 0 };
    paymentSplitAgg.forEach(p => { if (paymentSplit.hasOwnProperty(p._id)) paymentSplit[p._id] = p.count; });

    res.json({
      success: true,
      stats: {
        totalRevenue,
        thisMonthRevenue,
        revenueGrowth,
        totalOrders,
        thisMonthOrders,
        ordersGrowth,
        totalCustomers,
        thisMonthCustomers,
        customersGrowth,
        totalProducts
      },
      chart: { labels: chartLabels, revenue: chartRevenue, orders: chartOrders },
      orderStatusBreakdown,
      recentOrders,
      lowStock: topLowStock,
      paymentSplit
    });

  } catch (err) {
    console.error("Dashboard Stats Error:", err);
    res.status(500).json({ success: false, message: "Failed to load dashboard stats" });
  }
};
