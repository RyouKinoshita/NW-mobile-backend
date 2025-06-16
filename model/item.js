const mongoose = require("mongoose");

const priceEntrySchema = new mongoose.Schema({
    price: {
        type: Number,
    },
    date: {
        type: Date,
    },
}, { _id: false });

const daySchema = new mongoose.Schema({
    monday: [priceEntrySchema],
    tuesday: [priceEntrySchema],
    wednesday: [priceEntrySchema],
    thursday: [priceEntrySchema],
    friday: [priceEntrySchema],
    saturday: [priceEntrySchema],
    sunday: [priceEntrySchema],
}, { _id: false });

const itemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        enum: ['vegetable', 'fruit', 'rootcrop'],
        required: true,
    },
    day: daySchema,
    isDeleted: {
        type: Boolean,
        default: false,
    },
});

module.exports = mongoose.model("Item", itemSchema);