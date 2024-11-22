
const Checkout = require("../model/checkout");
const Product = require("../model/product");
const User = require("../model/user");

const checkoutController = {
    checkoutOrder: async (req, res) => {
        try {
            const {
                userId,
                sellerId,
                products, // This contains { productId, sackCount }
                deliveryAddress,
                paymentMethod,
                totalPrice,
            } = req.body;

            console.log('address', deliveryAddress)

            // Validate the data (you can extend this to add more validations)
            if (!userId || !sellerId || !products || !deliveryAddress || !paymentMethod || !totalPrice) {
                return res.status(400).json({ message: "All fields are required." });
            }

            // Check if the user exists
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ message: "User not found." });
            }

            // Check if the seller exists
            const seller = await User.findById(sellerId);
            if (!seller) {
                return res.status(404).json({ message: "Seller not found." });
            }

            // Validate the stock for each product in the order
            for (let productItem of products) {
                const { productId, sackCount } = productItem;

                // Find the product in the database
                const product = await Product.findById(productId);
                if (!product) {
                    return res.status(404).json({ message: `Product with ID ${productId} not found.` });
                }

                // Check if there’s enough stock for the product
                if (product.sack < sackCount) {
                    return res.status(400).json({
                        message: `Not enough stock for ${product.name}. Only ${product.sack} sacks available.`,
                    });
                }

                // Subtract the ordered sackCount from the product's stock (sack field)
                product.sack -= sackCount;

                // Save the updated product back to the database
                await product.save();
            }

            // Create a new Checkout document
            const newCheckout = new Checkout({
                userId,
                sellerId,
                products,
                deliveryAddress,
                paymentMethod,
                totalPrice,
            });

            // Save the checkout order to the database
            const savedCheckout = await newCheckout.save();

            // Return a response
            res.status(201).json({ message: "Checkout successful", checkout: savedCheckout });
        } catch (error) {
            console.error("Checkout error:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },
    getMyOrder: async (req, res) => {
        try {
            const { id } = req.params;

            const userOrders = await Checkout.find({ userId: id });

            if (!userOrders || userOrders.length === 0) {
                return res.status(404).json({ message: "No orders found for this user." });
            }

            res.status(200).json({ orders: userOrders });
        } catch (error) {
            console.error("Error fetching orders:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },
};

module.exports = checkoutController;

