import Order from "../models/OrderModel.js";

// ============================================================
//  GET /api/admin/sales-report
//  Query Params: startDate, endDate, period
// ============================================================
export const getSalesReport = async (req, res) => {
  try {
    const { startDate, endDate, period } = req.query;

    let start, end;
    const now = new Date();

    if (startDate && endDate) {
      start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
    } else if (period) {
      end = new Date();
      start = new Date();
      if (period === "Daily") {
        start.setHours(0, 0, 0, 0);
      } else if (period === "Weekly") {
        start.setDate(now.getDate() - 7);
      } else if (period === "Monthly") {
        start.setMonth(now.getMonth() - 1);
      } else if (period === "Yearly") {
        start.setFullYear(now.getFullYear() - 1);
      }
    } else {
      // Default to last 30 days
      end = new Date();
      start = new Date();
      start.setMonth(now.getMonth() - 1);
    }

    // Pipeline to get aggregated sales data
    const matchCondition = {
      createdAt: { $gte: start, $lte: end },
      orderStatus: { $nin: ["Cancelled", "Returned"] }
    };

    const overallStatsAgg = await Order.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: null,
          totalSales: { $sum: "$finalAmount" },
          totalOrders: { $sum: 1 },
          totalDiscount: { $sum: "$discount" },
          netProfit: { $sum: { $subtract: ["$finalAmount", "$shippingCharges"] } } // Example calculation
        }
      }
    ]);

    const overallStats = overallStatsAgg[0] || {
      totalSales: 0,
      totalOrders: 0,
      totalDiscount: 0,
      netProfit: 0
    };

    // Detailed report by date
    const detailedReport = await Order.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          orderCount: { $sum: 1 },
          grossSales: { $sum: "$totalPrice" },
          discounts: { $sum: "$discount" },
          netSales: { $sum: "$finalAmount" }
        }
      },
      { $sort: { _id: -1 } }
    ]);

    res.json({
      success: true,
      stats: overallStats,
      report: detailedReport,
      range: { start, end }
    });

  } catch (error) {
    console.error("Sales Report Controller Error:", error);
    res.status(500).json({ success: false, message: "Server error while generating sales report" });
  }
};
