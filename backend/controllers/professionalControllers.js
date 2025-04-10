const Professional = require('../models/professionalModel');
const bcrypt = require('bcryptjs');
const asyncHandler = require('express-async-handler');
const {cloudinary} = require("../config/cloudinaryConfig");

const registerP = asyncHandler(async(req, res) => {
    try{
        console.log("Request received:", req.body);
        console.log("Files received:", req.file);
        const {firstName, lastName, email, password, phoneNo, location, profession} = req.body;
        if (!firstName || !lastName || !email || !password || !phoneNo || !location || !profession) {
            return res.status(400).json({message: "All fields are required"});
        }
        
        const existingProfessional = await Professional.findOne({email});
        if (existingProfessional){
            return res.status(400).json({message: "Professional already exists"});
        }

        /* let documentUrl = null;

        if (req.file){
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: "professional_docs"
            });
            documentUrl = result.secure_url;
        } */

        documentUrl = req.file.path;
        console.log("Uploaded document URL:", documentUrl);

        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(password, salt);

        const newProfessional = await Professional.create({
            firstName,
            lastName,
            email,
            password: hashPassword,
            phoneNo,
            location,
            profession,
            document: documentUrl
        });

        await newProfessional.save();
        res.status(201).json({message: "User created successfully"});
    }
    catch(error){
        return res.status(500).json({message: error.message});
    }
});

const services = asyncHandler(async(req, res) => {
    const serviceName = req.query.serviceName;
    console.log(await Professional.find());
    try{
        if (!serviceName){
            return res.status(400).json({message: "Service name is required"});
        }
        
        const professionals = await Professional.find({profession: serviceName});
        res.status(200).json({professionals});
    }
    catch(error){
        return res.status(500).json({message: error.message});
    }
});

 const profile = asyncHandler(async(req, res) => {
    const id = req.params.id;
    try{
        const professional = await Professional.findById(id).select("-password");
        if (!professional){
            return res.status(404).json({message: "Professional not found"});
        }
        console.log("Comments:  ",profile.comments);
        res.status(200).json(professional);
    }
    catch(error){
        return res.status(500).json({message: error.message});
    }
});


const users = asyncHandler(async(req, res) => {
    try {
        const professionals = await Professional.find();
        res.json(professionals);
    } catch (err) {
        res.status(500).json({ error: "Server Error" });
    }
});

const userDelete = asyncHandler(async(req, res) => {
    try {
        const { id } = req.params; // Extract ID from request params

        const professional = await Professional.findByIdAndDelete(id);
        if (!professional) {
            return res.status(404).json({ message: "Service Provider not found" });
        }

        res.status(200).json({ message: "Deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error in deleting", error });
    }
});

const ratings = asyncHandler(async(req, res) => {
    try{
        const rates = await Professional.find().select("rating");
        res.status(200).json(rates);
    }
    catch(error){
        res.status(500).json({ message: "Error in fetching rates", error });
    }
});

const editUser = asyncHandler(async(req, res) => {
    const id = req.params.id;
    const updatedData = req.body;

    // If there's a file uploaded
    if (req.file) {
        // If using memoryStorage, you'll need to upload to Cloudinary or some storage
        // For now, we'll just simulate storing the file name
        updatedData.profilePhoto = req.file.path; // Use the uploaded file's path
    }

    try{
        // Find and update the customer
        const updatedProfessional = await Professional.findByIdAndUpdate(
            id,
            { $set: updatedData },
            { new: true } // Returns the updated document
        );

        if (!updatedProfessional) {
            return res.status(404).json({ message: 'Professional not found' });
        }

        res.status(200).json(updatedProfessional);
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = {registerP, services, profile, users, userDelete, ratings, editUser};
