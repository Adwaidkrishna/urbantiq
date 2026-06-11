import Product from "../../models/Product.js";
import Offer from "../../models/Offer.js";

let lastCheckTime = 0;

export const applyOffers = async (force = false) => {
  const now = Date.now();
  // checking offer in every 60 seconds
  if (!force && now - lastCheckTime < 60000) {
    return;
  }
  lastCheckTime = now;

  try {
    const currentDate = new Date();
    // Fetch all active category offers whose validity range includes the current time
    const activeOffers = await Offer.find({
      status: "active",
      startDate: { $lte: currentDate },
      endDate: { $gte: currentDate }
    });



    // discount persentage keep the highest 10%>5%
    const categoryOfferMap = {};
    let globalDiscountPercentage = null;

    activeOffers.forEach(offer => {
      if (offer.category) {
        const catId = offer.category.toString();
        if (!categoryOfferMap[catId] || categoryOfferMap[catId] < offer.discountPercentage) {
          categoryOfferMap[catId] = offer.discountPercentage;
        }
      } else {
        // all categories discount
        if (globalDiscountPercentage === null || globalDiscountPercentage < offer.discountPercentage) {
          globalDiscountPercentage = offer.discountPercentage;
        }
      }
    });

    // Fetch all products
    const products = await Product.find({});
    const bulkOps = [];

    for (const product of products) {
      let productOfferPrice = product.productOfferPrice;
      let needsProductOfferPriceSave = false;

      // 
      if (product.productOfferPrice === undefined) {
        if (product.offerPrice !== undefined && product.offerPrice !== null) {
          productOfferPrice = product.offerPrice;
        } else {
          productOfferPrice = null;
        }
        product.productOfferPrice = productOfferPrice;
        needsProductOfferPriceSave = true;
      }

      // Calculate category discount price
      const catId = product.category ? product.category.toString() : null;
      let categoryDiscount = (catId && categoryOfferMap[catId]) ? categoryOfferMap[catId] : null;

      // take category discount 10% > global discount 5%
      if (globalDiscountPercentage !== null) {
        if (categoryDiscount === null || categoryDiscount < globalDiscountPercentage) {
          categoryDiscount = globalDiscountPercentage;
        }
      }

      let categoryOfferPrice = null;
      if (categoryDiscount) {//convert offer price into ruppeess
        categoryOfferPrice = Math.round(product.price * (1 - categoryDiscount / 100));
      }

      // Final offerPrice is the lowest price (highest discount) among custom and category offers
      let computedOfferPrice = null;
      if (productOfferPrice !== null && categoryOfferPrice !== null) {
        computedOfferPrice = Math.min(productOfferPrice, categoryOfferPrice);
      } else if (productOfferPrice !== null) {
        computedOfferPrice = productOfferPrice;
      } else if (categoryOfferPrice !== null) {
        computedOfferPrice = categoryOfferPrice;
      }



      // If the actual offerPrice in the DB differs, update it
      if (product.offerPrice !== computedOfferPrice || needsProductOfferPriceSave) {
        bulkOps.push({
          updateOne: {
            filter: { _id: product._id },
            update: {
              $set: {
                offerPrice: computedOfferPrice,
                productOfferPrice: productOfferPrice
              }
            }
          }
        });
      }
    }

    if (bulkOps.length > 0) {

      await Product.bulkWrite(bulkOps);
      console.log(`[applyOffers] Synchronized ${bulkOps.length} products with active offers.`);
    }
  } catch (error) {
    console.error("[applyOffers] Error recalculating offer prices:", error);
  }
};
