import bcrypt from "bcryptjs";
import twilio from "twilio";
import jwt from "jsonwebtoken";
const encryptPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  return hashedPassword;
};

const verifyPassoword = async (inputPassword, storedHashedPassword) => {
  return await bcrypt.compare(inputPassword, storedHashedPassword);
};

const generateJWTToken = (user) => {
  const token = jwt.sign(
    {
      id: user._id,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "1d",
    },
  );
  // console.log(token);
  return token;
};

const getTwilio = () => {
  return twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
};
export { encryptPassword, verifyPassoword, generateJWTToken, getTwilio };
