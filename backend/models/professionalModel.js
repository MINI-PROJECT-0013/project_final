const mongoose = require("mongoose");

const professionalSchema = mongoose.Schema({
    firstName: {
        type: String,
        required: [true, "First Name is required"],
    },
    lastName: {
        type: String,
        required: [true, "Last Name is required"],
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
    },
    password: {
        type: String,
        required: [true, "Password is required"],
    },
    phoneNo: {
        type: String,
        required: [true, "Phone Number is required"],
    },
    location: {
        type: String,
        required: [true, "Location is required"],
    },
    profession: {
        type: String,
        required: [true, "Profession is required"],
    },
    document: {
        type: String,
        required: [true, "Document is necessary for verification"],
    },
    profilePhoto: {
        type: String,
        required: false, // Not required initially, but can be added later
    },
    isAvailable: {
        type: Boolean,
        default: true,
    },
    rating: { type: Number, default: 0 }, 
    ratings: [
        {
            username: String,  // Store username only
            rating: Number,
            date: { type: Date, default: Date.now },  
        },
    ], 
    comments: [
        {
            username: String,  // Store username only
            comment: String,
            date: { type: Date, default: Date.now },  
        },
    ],
}, {
    timestamps: true,
});

module.exports = mongoose.model("Professional", professionalSchema,"professionals");
