const { cron } = require("../utils/imports.util");
const { OTP } = require("../models/index");

function setupOTPCleanup() {
  // Run every 10 minutes
  cron.schedule("*/10 * * * *", async () => {
    try {
      const result = await OTP.deleteMany({
        expirationTime: { $lt: new Date() },
      });
      console.log(`Deleted ${result.deletedCount} expired OTPs`);
    } catch (error) {
      console.error("Error cleaning up expired OTPs:", error);
    }
  });
}

module.exports = setupOTPCleanup;
