const express = require("express");
const router = express.Router();
const upload = require("../utils/multer");

const {
  registerUser,
  loginUser,
  logout,
  getUser,
  addUserAddress,
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  setStripeKeys,
  getPublishableKey,
  getVendorStall,
  addVendorStall,
  getAllStalls
} = require("../controllers/authController");


router.post("/register", upload.single("avatar"), registerUser);
router.post("/create-user", upload.single("avatar"), createUser);
router.put("/user-update", upload.single("avatar"), updateUser);
router.put("/set-stripe-keys", setStripeKeys);
router.delete("/delete-user/:id", deleteUser);
router.post("/login", loginUser);
router.get("/logout", logout);
router.get("/get-publishable-key/:id", getPublishableKey);
router.get("/get-user/:id", getUser);
router.put("/add-address", addUserAddress);
router.get("/get-all-users", getAllUsers);
router.get("/get-all-stalls", getAllStalls);
router.get("/vendor/:id", getVendorStall);
router.put("/vendor/add-stall/:id", upload.single("avatar"), addVendorStall);

module.exports = router;