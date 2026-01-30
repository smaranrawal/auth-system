import express from "express";
import {
  forgotPassword,
  getUser,
  loginController,
  logoutController,
  resetPassword,
  userRegister,
  verifyOtp,
} from "../controllers/user.controller.js";
import { isProtected } from "../middleware/auth.js";

const router = express.Router();

router.post("/register", userRegister);
router.post("/verify-otp", verifyOtp);
router.post("/login", loginController);
router.post("/logout", isProtected, logoutController);
router.post("/getuser", isProtected, getUser);
router.post("/forgotpassword", forgotPassword);
router.put("/resetpassword/:token", resetPassword);
export default router;
