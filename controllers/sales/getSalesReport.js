import Order from "../../models/Order.js";

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
      end = new Date();
      start = new Date();
      start.setMonth(now.getMonth() - 1);
    }

    const matchCondition = {
      createdAt: { $gte: start, $lte: end }
    };

    const overallStatsAgg = await Order.aggregate([
      { $match: matchCondition },
      { $addFields: { numItems: { $size: "$items" } } },
      { $unwind: "$items" },
      { $match: { "items.itemStatus": { $nin: ["Cancelled", "Returned", "Return Rejected", "cancelled", "returned", "return rejected"] } } },
      {
        $group: {
          _id: null,
          totalSales: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
          totalOrders: { $addToSet: "$_id" },
          totalDiscount: { $sum: { $cond: [ { $eq: ["$numItems", 0] }, 0, { $divide: ["$discount", "$numItems"] } ] } }, // Approximate discount distribution
        }
      }
    ]);

    let overallStats = { totalSales: 0, totalOrders: 0, totalDiscount: 0, netProfit: 0 };
    if (overallStatsAgg.length > 0) {
      overallStats.totalSales = overallStatsAgg[0].totalSales;
      overallStats.totalOrders = overallStatsAgg[0].totalOrders.length;
      overallStats.totalDiscount = overallStatsAgg[0].totalDiscount;
      overallStats.netProfit = overallStats.totalSales; // Simplified net profit
    }

    const detailedReport = await Order.aggregate([
      { $match: matchCondition },
      { $unwind: "$items" },
      { $match: { "items.itemStatus": { $nin: ["Cancelled", "Returned", "Return Rejected", "cancelled", "returned", "return rejected"] } } },
      {
        $group: {
          _id: { date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, orderId: "$_id" },
          grossSales: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
          discounts: { $first: "$discount" }
        }
      },
      {
        $group: {
          _id: "$_id.date",
          orderCount: { $sum: 1 },
          grossSales: { $sum: "$grossSales" },
          discounts: { $sum: "$discounts" },
          netSales: { $sum: { $subtract: ["$grossSales", "$discounts"] } }
        }
      },
      { $sort: { _id: -1 } }
    ]);

    res.json({ success: true, stats: overallStats, report: detailedReport, range: { start, end } });
  } catch (error) {
    console.error("Sales Report Controller Error:", error);
    res.status(500).json({ success: false, message: "Server error while generating sales report" });
  }
};
