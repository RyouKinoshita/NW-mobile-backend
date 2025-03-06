const express = require("express");
const upload = require("../utils/multer");
const {
  createSack,
  addToSack,
  getStoreSacks,
  getMySacks,
  getPickUpSacks,
  pickupSacks,
  deleteAddedSack,
} = require("../controllers/sackController");

//
const router = express.Router();
router.get("/get-store-sacks/:id", getStoreSacks);
router.get("/get-my-sacks/:id", getMySacks);
router.get("/get-pickup-sacks/:id", getPickUpSacks);
router.post("/create-sack", upload.single("image"), createSack);
router.post("/add-to-sack/:id", addToSack);
router.post("/pick-up-sacks/:id", pickupSacks);
router.delete("/delete-pickuped-sack/:id", deleteAddedSack);
module.exports = router;