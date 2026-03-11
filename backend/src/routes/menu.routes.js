const express = require("express");
const router = express.Router();

const menuController = require("../controllers/menu.controller");
const verifyToken = require("../middlewares/auth.middleware");
const { allowRoles } = require("../middlewares/role.middleware");
const upload = require("../config/upload");


/**
 * PROVIDER — get own menus
 * (must be above "/")
 */
router.get(
  "/provider",
  verifyToken,
  allowRoles("provider"),
  menuController.getProviderMenus
);

/**
 * PROVIDER — create menu WITH IMAGE
 */
router.post(
  "/",
  verifyToken,
  allowRoles("provider"),
  upload.single("image"), // 🖼️ image upload
  menuController.createMenu
);

/**
 * PUBLIC — get all menus (students)
 */
router.get("/", menuController.getMenus);

/**
 * PROVIDER — update menu
 */
router.put(
  "/:id",
  verifyToken,
  allowRoles("provider"),
  upload.single("image"), // 🖼️ image upload
  menuController.updateMenu
);

/**
 * PROVIDER — delete menu
 */
router.delete(
  "/:id",
  verifyToken,
  allowRoles("provider"),
  menuController.deleteMenu
);

/**
 * STUDENT — get menus by provider
 */
router.get(
  "/provider/:providerId",
  menuController.getMenusByProviderId
);



module.exports = router;







