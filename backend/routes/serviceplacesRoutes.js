const express = require("express");
const { getAllServicesAndPlaces, addServiceOrPlace, deleteServiceOrPlace} = require("../controllers/serviceplacesControllers");
const {protect} = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", getAllServicesAndPlaces);
router.post("/add",addServiceOrPlace);
router.delete("/delete", deleteServiceOrPlace);

/* router.get("/service-history", getHistory); */

module.exports = router;
