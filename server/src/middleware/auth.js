import { User } from "../models/user.models.js";
import asyncHandler from "../utils/asyncHandler.js";
import ErrorHandler from "../utils/errorHandler.js";
import jwt from "jsonwebtoken";

const isProtected = asyncHandler(async (req, res, next) => {
  const { token } = req.cookies;
  console.log("Token", token);
  if (!token) {
    return next(new ErrorHandler("Authentication required", 401));
  }
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  req.user = await User.findById(decoded.id).select("-password");

  if (!req.user) {
    return next(new ErrorHandler("User not found", 401));
  }
  next();
});

export { isProtected };
