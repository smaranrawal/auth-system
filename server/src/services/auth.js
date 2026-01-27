import { User } from "../models/user.models";
import { encryptPassword } from "../utils/auth";

const validatePhoneNumber = (phone) => {
  const phoneRegex = /^\+977\d{9}$/;
  return phoneRegex.test(phone);
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
  try {
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
  } catch (error) {
    console.error("Registration attempts failed", error);
  }
};

const createUser = async (userData) => {
  try {
    const user = await User.create({
      ...userData,
      password: await encryptPassword(userData.password),
    });
    return user;
  } catch (error) {
    console.log("Error creating users", error);
  }
};

const  generateVerificationCode =async()=>{
   const code = Math.floor(100000 + Math.random() * 900000).toString();
  this.verificationCode = code;
  this.verificationCodeExpire = Date.now() + 5 * 60 * 1000;
  return code;
}

export {
  validatePhoneNumber,
  createUser,
  getUserByEmailOrPhone,
  registrationAttempts,
  generateVerificationCode,
};
