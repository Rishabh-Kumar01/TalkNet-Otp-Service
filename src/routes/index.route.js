const { express } = require("../utils/imports.util");
const otpController = require("../controllers/otp.controller");
const OTPMiddleware = require("../middlewares/otp.middleware");

const router = express.Router();

router.post("/otp/send", OTPMiddleware.validateSendOTP, otpController.sendOTP);

router.post(
  "/otp/verify",
  OTPMiddleware.validateVerifyOTP,
  otpController.verifyOTP
);

module.exports = router;
