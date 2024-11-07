const mongoose = require("mongoose");

const OTPschema = new mongoose.Schema({
    email: {
        type: String,
        required: true
    },
    otp: {
        type: String,
        required: true
    },
    createAt: {
        type: Date,
        default: Date.now(),
        expires: 5 * 60 // OTP expires in 5 minutes
    }
});

module.exports = mongoose.model("OTP", OTPschema);
