const mongoose = require("mongoose");

const sackSchema = new mongoose.Schema({
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
        enum: ['posted', 'pickup', 'claimed', 'spoiled'],
        default: 'posted',
    },
    isDeleted: {
        type: Boolean,
        default: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model("Sack", sackSchema);