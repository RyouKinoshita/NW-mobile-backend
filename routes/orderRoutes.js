const express = require("express");
const upload = require("../utils/multer");
const { checkoutOrder, getMyOrder, checkoutPaymentIntent,
    getSellerOrder,
    updateOrderStatus,
    getAllOrder
 } = require("../controllers/checkoutController");

const router = express.Router();
router.post("/checkout", checkoutOrder);
router.post("/checkout/create-payment-intent", checkoutPaymentIntent);
router.post("/update-status", updateOrderStatus);
router.get("/get-all-orders", getAllOrder);
router.get("/my-order/:id", getMyOrder);
router.get("/my-order/seller/:id", getSellerOrder);

//export
module.exports = router;