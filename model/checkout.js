const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
    },
    sackCount: {
        type: Number,
        required: true,
        default: 0,
    },
    price: {
        type: Number,
        required: true,
    },
});

const addressSchema = new mongoose.Schema({
    lotNum: {
        type: String,
        required: true,
    },
    street: {
        type: String,
        required: true,
    },
    baranggay: {
        type: String,
        required: true,
    },
    city: {
        type: String,
        required: true,
    },
});

const checkoutSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    products: [productSchema],
    deliveryAddress: {
        type: addressSchema,
        required: true,
    },
    paymentMethod: {
        type: String,
        enum: ['Cash on Delivery', 'Online Payment'],
        required: true,
    },
    totalPrice: {
        type: Number,
        required: true,
    },
    orderDate: {
        type: Date,
        default: Date.now,
    },
    paymentTerm: {
        type: String,
        enum: ['Fully Paid', 'Not Paid'],
        default: 'Not Payed',
    },
    orderLocation: {

    },
    status: {
        type: String,
        enum: ['Pending', 'Confirmed', 'Out for Delivery', 'Delivered', 'Cancelled'],
        default: 'Pending',
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

// Create a Checkout model from the schema
const Checkout = mongoose.model('Checkout', checkoutSchema);

module.exports = Checkout;