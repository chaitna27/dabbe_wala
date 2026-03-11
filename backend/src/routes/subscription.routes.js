const express = require("express");
const router = express.Router();

const auth = require("../middlewares/auth.middleware");
const {
  createSubscription,
  getStudentSubscriptions,
  getProviderSubscriptions,
  updateSubscriptionStatus,
} = require("../controllers/subscription.controller");

// student
router.post("/", auth, createSubscription);
router.get("/student", auth, getStudentSubscriptions);

// provider
router.get("/provider", auth, getProviderSubscriptions);
router.patch("/:id/status", auth, updateSubscriptionStatus);

module.exports = router;






