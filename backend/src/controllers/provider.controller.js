const db = require("../config/db");

/**
 * PUBLIC – for students (landing page & find meals)
 */
exports.getPublicProviders = (req, res) => {
  const sql = `
    SELECT 
      p.id,
      p.kitchen_name,
      p.location,
      p.phone,
      p.whatsapp,
      COALESCE(ROUND(AVG(r.rating), 1), 0) AS rating
    FROM providers p
    LEFT JOIN orders o ON o.provider_id = p.id
    LEFT JOIN reviews r ON r.order_id = o.id
    WHERE p.is_active = 1
    GROUP BY p.id
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("SQL ERROR 👉", err);
      return res.status(500).json({
        message: "Failed to fetch providers",
      });
    }

    res.json(results);
  });
};


/**
 * PROVIDER DASHBOARD
 */
exports.getProviderDashboard = (req, res) => {
  const userId = req.user.id;

  db.query(
    "SELECT id FROM providers WHERE user_id = ?",
    [userId],
    (err, providerResult) => {
      if (err) return res.status(500).json(err);

      if (providerResult.length === 0) {
        return res.status(404).json({ message: "Provider not found" });
      }

      const providerId = providerResult[0].id;

      const dashboardSql = `
        SELECT
          COUNT(o.id) AS total_orders,
          SUM(o.status = 'delivered') AS delivered_orders,
          COUNT(r.id) AS total_reviews,
          IFNULL(AVG(r.rating), 0) AS average_rating
        FROM orders o
        LEFT JOIN reviews r ON o.id = r.order_id
        WHERE o.provider_id = ?
      `;

      db.query(dashboardSql, [providerId], (err, data) => {
        if (err) return res.status(500).json(err);
        res.json(data[0]);
      });
    }
  );
};


exports.deactivateProvider = (req, res) => {
  const userId = req.user.id;

  db.query(
    "UPDATE providers SET is_active = 0 WHERE user_id = ?",
    [userId],
    (err, result) => {
      if (err) return res.status(500).json(err);

      res.json({ message: "Account deactivated successfully" });
    }
  );
};

exports.reactivateProvider = (req, res) => {
  const userId = req.user.id;

  db.query(
    "UPDATE providers SET is_active = 1 WHERE user_id = ?",
    [userId],
    (err) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Account reactivated successfully" });
    }
  );
};

exports.getProviderProfile = (req, res) => {
  const userId = req.user.id;

  db.query(
    "SELECT is_active FROM providers WHERE user_id = ?",
    [userId],
    (err, result) => {
      if (err) return res.status(500).json(err);
      if (result.length === 0)
        return res.status(404).json({ message: "Provider not found" });

      res.json(result[0]);
    }
  );
};
