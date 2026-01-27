import User from "../models/user.models";
import ErrorHandler from "../utils/errorHandler";
import asyncHandler from "../utils/asyncHandler";
import ApiResponse from "../utils/ApiResponse";
import {
  getUserByEmailOrPhone,
  registrationAttempts,
  validatePhoneNumber,
  createUser,
  generateVerificationCode,
} from "../services/auth.js";
const userRegister = asyncHandler(async (req, res, next) => {
  const { fullname, email, phone, password } = req.body;

  if (!fullname || !email || !phone || !password) {
    return next(new ErrorHandler("All fields are required", 400));
  }

  const validateNumber = validatePhoneNumber(phone);

  if (!validateNumber) {
    return next(new ErrorHandler("Invalid phone number ", 400));
  }

  const existingUser = await getUserByEmailOrPhone(email, phone);

  if (existingUser) {
    return next(new ErrorHandler("Email or Phone already exists", 400));
  }

  const registrationAttemptsByUser = await registrationAttempts(email, phone);
  if (registrationAttemptsByUser.length > 3) {
    return next(
      new ErrorHandler(
        "You have suceed the maximum number of attempts (3)",
        400,
      ),
    );
  }

  const userData = { fullname, email, phone, password };
  const user = await User.createUser(userData);
  const verificationCode = await user.generateVerificationCode();
  await user.save();
  sendVerificationCode(verificationMethod, verificationCode, email, phone);

  res
    .status(200)
    .json(new ApiResponse(200, user, "User registered sucessfully"));
});

export { userRegister };
