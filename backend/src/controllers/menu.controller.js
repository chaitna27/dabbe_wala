const db = require("../config/db");

// ======================
// GET ALL MENUS (PUBLIC)
// ======================
exports.getMenus = (req, res) => {
  const sql = `
    SELECT 
      m.id,
      m.provider_id,
      m.items,
      m.price,
      m.day,
      m.meal_type,
      m.is_veg,
      m.is_available,
      m.image,
      p.kitchen_name,
      p.location
    FROM menus m
    JOIN providers p ON m.provider_id = p.id
    WHERE m.is_available = 1
  `;

  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows);
  });
};

// ======================
// CREATE MENU (PROVIDER)
// ======================
exports.createMenu = (req, res) => {
  const userId = req.user.id;
  const { items, price, day, meal_type, is_veg } = req.body;

  // 🖼️ NEW: image path
  const image = req.file ? req.file.path : null;

  if (!items || !price || !day || !meal_type) {
    return res.status(400).json({ message: "All fields required" });
  }

  db.query(
    "SELECT id FROM providers WHERE user_id = ?",
    [userId],
    (err, rows) => {
      if (err) return res.status(500).json(err);
      if (rows.length === 0)
        return res.status(403).json({ message: "Not a provider" });

      const providerId = rows[0].id;

      db.query(
        `INSERT INTO menus 
         (provider_id, items, price, day, meal_type, is_veg, is_available, image)
         VALUES (?, ?, ?, ?, ?, ?, 1, ?)`,
        [providerId, items, price, day, meal_type, is_veg ?? 1, image],
        (err) => {
          if (err) return res.status(500).json(err);
          res.json({ message: "Menu added successfully" });
        }
      );
    }
  );
};


// ======================
// GET PROVIDER MENUS (PROVIDER DASHBOARD)
// ======================
exports.getProviderMenus = (req, res) => {
  const userId = req.user.id;

  db.query(
    "SELECT id FROM providers WHERE user_id = ?",
    [userId],
    (err, rows) => {
      if (err) return res.status(500).json(err);
      if (rows.length === 0)
        return res.status(403).json({ message: "Not a provider" });

      const providerId = rows[0].id;

      db.query(
        `SELECT *
        FROM menus
        WHERE provider_id = ?
        ORDER BY created_at DESC`,
        [providerId],
        (err, menus) => {
          if (err) return res.status(500).json(err);
          res.json(menus);
        }
      );
    }
  );
};

// ======================
// UPDATE MENU
// ======================
exports.updateMenu = (req, res) => {
  const { id } = req.params;
  const { items, price, is_available, is_veg } = req.body;

  const image = req.file ? req.file.path : null;

  let sql = `
    UPDATE menus 
    SET items=?, price=?, is_available=?, is_veg=?
  `;

  const values = [items, price, is_available, is_veg];

  if (image) {
    sql += ", image=?";
    values.push(image);
  }

  sql += " WHERE id=?";
  values.push(id);

  db.query(sql, values, (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Menu updated" });
  });
};



// ======================
// DELETE MENU
// ======================
exports.deleteMenu = (req, res) => {
  const { id } = req.params;

  db.query("DELETE FROM menus WHERE id=?", [id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Menu deleted" });
  });
};

// ======================
// GET MENUS BY PROVIDER ID (STUDENT VIEW)
// ======================
exports.getMenusByProviderId = (req, res) => {
  const { providerId } = req.params;

  db.query(
    `SELECT *
     FROM menus
     WHERE provider_id = ? AND is_available = 1
     ORDER BY created_at DESC`,
    [providerId],
    (err, menus) => {
      if (err) return res.status(500).json(err);
      res.json(menus);
    }
  );
};



