import { User } from "../models/user.models.js";

import { encryptPassword, getTwilio } from "../utils/auth.js";
import ErrorHandler from "../utils/errorHandler.js";
import { sendEmail } from "../utils/sendEmail.js";

const validatePhoneNumber = (phone) => {
  const phoneRegex = /^(97|98)\d{8}$/;
  if (!phoneRegex.test(phone)) {
    return null;
  }
  return `+977${phone}`;
};

const getUserByEmailOrPhone = async (email, phone) => {
  try {
    const user = await User.findOne({
      $or: [
        { email, accountVerified: true },
        { phone, accountVerified: true },
      ],
    });
    if (!user) {
      return null;
    }
    return user;
  } catch (error) {
    console.error("Error fetching user by email", error);
  }
};

const registrationAttempts = async (email, phone) => {
  const user = await User.find({
    $or: [
      { email, accountVerified: true },
      { phone, accountVerified: true },
    ],
  });
  if (!user) {
    return null;
  }
  return user;
};

const createUser = async (userData) => {
  const user = await User.create({
    ...userData,
    password: await encryptPassword(userData.password),
  });
  return user;
  // try {
  //   const user = await User.create({
  //     ...userData,
  //     password: await encryptPassword(userData.password),
  //   });
  //   return user;
  // } catch (error) {
  //   if (error.code === 11000) {
  //     throw new ErrorHandler("Email already exists", 400);
  //   }
  //   throw error;
  // }
};

const generateVerificationCode = () => {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expire = Date.now() + 5 * 60 * 1000; // 5 minutes
  return { verificationCode: code, verificationCodeExpire: expire };
};

const sendVerificationCode = async (
  verificationMethod,
  verificationCode,
  name,
  email,
  phone,
) => {
  if (verificationMethod === "email") {
    const message = generateEmailTemplate(verificationCode);
    await sendEmail(email, "Your verifcation code ", message);

    return `Verification code sent to ${name}`;
  } else if (verificationMethod === "phone") {
    const client = getTwilio();
    const verificationCodeWithSpace = verificationCode
      .toString()
      .split("")
      .join(" ");
    await client.messages.create({
      body: `Hello ${name}, Your OTP Code is ${verificationCodeWithSpace}. Valid for 5 minutes Thank You`,
      from: process.env.TWILIO_PHONE,
      to: phone,
    });

    // res.status(201).json(new ApiResponse(200, true, "OTP sent.."));
    return `OTP sent to ${name}`;
  } else {
    throw new ErrorHandler("Invalid verification method", 500);
  }
};

const generateEmailTemplate = (verificationCode) => {
  return `
  <div style="font-family:Arial, sans-serif; background-color:#f4f4f4; padding:20px;">
    <div style="max-width:400px; margin:auto; background-color:#fff; padding:20px; border-radius:8px;">
      <h2 style="text-align:center; color:#333;">Verify Your Email</h2>
      <p style="text-align:center; color:#555;">Your verification code is:</p>
      <p style="text-align:center; font-size:28px; font-weight:bold; color:#2563eb; letter-spacing:4px;">
        ${verificationCode}
      </p>
      <p style="text-align:center; color:#888; font-size:12px;">This code will expire in 5 minutes.</p>
      <p style="text-align:center; color:#555; font-size:14px;">If you did not request this, please ignore this email.</p>
    </div>
  </div>
  `;
};
export {
  validatePhoneNumber,
  createUser,
  getUserByEmailOrPhone,
  registrationAttempts,
  generateVerificationCode,
  sendVerificationCode,
  generateEmailTemplate,
};
