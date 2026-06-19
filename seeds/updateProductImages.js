import mongoose from "mongoose";
import dns from "dns";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

// Set Google DNS resolution for MongoDB Atlas stability
dns.setServers(["8.8.8.8", "8.8.4.4"]);

dotenv.config({ path: "./.env" });

import Product from "../models/Product.js";
import Category from "../models/Category.js";

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/urbantiq";
const BRAIN_DIR = "C:/Users/LENOVO/.gemini/antigravity-ide/brain/059551db-a5f0-4f91-8f4b-fc6150d1c660";

const PRODUCT_BASE_MAP = {
  // SHIRTS
  "Classic Oxford Cotton Shirt": "shirts_oxford_base",
  "Premium Linen Summer Shirt": "shirts_linen_base",
  "Vintage Denim Casual Shirt": "shirts_denim_base",
  "Flannel Plaid Button Down": "shirts_flannel_base",
  "Sateen Luxury Dress Shirt": "shirts_dress_base",
  "Oversized Utility Cargo Shirt": "shirts_cargo_base",
  
  // JEANS
  "Slim Fit Stretch Jeans": "jeans_slim_base",
  "Relaxed Fit Straight Jeans": "jeans_straight_base",
  "Athletic Tapered Denim": "jeans_tapered_base",
  "Classic Bootcut Jeans": "jeans_bootcut_base",
  "Skinny Fit Black Jeans": "jeans_skinny_base",
  "Vintage Wash Workwear Jeans": "jeans_vintage_base",
  
  
  // HOODIES (Excluded from this migration)
  /*
  "Heavyweight French Terry Hoodie": "hoodies_terry_base",
  "Premium Fleece Pullover": "hoodies_fleece_base",
  "Full-Zip Athletic Hoodie": "hoodies_zip_base",
  "Oversized Streetwear Hoodie": "hoodies_oversized_base",
  "Colorblock Casual Hoodie": "hoodies_colorblock_base",
  "Thermal Lined Winter Hoodie": "hoodies_thermal_base",
  */
  
  // FORMALS (Excluded from this migration)
  /*
  "Tailored Fit Dress Trouser": "formals_trouser_base",
  "Classic Double-Breasted Suit Jacket": "formals_dbjacket_base",
  "Premium Wool Blend Blazer": "formals_blazer_base",
  "Slim Fit Formal Vest": "formals_vest_base",
  "Structured Tuxedo Shirt": "formals_tuxedo_base",
  "Modern Stretch Chino Pants": "formals_chino_base",
  */
  
  // FIVE SLEEVES
  "Elbow Sleeve Knitted Tee": "five_knitted_base",
  "Five-Sleeve Relaxed Henley": "five_henley_base",
  "Athletic Five-Sleeve Raglan": "five_raglan_base",
  "Premium Waffle Knit Elbow Tee": "five_waffle_base",
  "Textured Summer Five-Sleeve Shirt": "five_summer_base",
  "Minimalist Drop-Shoulder Five-Sleeve": "five_drop_base",
  
  // T SHIRTS
  "Classic Crewneck Organic Tee": "tshirts_organic_base",
  "Heavyweight Boxy Fit T-Shirt": "tshirts_boxy_base",
  "Premium V-Neck Pima Tee": "tshirts_vneck_base",
  "Vintage Graphic Street Tee": "tshirts_graphic_base",
  "Slub Cotton Pocket Tee": "tshirts_pocket_base",
  "Active Dry-Fit Training Tee": "tshirts_dryfit_base"
};

const sanitizeFilename = (str) => {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
};

async function run() {
  console.log("🚀 Starting URBANIQ Product Photography Migration Script...");
  
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB.");

    const products = await Product.find({}).populate("category");
    console.log(`Found ${products.length} products in database.`);

    // Read files in the brain workspace to find generated base images
    if (!fs.existsSync(BRAIN_DIR)) {
      throw new Error(`Brain workspace directory not found: ${BRAIN_DIR}`);
    }
    const brainFiles = fs.readdirSync(BRAIN_DIR);

    let successCount = 0;
    let pendingCount = 0;

    for (const product of products) {
      const basePrefix = PRODUCT_BASE_MAP[product.name];
      if (!basePrefix) {
        console.warn(`⚠️ No base image prefix mapped for product name: "${product.name}"`);
        pendingCount++;
        continue;
      }

      // Find file matching `basePrefix_[digits].(png|webp|jpg|jpeg)` in the brain directory
      const matchingFile = brainFiles.find(file => {
        return file.startsWith(basePrefix + "_") && 
          (file.endsWith(".png") || file.endsWith(".webp") || file.endsWith(".jpg") || file.endsWith(".jpeg"));
      });

      if (!matchingFile) {
        console.log(`⏳ [PENDING] Base image not generated yet for: "${product.name}" (Prefix: ${basePrefix})`);
        pendingCount++;
        continue;
      }

      const srcPath = path.join(BRAIN_DIR, matchingFile);
      const categoryName = product.category ? product.category.name : "fashion";
      
      console.log(`📦 [MIGRATING] Found base image "${matchingFile}" for "${product.name}". Copying color variants...`);

      // Get original file extension
      const fileExt = path.extname(matchingFile);

      // Update each variant's images array with 4 deterministic filenames
      for (const variant of product.variants) {
        const colorName = variant.colorName || "default";
        const images = [];
        for (let i = 1; i <= 4; i++) {
          const destFilename = `${sanitizeFilename(categoryName)}-${sanitizeFilename(product.name)}-${sanitizeFilename(colorName)}-${i}${fileExt}`;
          const destPath = path.join("public/images/products", destFilename);

          // Copy file
          fs.copyFileSync(srcPath, destPath);
          images.push(destFilename);
        }
        
        // Update DB variant images to have these 4 files
        variant.images = images;
      }

      // Save product update
      await Product.updateOne(
        { _id: product._id },
        { $set: { variants: product.variants } }
      );

      console.log(`✅ [SUCCESS] Migrated Product: "${product.name}"`);
      successCount++;
    }

    console.log(`\n==================================================`);
    console.log(`Migration Status Summary:`);
    console.log(`- Successfully Migrated Products: ${successCount}`);
    console.log(`- Pending (Awaiting Image Generation): ${pendingCount}`);
    console.log(`==================================================`);

  } catch (error) {
    console.error("❌ MIGRATION CRITICAL ERROR:", error.message);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 Database connection closed.");
  }
}

run();
