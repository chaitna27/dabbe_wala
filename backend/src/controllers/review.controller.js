const db = require("../config/db");

/**
 * STUDENT: Add review (only for delivered orders)
 */
exports.addReview = (req, res) => {
  const studentId = req.user.id;
  const { order_id, rating, comment } = req.body;

  // 1. Validate order belongs to student & is delivered
  const checkSql = `
    SELECT id FROM orders
    WHERE id = ? AND student_id = ? AND status = 'delivered'
  `;

  db.query(checkSql, [order_id, studentId], (err, result) => {
    if (err) return res.status(500).json(err);

    if (result.length === 0) {
      return res
        .status(403)
        .json({ message: "You can review only your delivered orders" });
    }
    
    if (!comment || comment.trim().length < 5) {
      return res
        .status(400)
        .json({ message: "Review must be at least 5 characters long" });
    }    
    // 2. Insert review
    // 2. Check if already reviewed
db.query(
  "SELECT id FROM reviews WHERE order_id = ? AND student_id = ?",
  [order_id, studentId],
  (err, existing) => {
    if (err) return res.status(500).json(err);

    if (existing.length > 0) {
      return res
        .status(400)
        .json({ message: "You have already reviewed this order" });
    }

    // 3. Insert review
    const insertSql = `
      INSERT INTO reviews (order_id, student_id, rating, comment)
      VALUES (?, ?, ?, ?)
    `;

    db.query(
      insertSql,
      [order_id, studentId, rating, comment],
      (err) => {
        if (err) return res.status(500).json(err);

        res.json({ message: "Review added successfully" });
      }
    );
  }
);

  });
};

/**
 * PROVIDER: Get reviews for own orders
 */
exports.getProviderReviews = (req, res) => {
  const userId = req.user.id;

  // 1. Get provider id
  db.query(
    "SELECT id FROM providers WHERE user_id = ?",
    [userId],
    (err, providerResult) => {
      if (err) return res.status(500).json(err);

      if (providerResult.length === 0) {
        return res.status(404).json({ message: "Provider not found" });
      }

      const providerId = providerResult[0].id;

      // 2. Fetch reviews
      const sql = `
        SELECT 
          r.id,
          r.rating,
          r.comment,
          r.created_at,
          u.name AS student_name,
          COALESCE(m.items, 'Menu removed') AS menu_items
        FROM reviews r
        JOIN orders o ON r.order_id = o.id
        JOIN users u ON o.student_id = u.id
        JOIN menus m ON o.menu_id = m.id
        WHERE o.provider_id = ?
        ORDER BY r.created_at DESC
      `;

      db.query(sql, [providerId], (err, reviews) => {
        if (err) return res.status(500).json(err);
        res.json(reviews);
      });
    }
  );
};



