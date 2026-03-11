const express = require("express");
const router = express.Router();

const orderController = require("../controllers/order.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const { allowRoles } = require("../middlewares/role.middleware");


// ======================
// STUDENT
// ======================

router.post(
  "/",
  authMiddleware,
  allowRoles("student"),
  orderController.createOrder
);

router.get(
  "/student",
  authMiddleware,
  allowRoles("student"),
  orderController.getStudentOrders
);

router.delete(
  "/:orderId",
  authMiddleware,
  allowRoles("student"),
  orderController.cancelOrder
);

router.get(
  "/provider",
  authMiddleware,
  allowRoles("provider"),
  orderController.getProviderOrders
);

router.get(
  "/provider/summary",
  authMiddleware,
  allowRoles("provider"),
  orderController.getProviderSummary
);

router.put(
  "/:orderId/status",
  authMiddleware,
  allowRoles("provider"),
  orderController.updateOrderStatus
);


module.exports = router;


