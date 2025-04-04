//const ServicesAndPlaces = require("../models/servicePlaces");
const mongoose = require("mongoose");
const History = require("../models/historyModel");

// Fetch all services and places
/* const getAllServicesAndPlaces = async (req, res) => {
    try {
        if (req.user.userType !== "Customer" && req.user.userType !== "Professional" && req.user.userType !== "Admin") {
            return res.status(403).json({ message: "Forbidden: Only Admins can access this data" });
          }
        const data = await ServicesAndPlaces.find();
        if (!data) return res.status(404).json({ message: "No data found" });

        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: "Server Error", error });
    }
};
 */
// Add new service or place
/* const addServiceOrPlace = async (req, res) => {
    try {
        const { service, place } = req.body;

        let data = await ServicesAndPlaces.findOne();
        if (!data) {
            data = new ServicesAndPlaces({ services: [], places: [] });
        }

        if (service && !data.services.includes(service)) {
            data.services.push(service);
        }
        if (place && !data.places.includes(place)) {
            data.places.push(place);
        }

        await data.save();
        res.status(200).json({ message: "Added successfully", data });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error });
    }
};

const deleteServiceOrPlace = async (req, res) => {
    try {
        const { service, place } = req.body;

        let data = await ServicesAndPlaces.findOne();
        if (!data) return res.status(404).json({ message: "No data found" });

        if (service) {
            data.services = data.services.filter(s => s !== service);
        }
        if (place) {
            data.places = data.places.filter(p => p !== place);
        }

        await data.save();
        res.status(200).json({ message: "Deleted successfully", data });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error });
    }
};

 */
const getHistory = async(req, res) => {
    try {
        const historyRecords = await History.find()
            .populate("professional", "firstName lastName") // Fetch only the professional's name
            .populate("customer", "FirstName LastName") // Fetch only the customer's name
            .sort({ date: -1 }); // Sort by latest date

            console.log(historyRecords);
        res.status(200).json(historyRecords);
    } catch (error) {
        res.status(500).json({ message: "Error fetching history", error });
    }
};

const pHistory = async(req, res) => {
    try {
        console.log("Professional ID:", req.params.professionalId);
        const { professionalId } = req.params;

        if (!professionalId) {
            return res.status(400).json({ message: "Professional ID is required" });
        }

        const objectIdProfessionalId = mongoose.Types.ObjectId.isValid(professionalId)
            ? new mongoose.Types.ObjectId(professionalId)
            : null;

        if (!objectIdProfessionalId) {
            console.log("🛑 Invalid ObjectId format for professionalId");
            return res.status(400).json({ message: "Invalid Professional ID format" });
        }

        // Fetch bookings for this professional
        const bookings = await History.find({ professional: objectIdProfessionalId })
            .populate("customer", "_id firstName lastName email phoneNo location") // Populate customer details
            .sort({ date: -1 }); // Sort by recent bookings

        if (!bookings || bookings.length === 0) {
            return res.status(404).json({ message: "No bookings found for this professional." });
        }

        // Format response for clean frontend usage
        const formattedBookings = bookings.map((booking) => ({
            id: booking._id,
            service: booking.service,
            serviceDate: booking.date.toISOString().split("T")[0],
            serviceTime: booking.time,
            serviceDay: booking.day,
            customerId: booking.customer ? booking.customer._id : null,  // Ensure customer ID is present
            customerName: booking.customer ? `${booking.customer.firstName || "Unknown"} ${booking.customer.lastName || "Unknown"}` : "Unknown",
            customerContact: booking.customer?.phoneNo || "Not available",
            customerEmail: booking.customer?.email || "Not available",
            customerLocation: booking.customer?.location || "Not available",
        }));
        console.log(formattedBookings);
        res.status(200).json(formattedBookings);
    } catch (error) {
        console.error("Error fetching professional bookings:", error);
        res.status(500).json({ message: "Error fetching service history", error });
    }
};

const cHistory = async(req, res) =>{
    try {
        const { customerId } = req.params;

        // Check if customerId is provided
        if (!customerId) {
            return res.status(400).json({ message: "Customer ID is required" });
        }

        // Find service history for the given customer
        const historyRecords = await History.find({ customer: customerId })
            .populate("customer", "FirstName LastName phoneNo email") // Select specific customer fields
            .populate("professional", "firstName lastName phoneNo email profession location"); // Select professional details

        //console.log("History Records:", JSON.stringify(historyRecords, null, 2));
        
        // If no records found
        if (!historyRecords || historyRecords.length === 0) {
            return res.status(404).json({ message: "No service history found for this customer" });
        }

        // Format the response
        const formattedHistory = historyRecords.map((record) => ({
            service: record.service,
            date: record.date,
            time: record.time,
            day: record.day,
            professional: {
                name: `${record.professional.firstName} ${record.professional.lastName}`,
                contact: record.professional.phoneNo || "Not available",
                email: record.professional.email || "Not available",
                profession: record.professional.profession || "Not specified",
                location: record.professional.location || "Location not available",
            },
            customer: {
                name: `${record.customer.FirstName} ${record.customer.LastName}`,
                contact: record.customer.phoneNo || "Not available",
                email: record.customer.email || "Not available",
            },
        }));

        res.status(200).json(formattedHistory);
    } catch (error) {
        console.error("Error fetching service history:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

module.exports = { /* getAllServicesAndPlaces, addServiceOrPlace, deleteServiceOrPlace , */getHistory, pHistory, cHistory};
