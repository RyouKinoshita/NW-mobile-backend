const Notification = require("../model/notification");

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
