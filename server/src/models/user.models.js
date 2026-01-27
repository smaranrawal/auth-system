import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    fullname: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      minlength: [8, "Password must have a least 8 character"],
      maxlength: [32, "Password must not have more than 32 character"],
    },
    phone: {
      type: String,
      required: true,
      maxlength: [10, "Phone number must be of 10 characters"],
    },
    accountVerified: {
      type: Boolean,
      default: false,
    },
    verificationCode: {
      type: String,
    },
    verificationCodeExpire: {
      type: Date,
    },
    resetPasswordToken: {
      type: String,
    },
    resetPassowrdExpire: {
      type: Date,
    },
  },
  { timestamps: true },
);

export const User = mongoose.model("user", userSchema);
