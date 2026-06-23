import Product from "../../models/Product.js";
import Order from "../../models/Order.js";
import { applyOffers } from "../offer/offerUtils.js";

export const getProductDetails = async (req, res) => {
    try {
        await applyOffers();
        const product = await Product
            .findById(req.params.id)
            .populate("category", "name");

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        const orders = await Order.find({ 
            "items.product": product._id
        });
        
        let salesCount = 0;
        orders.forEach(order => {
             order.items.forEach(item => {
                  if (
                      item.product.toString() === product._id.toString() &&
                      !["Cancelled", "Returned", "Return Rejected"].includes(item.itemStatus)
                  ) {
                       salesCount += item.quantity;
                  }
             });
        });

        const productObj = product.toObject();
        productObj.salesCount = salesCount;

        res.status(200).json({
            success: true,
            product: productObj
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
