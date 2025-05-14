const express = require("express");
const { inputTrack, getRecords } = require("../controllers/trackerController");
const router = express.Router();
const upload = require("../utils/multer");

router.post("/input-track", upload.single("image"), inputTrack);
router.get("/get-records/:id", getRecords);


module.exports = router;
