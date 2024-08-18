const { nodemailer, twilio, jwt } = require("../utils/imports.util");
const { OTP } = require("../models/index");
const { encrypt, decrypt } = require("../utils/crypto");
const { errorHandler, kafka } = require("../utils/index.util");
const { JWT_SECRET } = require("../config/serverConfig");

const { ServiceError } = errorHandler;

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
      const existingOTP = await OTP.findOne({ recipient });
      let newOTP;
      if (!existingOTP) {
        newOTP = new OTP({ otp, expirationTime, type, recipient });
        await newOTP.save();
      } else {
        existingOTP.otp = otp;
        existingOTP.expirationTime = expirationTime;
        await existingOTP.save();
      }
      return {
        success: true,
        data: { otp, otpId: existingOTP ? existingOTP._id : newOTP._id },
        error: null,
      };
    } catch (error) {
      console.error("Failed to create OTP:", error);
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
      console.log(error, "Service Error");
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

  async verifyRecipient(verificationKey) {
    try {
      const user = this.verfiyJwtToken(verificationKey);

      const otpRecord = await OTP.findOne({
        recipient: user.email,
        verified: false,
      });

      if (!otpRecord) {
        return {
          success: false,
          data: null,
          error: new ServiceError("OTP not found"),
        };
      }

      return { success: true, data: otpRecord, user: user, error: null };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: new ServiceError("Failed to verify recipient"),
      };
    }
  }

  async verifyOTP(otpId, user, userOTP) {
    try {
      const otpRecord = await OTP.findById(otpId, { verified: false });

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

      // Create a new profile for the user
      kafka.sendMessage("user-events", {
        type: "USER_CREATED",
        data: {
          userId: user.userId,
          email: user.email,
          username: user.username,
        },
      });
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
    console.log("Decrypted:", decrypted);
    return JSON.parse(decrypted);
  }

  verfiyJwtToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return null;
    }
  }
}

module.exports = new OTPService();
