/**
 * Global search controller for admin panel
 */
import mongoose from "mongoose";
import Product from "../models/ProductModel.js";
import Order from "../models/OrderModel.js";
import User from "../models/User.js";

export const globalSearch = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query || query.length < 2) {
      return res.json({ success: true, results: [] });
    }

    const regex = new RegExp(query, 'i');

    // Parallel search across models
    const [products, orders, customers] = await Promise.all([
      Product.find({ name: regex }).limit(5).select("name _id variants price"),
      Order.find({ _id: mongoose.Types.ObjectId.isValid(query) ? query : null }).limit(5).select("_id finalAmount orderStatus"),
      User.find({ $or: [{ firstName: regex }, { lastName: regex }, { email: regex }] }).limit(5).select("firstName lastName email _id")
    ]);

    const results = [
      ...products.map(p => ({ type: 'Product', title: p.name, link: `/api/admin/products`, price: p.price, id: p._id })),
      ...orders.filter(o => o).map(o => ({ type: 'Order', title: `Order #${o._id.toString().slice(-6).toUpperCase()}`, link: `/api/admin/order-management`, id: o._id })),
      ...customers.map(c => ({ type: 'Customer', title: `${c.firstName} ${c.lastName}`, link: `/api/admin/customers`, id: c._id }))
    ];

    res.json({ success: true, results });

  } catch (error) {
    console.error("Global Search Error:", error);
    res.status(500).json({ success: false, message: "Search failed" });
  }
};
