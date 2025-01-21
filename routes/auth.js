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
} = require("../controllers/authController");


router.post("/register", upload.single("avatar"), registerUser);
router.post("/create-user", upload.single("avatar"), createUser);
router.put("/user-update", upload.single("avatar"), updateUser);
router.delete("/delete-user/:id", deleteUser);
router.post("/login", loginUser);
router.get("/logout", logout);
router.get("/get-user/:id", getUser);
router.put("/add-address", addUserAddress);
router.get("/get-all-users", getAllUsers);

module.exports = router;