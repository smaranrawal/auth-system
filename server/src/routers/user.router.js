import express from "express";
import {
  loginController,
  userRegister,
  verifyOtp,
} from "../controllers/user.controller.js";

const router = express.Router();

router.post("/register", userRegister);
router.post("/verify-otp", verifyOtp);
router.post("/login", loginController);
export default router;
