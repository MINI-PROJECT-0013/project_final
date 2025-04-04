const express = require("express");
const router = express.Router();
const {registerC, profileC, users, deleteUser, editUser} = require("../controllers/customerControllers");

router.route("/register").post(registerC);
router.route("/profile/:id").get(profileC);
router.route("/profile/:id").delete(deleteUser);
router.route("/profiles").get(users);
router.route("/profile/:id").put(editUser);

module.exports = router;