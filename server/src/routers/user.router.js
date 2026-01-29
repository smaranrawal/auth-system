import express from "express";
import {
  loginController,
  logoutController,
  userRegister,
  verifyOtp,
} from "../controllers/user.controller.js";

const router = express.Router();

router.post("/register", userRegister);
router.post("/verify-otp", verifyOtp);
router.post("/login", loginController);
router.post("/logout",logoutController)
export default router;
