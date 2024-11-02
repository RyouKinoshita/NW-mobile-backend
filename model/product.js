const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please enter product name"],
        trim: true,
        maxLength: [100, "Product name cannot exceed 100 characters"],
    },
    price: {
        type: Number,
        required: [true, "Please enter product price"],
        maxLength: [5, "Product name cannot exceed 5 characters"],
        default: 0.0,
    },
    description: {
        type: String,
        required: [true, "Please enter product description"],
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
    category: {
        type: String,
        required: [true, "Please select category for this product"],
        enum: {
            values: [
                "Mixed Vegetables",
                "Mixed Fruits",
                "Vegetable",
                "Grains",
                "Fruits",
                "Nuts",
                "Root Crops",
            ],
            message: "Please select correct category for product",
        },
    },
    quality: {
        type: String,
        required: [true, "Please select the quality of this product"],
        enum: {
            values: ["Bruised", "Underripe", "Spoiled", "Good", "Overripe", "Wilted"],
            message: "Please select correct quality for product",
        },
    },
    seller: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        required: true,
    },
    sack: {
        type: Number,
        required: [true, "Please enter product sack"],
        maxLength: [5, "Product name cannot exceed 5 characters"],
    },
    location: {
        type: String,
        required: [true, "Please enter product location"],
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

module.exports = mongoose.model("Product", productSchema);