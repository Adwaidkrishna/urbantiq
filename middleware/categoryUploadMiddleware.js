import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = "public/images/categories";

// Auto-create directory if it doesn't exist
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const categoryUploadMiddleware = multer({ storage });

export default categoryUploadMiddleware;