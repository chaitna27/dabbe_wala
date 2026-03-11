import { useEffect, useState } from "react";
import api from "../api";
import { Navigate } from "react-router-dom";

export default function ProviderSubscriptions() {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token || role !== "provider") {
    return <Navigate to="/login" />;
  }

  const [subs, setSubs] = useState([]);

  useEffect(() => {
    fetchSubs();
  }, []);

  const fetchSubs = async () => {
    try {
      const res = await api.get("/subscriptions/provider");
      setSubs(res.data);
    } catch {
      alert("Failed to load subscriptions");
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/subscriptions/${id}/status`, { status });
      fetchSubs();
    } catch {
      alert("Failed to update status");
    }
  };

  return (
    <div className="container">
      <h2>Subscription Requests</h2>

      {subs.length === 0 ? (
        <p>No subscription requests</p>
      ) : (
        subs.map((s) => (
          <div
            key={s.id}
            style={{
              border: "1px solid #ddd",
              padding: "12px",
              marginBottom: "12px",
              borderRadius: "8px",
            }}
          >
            <p><b>Student:</b> {s.student_name}</p>
            <p><b>Plan:</b> {s.plan}</p>
            <p><b>Duration:</b> {s.start_date} → {s.end_date}</p>
            <p><b>Status:</b> {s.status}</p>

            {s.status === "pending" && (
              <>
                <button onClick={() => updateStatus(s.id, "active")}>
                  ✅ Approve
                </button>
                <button
                  onClick={() => updateStatus(s.id, "rejected")}
                  style={{ marginLeft: "10px" }}
                >
                  ❌ Reject
                </button>
              </>
            )}
          </div>
        ))
      )}
    </div>
  );
}
