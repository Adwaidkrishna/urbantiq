import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/profile",authMiddleware,(req,res)=>{

res.send("User Profile Page");

});

export default router;