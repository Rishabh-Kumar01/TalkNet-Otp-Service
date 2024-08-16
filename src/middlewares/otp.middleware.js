const { ValidationError } = require("../utils/index.util").errorHandler;

class OTPMiddleware {
  static validateSendOTP(req, res, next) {
    const { type, recipient } = req.body;
    if (!type || !recipient) {
      throw new ValidationError("Type and recipient are required");
    }
    if (type !== "email" && type !== "sms") {
      throw new ValidationError("Type must be either email or sms");
    }
    next();
  }

  static validateVerifyOTP(req, res, next) {
    const { otp, verificationKey } = req.body;
    if (!otp || !verificationKey) {
      throw new ValidationError("OTP and verificationKey are required");
    }
    next();
  }
}

module.exports = OTPMiddleware;
