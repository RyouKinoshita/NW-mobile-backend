const { cloudinary, secretKey } = require('../config/cloudinaryConfig')
const Product = require("../model/product");
const productController = {
    getAllProduct: async (req, res) => {
        try {
            const products = await Product.find().sort({ createdAt: -1 });
            res.status(201).json({ message: "Products fetched successfully", products });
        } catch (error) {
            console.error("Fetch All Product Error Backend:", error.message);
            res.status(500).json({ message: "Fetch Product Error Backend" });
        }
    },
    createProduct: async (req, res) => {
        try {
            const result = await cloudinary.v2.uploader.upload(
                req.file.path,
                {
                    folder: "avatars",
                    width: 200,
                    crop: "scale",
                },
                (err, res) => {
                    console.log(err, res);
                }
            );

            const { name, price, category, description, quality, sack, location, user } = req.body;
            const product = await Product.create({
                name,
                price,
                category,
                description,
                quality,
                sack,
                location,
                seller: user,
                images: {
                    public_id: result.public_id,
                    url: result.url,
                },
            });

            // console.log('this is backend product Create', product)

            res.status(200).send({
                success: true,
                message: "Create Post Successfully",
                product
            });
        } catch (error) {
            console.log(error);
            res.status(500).send({
                success: false,
                message: "Error In Post API",
                error,
            });
        }
    },
};
module.exports = productController;