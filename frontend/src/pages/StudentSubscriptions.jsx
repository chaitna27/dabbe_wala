import { useEffect, useState } from "react";
import api from "../api";

export default function StudentSubscriptions() {
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/subscriptions/student")
      .then((res) => setSubs(res.data))
      .catch(() => alert("Failed to load subscriptions"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading subscriptions...</p>;

  if (subs.length === 0) return <p>No subscriptions yet</p>;

  return (
    <div>
      <h2>My Subscriptions</h2>

      {subs.map((s) => (
        <div
          key={s.id}
          style={{
            border: "1px solid #ccc",
            padding: "12px",
            marginBottom: "10px",
            borderRadius: "6px",
          }}
        >
          <p><b>Plan:</b> {s.plan}</p>
          <p>
            <b>Duration:</b>{" "}
            {new Date(s.start_date).toLocaleDateString()} →{" "}
            {new Date(s.end_date).toLocaleDateString()}
          </p>
          <p>
            <b>Status:</b>{" "}
            <span
              style={{
                color:
                  s.status === "pending"
                    ? "orange"
                    : s.status === "active"
                    ? "green"
                    : "red",
              }}
            >
              {s.status}
            </span>
          </p>
        </div>
      ))}
    </div>
  );
}
