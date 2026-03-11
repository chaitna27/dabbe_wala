const db = require("../config/db");

// =======================
// CREATE SUBSCRIPTION (STUDENT)
// =======================
exports.createSubscription = (req, res) => {
  const studentId = req.user.id;
  const { provider_id, plan, start_date, end_date } = req.body;

  const sql = `
    INSERT INTO subscriptions 
    (student_id, provider_id, plan, start_date, end_date, status)
    VALUES (?, ?, ?, ?, ?, 'pending')
  `;

  db.query(
    sql,
    [studentId, provider_id, plan, start_date, end_date],
    (err) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Subscription created" });
    }
  );
};

// =======================
// STUDENT: VIEW OWN SUBS
// =======================
exports.getStudentSubscriptions = (req, res) => {
  const studentId = req.user.id;

  const sql = `
    SELECT * FROM subscriptions
    WHERE student_id = ?
    ORDER BY created_at DESC
  `;

  db.query(sql, [studentId], (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows);
  });
};

// =======================
// PROVIDER: VIEW REQUESTS
// =======================
exports.getProviderSubscriptions = (req, res) => {
  const providerUserId = req.user.id;

  const sql = `
    SELECT s.*, u.name AS student_name
    FROM subscriptions s
    JOIN providers p ON s.provider_id = p.id
    JOIN users u ON s.student_id = u.id
    WHERE p.user_id = ?
    ORDER BY s.created_at DESC
  `;

  db.query(sql, [providerUserId], (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows);
  });
};

// =======================
// PROVIDER: APPROVE / REJECT
// =======================
exports.updateSubscriptionStatus = (req, res) => {
  console.log("REQ USER:", req.user);
  console.log("REQ PARAMS:", req.params);
  console.log("REQ BODY:", req.body);

  const { id } = req.params;
  const userId = req.user.id;
  let { status } = req.body;

  if (status === "approved" || status === "accepted") {
    status = "active";
  }

  if (!["pending", "active", "rejected", "cancelled"].includes(status)) {
    return res.status(400).json({ message: "Invalid status value" });
  }

  db.query(
    "SELECT id FROM providers WHERE user_id = ?",
    [userId],
    (err, providerRows) => {
      if (err) {
        console.error("PROVIDER QUERY ERROR:", err);
        return res.status(500).json(err);
      } 

      console.log("PROVIDER ROWS:", providerRows);

      if (providerRows.length === 0) {
        return res.status(403).json({ message: "Not a provider" });
      }

      const providerId = providerRows[0].id;

      db.query(
        "UPDATE subscriptions SET status = ? WHERE id = ? AND provider_id = ?",
        [status, id, providerId],
        (err2, result) => {
          if (err2) {
            console.error("UPDATE ERROR:", err2);
            return res.status(500).json(err2);
          }

          console.log("UPDATE RESULT:", result);

          if (result.affectedRows === 0) {
            return res.status(403).json({ message: "Not authorized" });
          }

          res.json({ message: "Status updated" });
        }
      );
    }
  );
};


