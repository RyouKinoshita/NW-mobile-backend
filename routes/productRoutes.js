const express = require("express");
const upload = require("../utils/multer");
const {
  itemCreate,
  getItems,
  updateItem,
  restoreItem,
  deleteItem,
} = require("../controllers/productController");

//
const router = express.Router();
router.post("/item-create", itemCreate);
router.get("/get-items", getItems);
router.put('/item-update/:id', updateItem);
router.put('/restore/:id', restoreItem);
router.delete('/delete/:id', deleteItem);

//export
module.exports = router;