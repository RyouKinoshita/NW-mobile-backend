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
  getPickupsBySeller,
  pickupSacksNow,
  sackStatusClaimed,
  getSacks,
  completePickUp,
  getAllSacks,
  rateTransaction
} = require("../controllers/sackController");

//
const router = express.Router();
router.get("/get-store-sacks/:id", getStoreSacks);
router.get("/get-sacks", getAllSacks);
router.get("/see-sacks", getSacks);
router.get("/get-my-sacks/:id", getMySacks);
router.get("/get-pickup-sacks/:id", getPickUpSacks);
router.get("/stall-pickup-sacks/:sellerId", getPickupsBySeller);
router.post("/create-sack", upload.single("image"), createSack);
router.post("/add-to-sack/:id", addToSack);
router.post("/pick-up-sacks/:id", pickupSacks);
router.put("/pickup-sack-now/:id", pickupSacksNow);
router.put("/complete-pickup/:id", completePickUp);
router.put("/update-status", sackStatusClaimed);
router.put("/rate-transaction/:id", rateTransaction);
router.delete("/delete-pickuped-sack/:id", deleteAddedSack);
module.exports = router;
