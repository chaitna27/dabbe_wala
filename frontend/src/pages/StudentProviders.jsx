import { useEffect, useState } from "react";
import api from "../api";
import { Navigate, useNavigate } from "react-router-dom";
import "../styles/StudentProviders.css";


export default function StudentProviders() {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const navigate = useNavigate();

  if (!token || role !== "student") {
    return <Navigate to="/login" />;
  }

  const [providers, setProviders] = useState([]);

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      const res = await api.get("/providers/public");
      setProviders(res.data);
    } catch (err) {
      alert("Failed to load providers");
    }
  };

  const callProvider = (phone) => {
    if (!phone) {
      alert("Phone number not available");
      return;
    }
    window.location.href = `tel:+91${phone}`;
  };

  return (
    <div className="container">
      <h2>Available Tiffin Providers</h2>

      {providers.length === 0 ? (
        <p>No providers available</p>
      ) : (
        <div className="provider-grid">
          {providers.map((p) => (
            <div
              key={p.id}
              style={{
                border: "1px solid #ddd",
                padding: "16px",
                borderRadius: "10px",
                width: "260px",
              }}
            >
              <h3>{p.kitchen_name}</h3>
              <p>{p.location}</p>

              {/* ⭐ Rating / 🆕 New + 📞 Dial */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
               {Number(p.rating) > 0 ? (
                 <span>⭐ {Number(p.rating).toFixed(1)}</span>
               ) : (
                <span
                  style={{
                    background: "#e8f5e9",
                    color: "#2e7d32",
                    padding: "2px 8px",
                    borderRadius: "12px",
                    fontSize: "13px",
                    fontWeight: "500",
                  }}
                >
                  🆕 New
                </span>
              )}

              {p.phone && (
                <button
                  title="Call Provider"
                  onClick={() => callProvider(p.phone)}
                  style={{
                    border: "1px solid #ccc",
                    background: "white",
                     borderRadius: "50%",
                     width: "32px",
                    height: "32px",
                    cursor: "pointer",
                  }}
                >
                   📞
                </button>
              )}
            </div>


              <button
                onClick={() => navigate(`/student/find-meals/${p.id}`)}
                style={{
                  marginTop: "10px",
                  background: "#c05a2b",
                  color: "white",
                  border: "none",
                  padding: "8px 14px",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                View Menu
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

