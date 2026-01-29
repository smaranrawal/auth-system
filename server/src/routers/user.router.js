import express from "express";
import { userRegister, verifyOtp } from "../controllers/user.controller.js";

const router = express.Router();

router.post("/register", userRegister);
router.post("/verify-otp", verifyOtp);
export default router;
