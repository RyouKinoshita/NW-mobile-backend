const express = require("express");
const axios = require("axios");
const baseURL = require("../utils/baseURL");
const router = express.Router();

router.get("/predict-waste", async (req, res) => {
    try {
        const response = await axios.get(`${baseURL}/api/v1/ml/predict-waste`);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ message: "Error fetching predictions", error });
    }
});
router.get("/optimal-collection-schedule", async (req, res) => {
    try {
        const response = await axios.get(`${baseURL}/api/v1/ml/optimal-collection-schedule`);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ message: "Error fetching predictions", error });
    }
});
router.get("/waste-collected-progress", async (req, res) => {
    try {
        const response = await axios.get(`${baseURL}/api/v1/ml/waste-collected-progress`);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ message: "Error fetching predictions", error });
    }
});

router.get("/waste-generation-trend", async (req, res) => {
    try {
        const response = await axios.get(`${baseURL}/api/v1/ml/waste-generation-trend`);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ message: "Error fetching predictions", error });
    }
});

module.exports = router;