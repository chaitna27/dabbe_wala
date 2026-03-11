const db = require("../config/db");

/* ======================
   CREATE ORDER (STUDENT)
====================== */
exports.createOrder = (req, res) => {
  const studentId = req.user.id;
  const { menu_id, delivery_address } = req.body;

  if (!menu_id) {
    return res.status(400).json({ message: "menu_id is required" });
  }

  db.query(
    "SELECT provider_id FROM menus WHERE id = ?",
    [menu_id],
    (err, menuResult) => {
      if (err) return res.status(500).json(err);
      if (menuResult.length === 0)
        return res.status(404).json({ message: "Menu not found" });

      const providerId = menuResult[0].provider_id;

      // 🔹 Get student address
      db.query(
        "SELECT address FROM users WHERE id = ?",
        [studentId],
        (err, userRows) => {
          if (err) return res.status(500).json(err);

          const userAddress = userRows[0]?.address;
          const finalAddress = delivery_address?.trim() || userAddress;

          if (!finalAddress) {
            return res
              .status(400)
              .json({ message: "Delivery address is required" });
          }

          // 🔹 Create order with address snapshot
          db.query(
            `INSERT INTO orders 
             (student_id, provider_id, menu_id, delivery_address, order_date)
             VALUES (?, ?, ?, ?, CURDATE())`,
            [studentId, providerId, menu_id, finalAddress],
            (err, result) => {
              if (err) return res.status(500).json(err);
              res.status(201).json({
                message: "Order placed",
                order_id: result.insertId,
              });
            }
          );
        }
      );
    }
  );
};


/* ======================
   STUDENT ORDERS
====================== */
exports.getStudentOrders = (req, res) => {
  const studentId = req.user.id;

  db.query(
    `SELECT 
       o.id AS order_id,
       o.status,
       o.order_date,
       m.items,
       m.price,
       u.name AS provider_name,
       CASE 
         WHEN r.id IS NOT NULL THEN TRUE
         ELSE FALSE
       END AS reviewed
     FROM orders o
     JOIN menus m ON o.menu_id = m.id
     JOIN providers p ON o.provider_id = p.id
     JOIN users u ON p.user_id = u.id
     LEFT JOIN reviews r 
       ON r.order_id = o.id 
       AND r.student_id = ?
     WHERE o.student_id = ?
     ORDER BY o.created_at DESC`,
    [studentId, studentId],
    (err, rows) => {
      if (err) return res.status(500).json(err);
      res.json(rows);
    }
  );
};


/* ======================
   PROVIDER ORDERS
====================== */
exports.getProviderOrders = (req, res) => {
  if (req.user.role !== "provider") {
    return res.status(403).json({ message: "Not a provider" });
  }

  const userId = req.user.id;

  db.query(
    "SELECT id FROM providers WHERE user_id = ?",
    [userId],
    (err, providerRows) => {
      if (err) return res.status(500).json(err);
      if (providerRows.length === 0)
        return res.status(403).json({ message: "Provider profile missing" });

      const providerId = providerRows[0].id;

      db.query(
        `SELECT o.id AS order_id,
          o.status,
          o.order_date,
          o.delivery_address,
          u.name AS student_name,
          m.items,
          m.price   
         FROM orders o
         JOIN users u ON o.student_id = u.id
         JOIN menus m ON o.menu_id = m.id
         WHERE o.provider_id = ?
         ORDER BY o.created_at DESC`,
        [providerId],
        (err, orders) => {
          if (err) return res.status(500).json(err);
          res.json(orders);
        }
      );
    }
  );
};


/* ======================
   UPDATE ORDER STATUS
====================== */
exports.updateOrderStatus = (req, res) => {
  const userId = req.user.id;
  const { orderId } = req.params;
  const { status } = req.body;

  const allowed = ["accepted", "rejected", "delivered"];
  if (!allowed.includes(status))
    return res.status(400).json({ message: "Invalid status" });

  db.query(
    "SELECT id FROM providers WHERE user_id = ?",
    [userId],
    (err, providerRows) => {
      if (err) return res.status(500).json(err);
      if (providerRows.length === 0)
        return res.status(403).json({ message: "Not a provider" });

      const providerId = providerRows[0].id;

      db.query(
        `UPDATE orders
         SET status = ?
         WHERE id = ? AND provider_id = ?`,
        [status, orderId, providerId],
        (err, result) => {
          if (err) return res.status(500).json(err);
          if (result.affectedRows === 0)
            return res.status(403).json({ message: "Not authorized" });

          res.json({ message: "Status updated" });
        }
      );
    }
  );
};

/* ======================
   PROVIDER SUMMARY
====================== */
exports.getProviderSummary = (req, res) => {
  if (req.user.role !== "provider") {
    return res.status(403).json({ message: "Not a provider" });
  }

  const userId = req.user.id;

  db.query(
    "SELECT id FROM providers WHERE user_id = ?",
    [userId],
    (err, providerRows) => {
      if (err) return res.status(500).json(err);
      if (providerRows.length === 0)
        return res.status(403).json({ message: "Provider profile missing" });

      const providerId = providerRows[0].id;

      db.query(
        `SELECT
          COUNT(*) AS total_orders,
          SUM(status='pending') AS pending_orders,
          SUM(status='accepted') AS accepted_orders,
          SUM(status='delivered') AS delivered_orders
         FROM orders
         WHERE provider_id = ?`,
        [providerId],
        (err, rows) => {
          if (err) return res.status(500).json(err);
          res.json(rows[0]);
        }
      );
    }
  );
};


//cancel order
exports.cancelOrder = (req, res) => {
  const studentId = req.user.id;
  const { orderId } = req.params;

  const query = `
    DELETE FROM orders
    WHERE id = ? AND student_id = ? AND status = 'pending'
  `;

  db.query(query, [orderId, studentId], (err, result) => {
    if (err) return res.status(500).json(err);

    if (result.affectedRows === 0) {
      return res.status(403).json({ message: "Cannot cancel order" });
    }

    res.json({ message: "Order cancelled successfully" });
  });
};



