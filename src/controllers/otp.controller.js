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
      const { otp, verificationKey } = req.body;
      const { otpId, recipient } =
        otpService.decodeVerificationKey(verificationKey);

      const { success, data, error } = await otpService.verifyOTP(otpId, otp);

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
