
const express = require("express");
const upload = require("../utils/multer");
const { checkoutOrder, getMyOrder } = require("../controllers/checkoutController");

const router = express.Router();
router.post("/checkout", checkoutOrder);
router.get("/my-order/:id", getMyOrder);

//export
module.exports = router;



