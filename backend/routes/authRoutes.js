const express = require("express");
const router = express.Router();
const {protect} = require("../middleware/authMiddleware");
const {loginUser, getUserDetails, list, sendNotification, comment, rating, forgotPassword, resetPassword} = require("../controllers/authControllers");

router.route("/auth").post(loginUser);
router.route("/user").get(protect,getUserDetails);
router.route("/forgot-password").post(forgotPassword);
router.route("/reset-password/:token").post(resetPassword);

router.route("/list").get(list);
router.route("/bookings").post(sendNotification);
router.route("/submit-comment").post(comment);
router.route("/submit-rating").post(rating);

module.exports = router;