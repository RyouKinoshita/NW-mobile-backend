const express = require("express");
const { getNotifications, getUserNotifications } = require("../controllers/notificationController");
const router = express.Router();

router.get("/get-notif/:userId", getNotifications);
router.get("/users-get-notif/:userId", getUserNotifications);

module.exports = router;