const { cloudinary, secretKey } = require('../config/cloudinaryConfig')
const Item = require("../model/item");
const productController = {
    // getAllProduct: async (req, res) => {
    //     try {
    //         const products = await Product.find({ sack: { $gte: 1 } }).sort({ createdAt: -1 });
    //         res.status(201).json({ message: "Products fetched successfully", products });
    //     } catch (error) {
    //         console.error("Fetch All Product Error Backend:", error.message);
    //         res.status(500).json({ message: "Fetch Product Error Backend" });
    //     }
    // },
    // getOrderProduct: async (req, res) => {
    //     try {
    //         const { id } = req.params;

    //         const product = await Product.findById(id);
    //         res.status(201).json({ message: "Product fetched successfully", product });
    //     } catch (error) {
    //         console.error("Fetch All Product Error Backend:", error.message);
    //         res.status(500).json({ message: "Fetch Product Error Backend" });
    //     }
    // },
    // createProduct: async (req, res) => {
    //     try {
    //         const result = await cloudinary.v2.uploader.upload(
    //             req.file.path,
    //             {
    //                 folder: "avatars",
    //                 width: 200,
    //                 crop: "scale",
    //             },
    //             (err, res) => {
    //                 console.log(err, res);
    //             }
    //         );

    //         const { name, price, category, description, quality, sack, location, user } = req.body;
    //         const product = await Product.create({
    //             name,
    //             price,
    //             category,
    //             description,
    //             quality,
    //             sack,
    //             location,
    //             seller: user,
    //             images: {
    //                 public_id: result.public_id,
    //                 url: result.url,
    //             },
    //         });

    //         // console.log('this is backend product Create', product)

    //         res.status(200).send({
    //             success: true,
    //             message: "Create Post Successfully",
    //             product
    //         });
    //     } catch (error) {
    //         console.log(error);
    //         res.status(500).send({
    //             success: false,
    //             message: "Error In Post API",
    //             error,
    //         });
    //     }
    // },
    // updateProduct: async (req, res) => {
    //     try {
    //         const { _id, name, price, category, description, quality, sack, location } = req.body
    //         let product = await Product.findById({ "_id": _id });

    //         const imageUrl = req.file.path;

    //         const result = await cloudinary.uploader.upload(imageUrl, {
    //             folder: 'avatars',
    //             width: 150,
    //             crop: "scale"
    //         });

    //         product.name = name;
    //         product.price = price;
    //         product.category = category;
    //         product.description = description;
    //         product.quality = quality;
    //         product.sack = sack;
    //         product.location = location;
    //         product.images = { public_id: result.public_id, url: result.secure_url };

    //         // console.log(product)

    //         product = await Product.findByIdAndUpdate(_id, product, {
    //             new: true,
    //             runValidators: true,
    //             useFindAndModify: false
    //         });

    //         return res.status(200).json({
    //             success: true,
    //             product
    //         });
    //     } catch (error) {
    //         console.error(error.message);
    //         return res.status(500).json({
    //             success: false,
    //             message: 'Update Product Server Error'
    //         });
    //     }
    // },
    // deleteProduct: async (req, res) => {
    //     try {
    //         const { id } = req.params;
    //         const product = await Product.findById(id);

    //         if (!product) {
    //             return res.status(404).json({
    //                 success: false,
    //                 message: 'Product not found',
    //             });
    //         }

    //         await Product.findByIdAndDelete(id);

    //         return res.status(200).json({
    //             success: true,
    //             message: 'Product successfully deleted',
    //         });
    //     } catch (error) {
    //         console.error(error.message);
    //         return res.status(500).json({
    //             success: false,
    //             message: 'Delete User Server Error',
    //         });
    //     }
    // },
    itemCreate: async (req, res) => {
        try {
            const { name, category, day } = req.body;

            // Validate required fields
            if (!name || !category) {
                return res.status(400).json({ message: "Name and category are required." });
            }

            // Validate category
            const allowedCategories = ['vegetable', 'fruit', 'rootcrop'];
            if (!allowedCategories.includes(category.toLowerCase())) {
                return res.status(400).json({ message: "Invalid category." });
            }

            // Construct the item object
            const newItem = new Item({
                name,
                category: category.toLowerCase(),
                day: {
                    monday: [],
                    tuesday: [],
                    wednesday: [],
                    thursday: [],
                    friday: [],
                    saturday: [],
                    sunday: [],
                },
            });

            const savedItem = await newItem.save();
            return res.status(201).json({ message: 'Item created successfully', item: savedItem });

        } catch (error) {
            console.error("Error creating item:", error);
            return res.status(500).json({ message: "Server error" });
        }
    },
    getItems: async (req, res) => {
        try {
            const items = await Item.find();

            res.status(200).json({
                message: "Items fetched successfully",
                items,
            });
        } catch (error) {
            console.error("Fetch All Items Error Backend:", error.message);
            res.status(500).json({ message: "Fetch Items Error Backend" });
        }
    },
    updateItem: async (req, res) => {
        try {
            const { id } = req.params;
            const { name, category, price } = req.body;

            const getPHDate = () => {
                const now = new Date();
                const phOffset = 8 * 60;
                const utc = now.getTime() + now.getTimezoneOffset() * 60000;
                return new Date(utc + phOffset * 60000);
            };

            const today = getPHDate().toLocaleString('en-US', { weekday: 'long', timeZone: 'Asia/Manila' }).toLowerCase();

            const item = await Item.findById(id);
            if (!item) return res.status(404).json({ message: "Item not found" });

            if (name) item.name = name;
            if (category) item.category = category;

            if (price) {
                const todayPrice = {
                    price,
                    date: getPHDate(),
                };

                item.day[today] = item.day[today] || [];
                item.day[today].push(todayPrice);
            }

            await item.save();
            res.status(200).json({ message: "Item updated successfully", item });
        } catch (error) {
            console.error("Update Item Error:", error.message);
            res.status(500).json({ message: "Update Item Error" });
        }
    },
    deleteItem: async (req, res, next) => {
        try {
            const { id } = req.params;

            console.log(id, 'Id')

            const updatedItem = await Item.findByIdAndUpdate(
                id,
                { isDeleted: true },
                { new: true }
            );

            if (!updatedItem) {
                return res.status(404).json({ message: "Item not found." });
            }

            res.status(200).json({ message: "Item soft deleted.", item: updatedItem });
        } catch (error) {
            next(error);
        }
    },
    restoreItem: async (req, res, next) => {
        try {
            const { id } = req.params;

            const restoredItem = await Item.findByIdAndUpdate(
                id,
                { isDeleted: false },
                { new: true }
            );

            if (!restoredItem) {
                return res.status(404).json({ message: "Item not found." });
            }

            res.status(200).json({ message: "Item restored.", item: restoredItem });
        } catch (error) {
            next(error);
        }
    },
};
module.exports = productController;