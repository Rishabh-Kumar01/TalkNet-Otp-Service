const otpService = require("../services/otp.service");

class OTPController {
  async sendOTP(req, res) {
    try {
      const { type, recipient } = req.body;
      const { success, data, error } = await otpService.createOTP(
        type,
        recipient
      );

      if (!success) {
        throw error;
      }

      const { otp, otpId } = data;

      let sendResult;
      if (type === "email") {
        sendResult = await otpService.sendOTPByEmail(recipient, otp);
      } else if (type === "sms") {
        sendResult = await otpService.sendOTPBySMS(recipient, otp);
      }

      if (!sendResult.success) {
        throw sendResult.error;
      }

      const verificationKey = otpService.generateVerificationKey(
        otpId,
        recipient
      );
      res.json({
        status: "Success",
        message: "OTP sent successfully",
        data: { verificationKey },
        error: {},
      });
    } catch (error) {
      console.log(error);
      res.status(error.statusCode || 500).json({
        status: "Failure",
        message: error.message,
        data: {},
        error: { details: error.description || "Internal Server Error" },
      });
    }
  }

  async verifyOTP(req, res) {
    try {
      const { otp, verificationKey, isTwoFactorAuth } = req.body;

      const recipientVerification = await otpService.verifyRecipient(
        verificationKey
      );
      if (!recipientVerification.success) {
        throw recipientVerification.error;
      }

      const user = recipientVerification.user;

      // If recipient is verified, proceed to verify the OTP
      const { success, data, error } = await otpService.verifyOTP(
        recipientVerification.data._id,
        user,
        otp,
        isTwoFactorAuth
      );

      if (!success) {
        throw error;
      }

      res.json({
        status: "Success",
        message: "OTP verified successfully",
        data: { verified: data },
        error: {},
      });
    } catch (error) {
      console.log(error, "Controller error");
      res.status(error.statusCode || 400).json({
        status: "Failure",
        message: error.message,
        data: {},
        error: { details: error.description || "Bad Request" },
      });
    }
  }
}

module.exports = new OTPController();
