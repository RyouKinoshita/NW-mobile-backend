const express = require("express");
const { getNotifications, getUserNotifications, getNotif,
    getRequestNotif
} = require("../controllers/notificationController");
const router = express.Router();

router.get("/get-notif/:userId", getNotifications);
router.get("/users-get-notif/:userId", getUserNotifications);
router.get("/get-notif", getNotif);
router.get("/get-pickup-request/:id", getRequestNotif);

module.exports = router;
