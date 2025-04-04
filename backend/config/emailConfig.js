const nodemailer = require('nodemailer');
require('dotenv').config(); // If using environment variables

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER , // Use environment variables
        pass: process.env.EMAIL_PASS
    }
});

module.exports = transporter;
