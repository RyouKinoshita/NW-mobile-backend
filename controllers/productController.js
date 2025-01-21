const { cloudinary, secretKey } = require('../config/cloudinaryConfig')
const Product = require("../model/product");
const productController = {
    getAllProduct: async (req, res) => {
        try {
            const products = await Product.find({ sack: { $gte: 1 } }).sort({ createdAt: -1 });
            res.status(201).json({ message: "Products fetched successfully", products });
        } catch (error) {
            console.error("Fetch All Product Error Backend:", error.message);
            res.status(500).json({ message: "Fetch Product Error Backend" });
        }
    },
    getOrderProduct: async (req, res) => {
        try {
            const { id } = req.params;

            const product = await Product.findById(id);
            res.status(201).json({ message: "Product fetched successfully", product });
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
    updateProduct: async (req, res) => {
        try {
            const { _id, name, price, category, description, quality, sack, location } = req.body
            let product = await Product.findById({ "_id": _id });

            const imageUrl = req.file.path;

            const result = await cloudinary.uploader.upload(imageUrl, {
                folder: 'avatars',
                width: 150,
                crop: "scale"
            });

            product.name = name;
            product.price = price;
            product.category = category;
            product.description = description;
            product.quality = quality;
            product.sack = sack;
            product.location = location;
            product.images = { public_id: result.public_id, url: result.secure_url };

            // console.log(product)

            product = await Product.findByIdAndUpdate(_id, product, {
                new: true,
                runValidators: true,
                useFindAndModify: false
            });

            return res.status(200).json({
                success: true,
                product
            });
        } catch (error) {
            console.error(error.message);
            return res.status(500).json({
                success: false,
                message: 'Update Product Server Error'
            });
        }
    },
    deleteProduct: async (req, res) => {
        try {
            const { id } = req.params;
            const product = await Product.findById(id);

            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: 'Product not found',
                });
            }

            await Product.findByIdAndDelete(id);

            return res.status(200).json({
                success: true,
                message: 'Product successfully deleted',
            });
        } catch (error) {
            console.error(error.message);
            return res.status(500).json({
                success: false,
                message: 'Delete User Server Error',
            });
        }
    },
};
module.exports = productController;