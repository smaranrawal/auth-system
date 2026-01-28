import bcrypt from "bcryptjs";
import twilio from "twilio";
const encryptPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  return hashedPassword;
};

const getTwilio = () => {
  return twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
};
export { encryptPassword, getTwilio };
