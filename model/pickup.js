const mongoose = require("mongoose");

const PickupSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    sacks: [{
        sackId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Sack",
            required: true
        },
        seller: {
            type: mongoose.Schema.ObjectId,
            ref: "User",
            required: true,
        },
        stallNumber: {
            type: String,
            required: [true, "Please enter stall number"],
        },
        kilo: {
            type: String,
            required: [true, "Please enter sack kilo"],
        },
        dbSpoil: {
            type: Date,
            required: [true, "Please enter sack spoilage"],
        },
        description: {
            type: String,
            required: [true, "Please enter sack description"],
        },
        location: {
            type: String,
            required: [true, "Please enter sack location"],
        },
        images: [
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
        status: {
            type: String,
            enum: ['claimed', 'cancelled'],
        },
    }],
    status: {
        type: String,
        enum: ["pending", "pickup", "completed", "canceled"],
        default: "pending"
    },
    totalKilo: {
        type: String,
    },
    pickupTimestamp: {
        type: Date,
    },
    createdAt: {
        type: Date,
        default: () => {
            const now = new Date();
            return new Date(now.getTime() + 8 * 60 * 60 * 1000);
        }
    },
    pickedUpDate: {
        type: Date,
    }
});

module.exports = mongoose.model("Pickup", PickupSchema);