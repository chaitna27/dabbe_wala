const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware");
const { allowRoles } = require("../middlewares/role.middleware");
const providerController = require("../controllers/provider.controller");

// ✅ PUBLIC – students
router.get("/public", providerController.getPublicProviders);

// ✅ PROVIDER DASHBOARD
router.get(
  "/dashboard",
  authMiddleware,
  allowRoles("provider"),
  providerController.getProviderDashboard
);
router.put("/deactivate", authMiddleware, providerController.deactivateProvider);

router.put("/reactivate", authMiddleware, providerController.reactivateProvider);

router.get("/profile", authMiddleware, providerController.getProviderProfile);

module.exports = router;


