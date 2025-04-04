const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const bycrypt = require("bcryptjs");
const {protect} = require("../middleware/authMiddleware");
//const twilio = require("twilio");
const Customer = require("../models/customerModel");
const Professional = require("../models/professionalModel");
const Admin = require("../models/adminModel");
const History = require("../models/historyModel");
const dotenv = require("dotenv").config();
const {sendEmail,sendSMS} = require("./emailControllers");

/* const TWILIO_SID = process.env.TWILIO_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER; */

const generateToken = (id, userType) => {
    console.log("Generating Token for:", { id, userType });

    return jwt.sign(
        { id, userType },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "30d" }
    );
};


//@desc Send the email nd password to server for authorization
//@route POST /login
//@access protected

const loginUser = asyncHandler( async(req, res) => {
    const {email, password} = req.body; // storing email and password in the variables
    if (!email || !password) {
        return res.status(400).json({message: "All fields are required"}); // if email or password is not provided then return a message in json format and status is set to 400
    }
    try {
        let user = await Customer.findOne({email});
        let userType = "Customer";
        if (!user) {
            user = await Professional.findOne({email});
            userType = "Professional";

        }
        if (!user) {
            user = await Admin.findOne({email});
            userType = "Admin";
        }
        if (!user) {
            return res.status(400).json({message: "Invalid email"}); // if user is not found in the database then return a message in json format and status is set to 400
        }

        const isMatch = await bycrypt.compare(password,user.password); // comparing the password entered by the user with the password stored in the database
        if (!isMatch){
            return res.status(400).json({message: "Invalid password"}); // if password is incorrect then return a message in json format and status is set to 400
        }

        const token = generateToken(user._id, userType); // generating token for the user

        res.status(200).json({
            message: `Login Successful, Welcome ${userType}`,
            token,
            userType,
            userId: user._id
        });

    }
    catch (error) {
        return res.status(500).json({message: error.message}); // if there is an error then return a message in json format and status is set to 500
    }
});


const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ message: "Email is required" });
    }
    try {
        let user = await Customer.findOne({email});
        let userType = "Customer";
        if (!user) {
            user = await Professional.findOne({email});
            userType = "Professional";

        }
        if (!user) {
            user = await Admin.findOne({email});
            userType = "Admin";
        }
        if (!user) {
            return res.status(400).json({message: "Invalid email"}); // if user is not found in the database then return a message in json format and status is set to 400
        }
        const resetToken = generateToken(user._id, userType); // generating token for the user
        console.log("Reset Token:", resetToken); // Debugging
        const resetLink = `http://localhost:5173/reset-password/${resetToken}`;
        console.log("Reset Link:", resetLink); // Debugging
        await sendEmail(
            email,
            "Password Reset Request",
            `Click the link to reset your password: ${resetLink}.\n This link will expire in 1 hr`
        ); // Send the reset link to the user's email

        console.log("Reset link sent to email:", email); // Debugging
        res.status(200).json({ message: "Reset link sent to your email" });
    } catch (error) {
        console.error("Error in forgotPassword:", error); // Debugging
        res.status(500).json({ message: "Server error" });
    }
});

const resetPassword = asyncHandler(async (req, res) => {
    const { token } = req.params;
    const { newPassword } = req.body;

    console.log("Reset Password Token:", token); // Debugging
    try{
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("Decoded Token:", decoded); // Debugging

        const { id, userType } = decoded;
        let user;
        if (userType === "Admin") {
            user = await Admin.findById(id);
          } else if (userType === "Customer") {
            user = await Customer.findById(id);
          } else if (userType === "Professional") {
            user = await Professional.findById(id);
          } else {
            return res.status(400).json({ message: "Invalid user type" });
          }

        const hashedPassword = await bycrypt.hash(newPassword, 10); // Hash the new password
        user.password = hashedPassword; // Update the password in the database
        await user.save(); // Save the updated user

        console.log("Password reset successfully for user:", userType); // Debugging
        res.status(200).json({ message: "Password reset successfully" });
    }catch(error) {
        console.error("Error in resetPassword:", error); // Debugging
        if (error.name === "TokenExpiredError") {
            return res.status(400).json({ message: "Token expired" });
        }
        res.status(500).json({ message: "Server error" });
    }
});

const getUserDetails = async (req, res) => {
    try {
    console.log("Request User:", req.user); // Debugging

        if (!req.user || !req.user.id || !req.user.userType) {
            return res.status(401).json({ message: "User not authorized or token missing data" });
        }
      const { id, userType } = req.user; // Extract id and userType from token
  
      let user;
      if (userType === "Admin") {
        user = await Admin.findById(id).select("-password");
      } else if (userType === "Customer") {
        user = await Customer.findById(id).select("-password");
      } else if (userType === "Professional") {
        user = await Professional.findById(id).select("-password");
      } else {
        return res.status(400).json({ message: "Invalid user type" });
      }
  
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      res.json(user);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  };


const list = asyncHandler(async(req, res) => {
    const {id, service, location} = req.query;
    console.log("Received service:", service);
    console.log("Received location:", location);
    console.log("Type of service:", typeof service);
    console.log("Type of location:", typeof location);

    try {
        if (!id || !service || !location) {
            console.log("Missing parameters!");
            return res.status(400).json({ error: "Missing query parameters" });
            //return res.status(400).json({message: "Service and place are required"});
        }

        const professionals = await Professional.find({
            profession: service,  
            location: location,
            isAvailable: true
        }).select("-password");
        console.log(professionals);
        res.status(200).json(professionals || []);
    }
    catch (error) {
        //return res.status(500).json({message: error.message});
        console.error("Error in /list endpoint:", error);
        return res.status(500).json({ message: error.message, stack: error.stack });
    }
});


const sendNotification = asyncHandler(async(req, res) => {
    const {professionalId, professionalEmail, professionalName, professionalPhone, complaint, userId, service} = req.body;
    if (!professionalId || !professionalEmail || !professionalName || !professionalPhone || !complaint || !userId || !service) {
        return res.status(400).json({message: "All fields are required"});
    }
    console.log(professionalId, professionalEmail, professionalName, professionalPhone, complaint, userId);

    await Professional.findByIdAndUpdate(professionalId, { isAvailable: false });

    const user = await Customer.findById(userId);
    const userName = `${user.FirstName} ${user.LastName}`;

    const subject = 'Service Request Notification';
    //const client = twilio(TWILIO_SID, TWILIO_AUTH_TOKEN);

    const msg = `
        Hello,

        You have received a new service complaint request.

        Details are as follows:

        Customer Name: ${userName}
        Address       : ${user.address}
        Phone Number  : ${user.phoneNo}
        Email         : ${user.email}

        Complaint Description:
        ${complaint}

        Please review the above details and respond at your earliest convenience.

        Thank you,
        DomSev Team
        `;


    /* await client.messages.create({
        body: msg,
        from: TWILIO_PHONE_NUMBER,
        to: `+91${professionalPhone}`
    });
 */

    //message sent to service provider
    await sendSMS(professionalPhone, userName, msg);
    await sendEmail(professionalEmail, subject, msg);

    const msg2 = `
        Hello ${userName},

        Your complaint request for the service "${service}" has been successfully booked.

        Assigned Professional: ${professionalName}

        Our team will get back to you shortly with further updates.  
        Thank you for choosing our services.

        Best regards,  
        DomSev Team
        `;

    //message sent to service seeker
    await sendSMS(user.phoneNo, userName, msg2);
    await sendEmail(user.email,subject, msg2);

    setTimeout(async () => {
        try{
            Professional.findByIdAndUpdate(professionalId, { isAvailable: true })
            .then(() => console.log("Professional availability updated after timeout"))
            .catch((err) => console.error("Error updating availability:", err));

            const currentDate = new Date();
            const formattedDate = currentDate.toISOString().split("T")[0]; // Get YYYY-MM-DD format
            const formattedTime = currentDate.toLocaleTimeString(); // Get HH:MM AM/PM format

            await addHistory(service, professionalId, userId, formattedDate, formattedTime);

            const msg3 = `
                Hello ${userName},

                We hope your recent service request has been successfully resolved.

                We would greatly appreciate it if you could take a moment to share your experience by providing a review and rating.

                Your feedback helps us improve and continue delivering quality service.

                Thank you,  
                DomSev Team
                `;

            //message sent to service seeker
            await sendSMS(user.phoneNo, userName, msg3);
            await sendEmail(user.email, subject, msg3);

            console.log("SMS sent successfully:", message.sid);
            res.status(200).json({ message: "Notification sent successfully!" });
        }
        catch (err) {
            console.error("Error in post-service notification flow:", err);
        }
    }, 2 * 60 * 1000);  
});

const comment = asyncHandler(async (req, res) => {
    try {
        const { professionalId, userId, comment } = req.body;

        if (!professionalId || !userId || !comment) {
            return res.status(400).json({ message: "All fields are required." });
        }

        // Fetch user details to get the username
        const user = await Customer.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }
        const username = `${user.FirstName} ${user.LastName}`;

        // Find the professional
        const professional = await Professional.findById(professionalId);
        if (!professional) {
            return res.status(404).json({ message: "Service provider not found." });
        }

        // Add the comment with username
        professional.comments.push({ username, comment });
        await professional.save();

        res.json({ message: "Comment added successfully!", comments: professional.comments });
    } catch (error) {
        res.status(500).json({ message: "Error submitting comment", error: error.message });
    }
});


const rating = asyncHandler(async (req, res) => {
    try {
        const { professionalId, userId, rating } = req.body;

        if (!professionalId || !userId || !rating) {
            return res.status(400).json({ message: "All fields are required." });
        }

        // Fetch user details to get the username
        const user = await Customer.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }
        const username = `${user.FirstName} ${user.LastName}`;

        // Find the professional
        const professional = await Professional.findById(professionalId);
        if (!professional) {
            return res.status(404).json({ message: "Service provider not found." });
        }

        // Remove old rating from the same user if exists
        professional.ratings = professional.ratings.filter((r) => r.username !== username);

        // Add new rating
        professional.ratings.push({ username, rating });

        // Calculate new average rating
        const totalRatings = professional.ratings.length;
        const avgRating = professional.ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings;
        professional.rating = avgRating;

        await professional.save();

        res.json({ message: "Rating submitted successfully!", rating: professional.rating });
    } catch (error) {
        res.status(500).json({ message: "Error submitting rating", error: error.message });
    }
});


const addHistory = async (service, professionalId, customerId, date, time) => {
    try {
        const newHistory = new History({
            service,
            professional: professionalId,
            customer: customerId,
            date,
            time,
            day: new Date(date).toLocaleString("en-us", { weekday: "long" }) // Extract day name
        });
        await newHistory.save();
        console.log("History added successfully!");
    } catch (error) {
        console.error("Error adding history:", error);
    }
};



module.exports = {loginUser,getUserDetails, list, sendNotification, comment, rating, forgotPassword, resetPassword};