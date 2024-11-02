const express = require("express");
const upload = require("../utils/multer");
const {
  getAllProduct,
  createProduct,
} = require("../controllers/productController");

//
const router = express.Router();
//GET ALL Product
router.get("/get-all-products", getAllProduct);
router.post("/create-product", upload.single("image"), createProduct);

//export
module.exports = router;