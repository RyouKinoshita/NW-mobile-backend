const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        required: true,
    },
    pickupId: {
        type: mongoose.Schema.ObjectId,
        ref: "Pickup",
    },
    message: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        enum: ["new_sack", "pickup", "trashed", 'spoiled', 'claimed', 'pickup_completed'],
        required: true,
    },
    stall: {
        stallDescription: {
            type: String,
        },
        stallAddress: {
            type: String,
        },
        stallNumber: {
            type: String,
        },
        openHours: {
            type: String,
            match: /^((0?[1-9])|(1[0-2])):[0-5][0-9]\s?(am|pm)$/i,
        },
        closeHours: {
            type: String,
            match: /^((0?[1-9])|(1[0-2])):[0-5][0-9]\s?(am|pm)$/i,
        },
        stallImage: {
            public_id: {
                type: String,
            },
            url: {
                type: String,
            },
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        status: {
            type: String,
            enum: ["open", 'close'],
            default: "open",
        }
    },
    SackImage: [
        {
            public_id: {
                type: String,
                required: true,
            },
            url: {
                type: String,
                required: true,
            },
        },
    ],
    isRead: {
        type: Boolean,
        default: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model("notification", notificationSchema); 