const express = require("express");
const { /* getAllServicesAndPlaces, addServiceOrPlace, deleteServiceOrPlace,  */getHistory, pHistory, cHistory } = require("../controllers/adminController");
const {protect} = require("../middleware/authMiddleware");

const router = express.Router();

/* router.get("/service-place", protect,getAllServicesAndPlaces);
router.post("/add-service-place", addServiceOrPlace);
router.delete("/delete-service-place", deleteServiceOrPlace); */

router.get("/service-history", getHistory);
router.get("/service-history/:professionalId",pHistory);
router.get("/service-history-customer/:customerId",cHistory);

module.exports = router;
