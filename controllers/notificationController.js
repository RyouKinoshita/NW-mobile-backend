const Notification = require("../model/notification");
const Pickup = require("../model/pickup")

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
        const { id } = req.params; // 'id' is the seller's ID, which you're passing from the frontend

        // Query for the Pickup document where any sack's seller matches the provided seller ID
        const pickup = await Pickup.findOne({
            "sacks.seller": id
        });

        if (!pickup) {
            return res.status(404).json({ message: "Seller's pickup record not found." });
        }

        // Filter sacks based on their status
        const pendingSacks = pickup.sacks.filter(sack => sack.status === 'pending');
        const pickupSacks = pickup.sacks.filter(sack => sack.status === 'pickup');

        res.status(200).json({
            pendingSacksCount: pendingSacks.length,
            pickupSacksCount: pickupSacks.length
        });
    } catch (error) {
        console.log("Error fetching sacks:", error);
        res.status(500).json({ message: "Error fetching sacks", error: error.message });
    }
};