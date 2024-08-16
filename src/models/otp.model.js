const { mongoose } = require("../utils/imports.util");

const otpSchema = new mongoose.Schema(
  {
    otp: {
      type: String,
      required: true,
    },
    recipient: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["email", "sms"],
      required: true,
    },
    expirationTime: {
      type: Date,
      required: true,
    },
    verified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("OTP", otpSchema);
