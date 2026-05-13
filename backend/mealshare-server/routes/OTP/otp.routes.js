const express = require("express");
const router = express.Router();
const otpController = require("./otp.controller");


router.post("/send", otpController.sendOTP);
router.post("/verify", otpController.verifyOTP);

module.exports = router;
