const Notification = require("../model/notification");
const Pickup = require("../model/pickup");
const Sack = require("../model/sack");

exports.getNotifications = async (req, res) => {
    try {
        const { userId } = req.params;
        const notifications = await Notification.find({ user: userId }).sort({ createdAt: -1 });
        // console.log(notifications)
        res.status(200).json({ notifications });
    } catch (error) {
        console.error("Error fetching notifications:", error.message);
        res.status(500).json({ message: "Error fetching notifications" });
    }
};

exports.getUserNotifications = async (req, res) => {
    try {
        const { userId } = req.params;
        const notifications = await Notification.find({ user: userId }).sort({ createdAt: -1 });
        // console.log(notifications,'Log')
        res.status(200).json({
            success: true,
            notifications,
        });
    } catch (error) {
        console.log("Error fetching notifications:", error);
        res.status(500).json({ message: "Error fetching notifications" });
    }
};
exports.getNotif = async (req, res) => {
    try {
        const notifications = await Notification.find().sort({ createdAt: -1 });
        // console.log(notifications,'Log')
        res.status(200).json({
            success: true,
            notifications,
        });
    } catch (error) {
        console.log("Error fetching notifications:", error);
        res.status(500).json({ message: "Error fetching notifications" });
    }
};

exports.getRequestNotif = async (req, res) => {
    try {
        const { id } = req.params;

        // Get all sacks belonging to this seller
        const sacks = await Sack.find({ seller: id });

        if (!sacks || sacks.length === 0) {
            return res.status(404).json({ message: "No sacks found for this seller." });
        }

        // Count based on status
        const pickupSacks = sacks.filter(sack => sack.status === 'pickup');
        const postedSacks = sacks.filter(sack => sack.status === 'posted');
        const claimedSacks = sacks.filter(sack => sack.status === 'claimed');

        res.status(200).json({
            pickupSacksCount: pickupSacks.length,
            postedSacksCount: postedSacks.length,
            claimedSacksCount: claimedSacks.length
        });
    } catch (error) {
        console.error("Error fetching sacks:", error);
        res.status(500).json({ message: "Error fetching sacks", error: error.message });
    }
};