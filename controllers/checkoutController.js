const Checkout = require("../model/checkout");
const Product = require("../model/product");
const User = require("../model/user");
const stripe = require('stripe')(process.env.STRIPE_SECRET);

const checkoutController = {
    createPaymentIntent: async (req, res) => {
        try {
            const { amount, currency, userId } = req.body;

            // Create the payment intent and associate it with the customer
            try {
                const user = await User.findById(userId);

                if (!user) {
                    return res.status(404).json({ message: 'User not found' });
                }

                const customerId = user.stripeCustomerId;
                // console.log(customerId)

                if (!customerId) {
                    return res.status(400).json({ message: 'No Stripe customer ID found for this user' });
                }
                const paymentIntent = await stripe.paymentIntents.create({
                    amount: amount,
                    currency: 'php',
                    customer: customerId,
                });
                res.send({ clientSecret: paymentIntent.client_secret });
            } catch (error) {
                console.error('Error creating payment intent:', error);
                res.status(500).json({ message: 'Error creating payment intent', error: error.message });
            }
        } catch (error) {
            console.error('Error creating payment intent:', error);
            res.status(500).json({ message: 'Error creating payment intent' });
        }
    },
    checkoutOrder: async (req, res) => {
        try {
            const {
                userId,
                sellerId,
                products, // This contains { productId, sackCount }
                deliveryAddress,
                paymentMethod,
                totalPrice,
                paymentTerm
            } = req.body;

            // console.log('address', deliveryAddress)

            if (!userId || !sellerId || !products || !deliveryAddress || !paymentMethod || !totalPrice) {
                return res.status(400).json({ message: "All fields are required." });
            }

            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ message: "User not found." });
            }

            const seller = await User.findById(sellerId);
            if (!seller) {
                return res.status(404).json({ message: "Seller not found." });
            }

            for (let productItem of products) {
                const { productId, sackCount } = productItem;

                const product = await Product.findById(productId);
                if (!product) {
                    return res.status(404).json({ message: `Product with ID ${productId} not found. `});
                }

                if (product.sack < sackCount) {
                    return res.status(400).json({
                        message: `Not enough stock for ${product.name}. Only ${product.sack} sacks available.`,
                    });
                }
                product.sack -= sackCount;
                // console.log(product)
                await product.save();
            }

            const newCheckout = new Checkout({
                userId,
                sellerId,
                products,
                deliveryAddress,
                paymentMethod,
                totalPrice,
                paymentTerm,
            });

            const savedCheckout = await newCheckout.save();

            res.status(201).json({ message: "Checkout successful", checkout: savedCheckout });
        } catch (error) {
            console.error("Checkout error:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },
    getMyOrder: async (req, res) => {
        try {
            const { id } = req.params;

            const userOrders = await Checkout.find({ userId: id }).sort({ createdAt: -1 });

            if (!userOrders || userOrders.length === 0) {
                return res.status(404).json({ message: "No orders found for this user." });
            }

            res.status(200).json({ orders: userOrders });
        } catch (error) {
            console.error("Error fetching orders:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },
    getSellerOrder: async (req, res) => {
        try {
            const { id } = req.params;

            const sellerOrders = await Checkout.find({ sellerId: id }).sort({ createdAt: -1 });

            if (!sellerOrders || sellerOrders.length === 0) {
                return res.status(404).json({ message: "No orders found for this user." });
            }

            res.status(200).json({ orders: sellerOrders });
        } catch (error) {
            console.error("Error fetching orders:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },
    checkoutPaymentIntent: async (req, res) => {
        try {
            const { amount, currency } = req.body;

            if (!amount || !currency) {
                return res.status(400).json({ message: "Amount and currency are required." });
            }

            // Create a payment intent with Stripe
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount * 100,
                currency: currency,
            });

            // Send the client secret to the frontend
            res.status(200).json({ clientSecret: paymentIntent.client_secret });

        } catch (error) {
            console.error('Error creating payment intent:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    },
    updateOrderStatus: async (req, res) => {
        try {
            const { orderId, status } = req.body;
            // console.log(req.body);

            const order = await Checkout.findById(orderId);

            if (!order) {
                return res.status(404).json({ message: "No orders found for this user." });
            }

            if (status === 'Pending') {
                order.status = 'Confirmed';
                await order.save();
            } else if (status === 'Confirmed') {
                order.status = 'In Storage';
                await order.save();
            } else if (status === 'In Storage') {
                order.status = 'Out for Delivery';
                await order.save();
            } else if (status === 'Out for Delivery') {
                order.status = 'Delivered';
                order.paymentTerm = 'Fully Paid';
                await order.save();
            }
            else {
                console.log('Order status is not Pending, no update performed.');
            }

            res.status(200).json({ order });
        } catch (error) {
            console.error("Error updating order status:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },
    getAllOrder: async (req, res) => {
        try {
            const orders = await Checkout.find().sort({ createdAt: -1 });

            if (!orders) {
                return res.status(404).json({ message: "No orders found." });
            }

            res.status(200).json({ orders });
        } catch (error) {
            console.error("Error fetching orders:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },
};

module.exports = checkoutController;