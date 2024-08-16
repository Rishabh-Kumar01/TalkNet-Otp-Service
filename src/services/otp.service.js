const { nodemailer, twilio } = require("../utils/imports.util");
const { OTP } = require("../models/index");
const { encrypt, decrypt } = require("../utils/crypto");
const { ServiceError } = require("../utils/index.util").errorHandler;

class OTPService {
  constructor() {
    this.emailTransporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    this.twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
  }

  #generateOTP(length = 6) {
    const digits = "0123456789";
    let OTP = "";
    for (let i = 0; i < length; i++) {
      OTP += digits[Math.floor(Math.random() * 10)];
    }
    return OTP;
  }

  async createOTP(type, recipient) {
    try {
      const otp = this.#generateOTP();
      const expirationTime = new Date(
        Date.now() + parseInt(process.env.OTP_EXPIRY_TIME)
      );
      const newOTP = new OTP({ otp, expirationTime, type, recipient });
      await newOTP.save();
      return {
        success: true,
        data: { otp, otpId: newOTP._id },
        error: null,
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: new ServiceError("Failed to create OTP"),
      };
    }
  }

  async sendOTPByEmail(email, otp) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Your OTP for verification",
        text: `Your OTP is: ${otp}. It will expire in 5 minutes.`,
      };

      await this.emailTransporter.sendMail(mailOptions);
      return { success: true, data: null, error: null };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: new ServiceError("Failed to send OTP via email"),
      };
    }
  }

  async sendOTPBySMS(phoneNumber, otp) {
    try {
      await this.twilioClient.messages.create({
        body: `Your OTP is: ${otp}. It will expire in 5 minutes.`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phoneNumber,
      });
      return { success: true, data: null, error: null };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: new ServiceError("Failed to send OTP via SMS"),
      };
    }
  }

  async verifyRecipient(otpId, recipient) {
    try {
      const otpRecord = await OTP.findById(otpId);
      if (!otpRecord) {
        return {
          success: false,
          data: null,
          error: new ServiceError("OTP not found"),
        };
      }

      if (otpRecord.recipient !== recipient) {
        return {
          success: false,
          data: null,
          error: new ServiceError("Recipient mismatch"),
        };
      }

      return { success: true, data: otpRecord, error: null };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: new ServiceError("Failed to verify recipient"),
      };
    }
  }

  async verifyOTP(otpId, userOTP) {
    try {
      const otpRecord = await OTP.findById(otpId);
      if (!otpRecord) {
        return {
          success: false,
          data: null,
          error: new ServiceError("OTP not found"),
        };
      }

      if (otpRecord.verified) {
        return {
          success: false,
          data: null,
          error: new ServiceError("OTP already used"),
        };
      }

      if (otpRecord.expirationTime < new Date()) {
        return {
          success: false,
          data: null,
          error: new ServiceError("OTP expired"),
        };
      }

      if (otpRecord.otp !== userOTP) {
        return {
          success: false,
          data: null,
          error: new ServiceError("Invalid OTP"),
        };
      }

      otpRecord.verified = true;
      await otpRecord.save();
      return { success: true, data: true, error: null };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: new ServiceError("Failed to verify OTP"),
      };
    }
  }

  generateVerificationKey(otpId, recipient) {
    const data = JSON.stringify({ otpId, recipient });
    return encrypt(data);
  }

  decodeVerificationKey(verificationKey) {
    const decrypted = decrypt(verificationKey);
    return JSON.parse(decrypted);
  }
}

module.exports = new OTPService();
