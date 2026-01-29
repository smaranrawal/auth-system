import { User } from "../models/user.models.js";
import ErrorHandler from "../utils/errorHandler.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import {
  getUserByEmailOrPhone,
  registrationAttempts,
  validatePhoneNumber,
  createUser,
  generateVerificationCode,
  sendVerificationCode,
  allUserEntries,
  deleteDeuplicateUsers,
} from "../services/auth.js";

const userRegister = asyncHandler(async (req, res, next) => {
  const { name, email, phone, password, verificationMethod } = req.body;

  if (!name || !email || !phone || !password || !verificationMethod) {
    return next(new ErrorHandler("All fields are required", 400));
  }
  if (password.length > 32) {
    return next(
      new ErrorHandler("Password must not exceed 32 characters", 400),
    );
  }
  const validateNumber = validatePhoneNumber(phone);

  if (!validateNumber) {
    return next(new ErrorHandler("Invalid phone number ", 400));
  }

  const existingUser = await getUserByEmailOrPhone(email, phone);

  if (existingUser) {
    return next(new ErrorHandler("Email or Phone already exists", 400));
  }

  const registrationAttemptsByUser = await registrationAttempts(
    email,
    validateNumber,
  );
  if (registrationAttemptsByUser.length > 3) {
    return next(
      new ErrorHandler(
        "You have suceed the maximum number of attempts (3)",
        400,
      ),
    );
  }

  const userData = { name, email, phone: validateNumber, password };

  const user = await createUser(userData);
  const { verificationCode, verificationCodeExpire } =
    generateVerificationCode();
  user.verificationCode = verificationCode;
  user.verificationCodeExpire = verificationCodeExpire;
  await user.save();

  const message = await sendVerificationCode(
    verificationMethod,
    verificationCode,
    name,
    email,
    validateNumber,
  );

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { name: user.name, email: user.email, phone: user.phone },
        `User registered sucessfully.${message}`,
      ),
    );
});

const verifyOtp = asyncHandler(async (req, res, next) => {
  const { email, otp, phone } = req.body;

  if (!email || !otp || !phone) {
    return next(new ErrorHandler("All fields required", 400));
  }

  const validateNumber = validatePhoneNumber(phone);
  if (!validateNumber) {
    return next(new ErrorHandler("Invalid phone number ", 400));
  }

  const userEntries = await allUserEntries(email, phone);

  if (!userEntries) {
    return next(new ErrorHandler("User not found "), 400);
  }

  let user;

  if (userEntries.length > 1) {
    user = userEntries[0];
    await deleteDeuplicateUsers(user,email,phone);
   
  } else {
    user = userEntries[0];
  }
  if (user.verificationCode !== Number(otp)) {
    return next(new ErrorHandler("Invalid OTP"));
  }

  const currentTime = Date.now();

  const verificationCodeExpire = new Date(
    user.verificationCodeExpire,
  ).getTime();

  if (currentTime > verificationCodeExpire) {
    return next(new ErrorHandler("OTP Expired.", 400));
  }

  user.accountVerified = true;
  user.verificationCode = null;
  user.verificationCodeExpire = null;
  await user.save({ validateModifiedOnly: true });

  res.status(200).json(new ApiResponse(200, null, "OTP verified sucessfulyy"));
});

export { userRegister, verifyOtp };
