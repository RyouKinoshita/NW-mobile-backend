const express = require("express");
const router = express.Router();
const Sack = require("../model/sack");

router.get("/waste-data", async (req, res) => {
    try {
        const wasteData = await Sack.find(
            { status: { $ne: "claimed" } },
            { createdAt: 1, kilo: 1, dbSpoil: 1, stallNumber: 1, status: 1, _id: 0 }
        ).lean();
        
        res.json(wasteData);
    } catch (error) {
        res.status(500).json({ message: "Error fetching waste data", error });
    }
});

module.exports = router;
