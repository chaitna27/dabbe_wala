const express = require("express");
const router = express.Router();

const reviewController = require("../controllers/review.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const { allowRoles } = require("../middlewares/role.middleware");

// ======================
// STUDENT
// ======================

// Add review (only for delivered orders)
router.post(
  "/",
  authMiddleware,
  allowRoles("student"),
  reviewController.addReview
);

// ======================
// PROVIDER
// ======================

// Get reviews for provider’s orders
router.get(
  "/provider",
  authMiddleware,
  allowRoles("provider"),
  reviewController.getProviderReviews
);

module.exports = router;