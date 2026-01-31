import cron from "node-cron";
import { User } from "../models/user.models.js";
import asyncHandler from "../utils/asyncHandler.js";

const removeUnverifiedUsers = () => {
  cron.schedule("*/30 * * * *", async () => {
    try {
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
      await User.deleteMany({
        accountVerified: false,
        createdAt: { $lt: thirtyMinutesAgo },
      });
      //   console.log("Backend");
    } catch (error) {
      console.error("Cron error:", error.message);
    }
  });
};

export default removeUnverifiedUsers;
