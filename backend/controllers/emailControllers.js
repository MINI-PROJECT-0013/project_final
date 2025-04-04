const twilio = require("twilio");
const transporter = require("../config/emailConfig");

const TWILIO_SID = process.env.TWILIO_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

const sendEmail = async (to, subject, text) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to,
            subject,
            text
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: ' + info.response);
    } catch (error) {
        console.error('Error sending email:', error);
    }
};

const sendSMS = async(professionalPhone, userName,msg) => {
    try{
        const client = twilio(TWILIO_SID, TWILIO_AUTH_TOKEN);
            await client.messages.create({
                body: msg,
                from: TWILIO_PHONE_NUMBER,
                to: `+91${professionalPhone}`
            });
    }
    catch(error){
        console.error('Error sending message:', error);
    }
}

module.exports = {sendEmail, sendSMS};