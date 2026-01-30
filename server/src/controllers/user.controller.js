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
  generateResetToken,
} from "../services/auth.js";
import {
  encryptPassword,
  generateJWTToken,
  verifyPassoword,
} from "../utils/auth.js";
import { sendEmail } from "../utils/sendEmail.js";
import crypto from "crypto";

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
    await deleteDeuplicateUsers(user, email, phone);
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

const loginController = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ErrorHandler("Email or password is required", 400));
  }

  const user = await getUserByEmailOrPhone(email);

  if (!user) {
    return next(new ErrorHandler("User is not found"), 400);
  }

  const passwordMatched = await verifyPassoword(password, user.password);
  if (!passwordMatched) {
    return next(new ErrorHandler("Invalid Passowrd", 400));
  }

  const jwtToken = generateJWTToken(user);

  res.cookie("token", jwtToken, {
    httpOnly: true,
    secure: false,
    maxAge: 24 * 60 * 60 * 1000, //1 day
    sameSite: "strict",
  });

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { name: user.name, email: user.email, phone: user.phone },
        "User logged in ",
      ),
    );
});

const logoutController = asyncHandler(async (req, res) => {
  res.cookie("token", "", {
    httpOnly: true,
    expires: new Date(0), // 👈 immediately expires
    sameSite: "strict",
    secure: false, // true in production
  });

  res.status(200).json(new ApiResponse(200, "User logout sucessfully;"));
});

const getUser = asyncHandler(async (req, res) => {
  const user = req.user;

  res.status(200).json(new ApiResponse(200, user));
});

const forgotPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new ErrorHandler("Email is required", 400));
  }

  const user = await User.findOne({ email, accountVerified: true });
  if (!user) {
    return next(new ErrorHandler("User not found", 400));
  }

  const { resetToken, hashedToken } = generateResetToken();
  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

  await user.save({ validateBeforeSave: false });
  console.log("RESET TOKEN", resetToken);
  console.log(hashedToken);

  const resetPasswordUrl = `${process.env.FRONTEND_URL}/password/reset/${resetToken}`;
  const message = `Your reset password is: \n\n${resetPasswordUrl}\n\n If you have not requested this email then please ignore it `;
  try {
    await sendEmail(
      user.email,
      "MERN AUTHENTICATION APP RESET PASSWORD",
      message,
    );

    res
      .status(200)
      .json(new ApiResponse(200, `Email sent to ${user.email} sucessfully`));
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new ErrorHandler(
        error.message ? error.message : "Cannot send reset password token ",
      ),
    );
  }
});

const resetPassword = asyncHandler(async (req, res, next) => {
  const { token } = req.params;
  const { newPassword, confirmPassword } = req.body;
  if (!newPassword || !confirmPassword) {
    return next(new ErrorHandler("All fields are required", 400));
  }
  if (newPassword !== confirmPassword) {
    return next(
      new ErrorHandler("Password and ConfirmPassword  donot match", 400),
    );
  }

  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(token) //takes the token generated using crypto and hashed it and the searches user using that hashed token
    .digest("hex");
  console.log("Token", token);
  console.log("hassehd", resetPasswordToken);
  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });
  console.log(user);
  if (!user) {
    return next(
      new ErrorHandler("Reset password token is invalid or expired", 400),
    );
  }

  user.password = await encryptPassword(newPassword);

  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  res
    .status(200)
    .json(new ApiResponse(200, user, "password reset sucessfully"));
});

export {
  userRegister,
  verifyOtp,
  loginController,
  logoutController,
  getUser,
  forgotPassword,
  resetPassword,
};
