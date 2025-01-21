const express = require("express");
const upload = require("../utils/multer");
const {
  getAllProduct,
  createProduct,
  getOrderProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");

//
const router = express.Router();
//GET ALL Product
router.get("/get-all-products", getAllProduct);
router.get("/get-order-product/:id", getOrderProduct);
router.post("/create-product", upload.single("image"), createProduct);
router.put("/product-update", upload.single("image"), updateProduct);
router.delete("/delete-product/:id", deleteProduct);

//export
module.exports = router;