import multer from "multer";
import fs from "fs";

const uploadDir = "public/images/products";

//this middleware it is used to upload images of products with unique names
//and storing them in the public/images/products folder

fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({

  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  }

});

const uploadProduct = multer({ storage });

export default uploadProduct;