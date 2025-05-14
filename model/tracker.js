const mongoose = require("mongoose");

const trackerSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        required: true,
    },
    pigName: {
        type: String,
        required: true,
    },
    notice: {
        type: String,
        required: true,
    },
    track: [
        {
            weight: {
                type: Number,
                required: true,
            },
            feed: {
                type: String,
                enum: ["commercial", "organic", "mixed"],
                required: true,
            },
            image: [
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
        },
    ],
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model("Tracker", trackerSchema);