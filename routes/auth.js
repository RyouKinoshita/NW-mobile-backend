const express = require("express");
const router = express.Router();
const upload = require("../utils/multer");

const {
  registerUser,
  loginUser,
  logout,
  getUser,
  addUserAddress,
} = require("../controllers/authController");


router.post("/register", upload.single("avatar"), registerUser);
router.post("/login", loginUser);
router.get("/logout", logout);
router.get("/get-user/:id", getUser);
router.put("/add-address", addUserAddress);

module.exports = router;
