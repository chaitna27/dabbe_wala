import { useEffect, useState } from "react";
import api from "../api";
import { Navigate, useNavigate } from "react-router-dom";
import "../styles/ProviderDashboard.css";


export default function ProviderDashboard() {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [isActive, setIsActive] = useState(null);

  if (!token || role !== "provider") {
    return <Navigate to="/login" />;
  }

  const [summary, setSummary] = useState(null);

  useEffect(() => {
    fetchSummary();
    fetchReviews();
    fetchProfile();
  }, []);

  const fetchSummary = async () => {
    try {
      const res = await api.get("/orders/provider/summary");
      setSummary(res.data);
    } catch (err) {
      alert("Failed to load provider summary");
    }
  };

  const fetchReviews = async () => {
    try {
      const res = await api.get("/reviews/provider");
      setReviews(res.data);
    } catch (err) {
      alert("Failed to load reviews");
    } finally {
      setLoadingReviews(false);
    }
  };
  
  const fetchProfile = async () => {
    try {
      const res = await api.get("/providers/profile");
      setIsActive(res.data.is_active);
    } catch (err) {
      alert("Failed to load profile");
    }
  };
  

  return (
    <div className="container">
      <h2>Provider Dashboard 📊</h2>
      
      <hr />

      <h3>Student Reviews ⭐</h3>

      {loadingReviews ? (
        <p>Loading reviews...</p>
      ) : reviews.length === 0 ? (
        <p>No reviews yet</p>
      ) : (
        reviews.map((r) => (
          <div
            key={r.id}
            style={{
              border: "1px solid #ddd",
              padding: "12px",
              marginBottom: "12px",
              borderRadius: "10px",
              background: "#fafafa",
            }}
          >
            <p style={{ margin: 0 }}>
              ⭐ <b>{r.rating}</b>
            </p>

            <p style={{ margin: "6px 0" }}>
              🍱 <b>Food Item:</b> {r.menu_items}
            </p>

            {r.comment && (
              <p style={{ margin: "6px 0" }}>
                📝 <b>Comment:</b> {r.comment}
              </p>
            )}

            <small style={{ color: "#666" }}>
              — {r.student_name}
            </small>          
          </div>
        ))
      )}
      


      {!summary ? (
        <p>Loading summary...</p>
      ) : (
        <div style={{ marginBottom: "20px" }}>
          <p><b>Total Orders:</b> {summary.total_orders}</p>
          <p><b>Pending:</b> {summary.pending_orders}</p>
          <p><b>Accepted:</b> {summary.accepted_orders}</p>
          <p><b>Delivered:</b> {summary.delivered_orders}</p>
        </div>
      )}

      <button
        onClick={() => navigate("/provider/orders")}
        style={{
          background: "#c05a2b",
          color: "white",
          border: "none",
          padding: "8px 14px",
          borderRadius: "6px",
          cursor: "pointer",
        }}
      >
        View Orders
      </button>

      <button
        onClick={() => navigate("/provider/menu")}
        style={{
          marginLeft: "10px",
          background: "#c05a2b",
          color: "white",
          border: "none",
          padding: "8px 14px",
          borderRadius: "6px",
          cursor: "pointer",
        }}
      >
        Manage Menu
      </button>
      
<hr />

<h3>Account Status</h3>

{isActive === 1 ? (
  <>
    <p style={{ color: "green" }}>🟢 Active</p>
    <button
      onClick={async () => {
        if (!window.confirm("Deactivate your account?")) return;

        await api.put("/providers/deactivate");
        alert("Account deactivated");
        setIsActive(0);
      }}
      style={{
        background: "red",
        color: "white",
        padding: "8px 12px",
        borderRadius: "6px",
        border: "none",
        marginTop: "10px",
      }}
    >
      Deactivate Account
    </button>
  </>
) : (
  <>
    <p style={{ color: "red" }}>🔴 Inactive</p>
    <button
      onClick={async () => {
        await api.put("/providers/reactivate");
        alert("Account reactivated");
        setIsActive(1);
      }}
      style={{
        background: "green",
        color: "white",
        padding: "8px 12px",
        borderRadius: "6px",
        border: "none",
        marginTop: "10px",
      }}
    >
      Reactivate Account
    </button>
  </>
)}

      

    </div>
  );
}
