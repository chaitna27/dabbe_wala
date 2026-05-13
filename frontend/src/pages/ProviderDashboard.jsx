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
  const [summary, setSummary] = useState(null);
  const [kitchen, setKitchen] = useState({
    kitchenName: "",
    location: "",
    phone: "",
    whatsapp: "",
    latitude: "",
    longitude: "",
  });
  const [savingKitchen, setSavingKitchen] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/orders/provider/summary");
        setSummary(res.data);
      } catch {
        /* optional */
      }
    };
    const loadReviews = async () => {
      try {
        const res = await api.get("/reviews/provider");
        setReviews(Array.isArray(res.data) ? res.data : []);
      } catch {
        setReviews([]);
      } finally {
        setLoadingReviews(false);
      }
    };
    const loadProfile = async () => {
      try {
        const res = await api.get("/providers/profile");
        const d = res.data;
        setIsActive(d?.isActive === true || d?.is_active === true);
        setKitchen({
          kitchenName: d.kitchenName ?? "",
          location: d.location ?? "",
          phone: d.phone ?? "",
          whatsapp: d.whatsapp ?? "",
          latitude: d.latitude != null ? String(d.latitude) : "",
          longitude: d.longitude != null ? String(d.longitude) : "",
        });
      } catch {
        setIsActive(null);
      }
    };
    load();
    loadReviews();
    loadProfile();
  }, []);

  const saveKitchen = async (e) => {
    e.preventDefault();
    try {
      setSavingKitchen(true);
      await api.patch("/providers/profile", {
        kitchenName: kitchen.kitchenName.trim(),
        location: kitchen.location.trim(),
        phone: kitchen.phone.trim(),
        whatsapp: kitchen.whatsapp.trim(),
        latitude: kitchen.latitude.trim() === "" ? null : Number(kitchen.latitude),
        longitude: kitchen.longitude.trim() === "" ? null : Number(kitchen.longitude),
      });
      alert("Kitchen details saved");
    } catch (err) {
      alert(err.response?.data?.message || "Could not save");
    } finally {
      setSavingKitchen(false);
    }
  };

  if (!token || role !== "provider") {
    return <Navigate to="/login" />;
  }

  return (
    <div className="pd-page container">
      <h2 className="pd-title">Provider Dashboard</h2>

      <section className="pd-section">
        <h3 className="pd-section-title">Kitchen &amp; location</h3>
        <p className="pd-muted">
          Students see your kitchen name, address text, and distance when you set coordinates.
        </p>
        <form className="pd-form" onSubmit={saveKitchen}>
          <div className="pd-grid">
            <label className="pd-field">
              <span>Kitchen name</span>
              <input
                value={kitchen.kitchenName}
                onChange={(e) => setKitchen((k) => ({ ...k, kitchenName: e.target.value }))}
                maxLength={200}
              />
            </label>
            <label className="pd-field">
              <span>Location (area / landmark)</span>
              <input
                value={kitchen.location}
                onChange={(e) => setKitchen((k) => ({ ...k, location: e.target.value }))}
                maxLength={300}
              />
            </label>
            <label className="pd-field">
              <span>Phone</span>
              <input
                value={kitchen.phone}
                onChange={(e) => setKitchen((k) => ({ ...k, phone: e.target.value }))}
                maxLength={20}
              />
            </label>
            <label className="pd-field">
              <span>WhatsApp</span>
              <input
                value={kitchen.whatsapp}
                onChange={(e) => setKitchen((k) => ({ ...k, whatsapp: e.target.value }))}
                maxLength={20}
              />
            </label>
            <label className="pd-field">
              <span>Latitude (optional, −90 to 90)</span>
              <input
                value={kitchen.latitude}
                onChange={(e) => setKitchen((k) => ({ ...k, latitude: e.target.value }))}
                placeholder="e.g. 18.5204"
                inputMode="decimal"
              />
            </label>
            <label className="pd-field">
              <span>Longitude (optional, −180 to 180)</span>
              <input
                value={kitchen.longitude}
                onChange={(e) => setKitchen((k) => ({ ...k, longitude: e.target.value }))}
                placeholder="e.g. 73.8567"
                inputMode="decimal"
              />
            </label>
          </div>
          <button type="submit" className="pd-btn" disabled={savingKitchen}>
            {savingKitchen ? "Saving…" : "Save details"}
          </button>
        </form>
      </section>

      <section className="pd-section">
        <h3 className="pd-section-title">Student reviews</h3>
        {loadingReviews ? (
          <p className="pd-muted">Loading reviews…</p>
        ) : reviews.length === 0 ? (
          <div className="pd-empty">No reviews yet — great service earns stars here.</div>
        ) : (
          <ul className="pd-review-list">
            {reviews.map((r) => (
              <li key={r.id} className="pd-review-card">
                <p className="pd-review-stars">⭐ {r.rating}</p>
                <p className="pd-review-menu">
                  <strong>Food:</strong> {r.menu_items ?? "—"}
                </p>
                {r.comment ? (
                  <p className="pd-review-comment">
                    <strong>Note:</strong> {r.comment}
                  </p>
                ) : null}
                <p className="pd-review-by">— {r.student_name ?? "Student"}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="pd-section">
        <h3 className="pd-section-title">Orders snapshot</h3>
        {!summary ? (
          <p className="pd-muted">Loading summary…</p>
        ) : (
          <div className="pd-stats">
            <div className="pd-stat">
              <span className="pd-stat-val">{summary.total_orders ?? 0}</span>
              <span className="pd-stat-label">Total</span>
            </div>
            <div className="pd-stat">
              <span className="pd-stat-val">{summary.pending_orders ?? 0}</span>
              <span className="pd-stat-label">Pending</span>
            </div>
            <div className="pd-stat">
              <span className="pd-stat-val">{summary.accepted_orders ?? 0}</span>
              <span className="pd-stat-label">Accepted</span>
            </div>
            <div className="pd-stat">
              <span className="pd-stat-val">{summary.delivered_orders ?? 0}</span>
              <span className="pd-stat-label">Delivered</span>
            </div>
          </div>
        )}
        <div className="pd-actions">
          <button type="button" className="pd-btn" onClick={() => navigate("/provider/orders")}>
            View orders
          </button>
          <button type="button" className="pd-btn pd-btn-secondary" onClick={() => navigate("/provider/menu")}>
            Manage menu
          </button>
        </div>
      </section>

      <section className="pd-section">
        <h3 className="pd-section-title">Account status</h3>
        {isActive === null ? (
          <p className="pd-muted">Loading…</p>
        ) : isActive === true ? (
          <div>
            <p className="pd-status pd-status-on">Active — students can find you</p>
            <button
              type="button"
              className="pd-btn pd-btn-danger"
              onClick={async () => {
                if (!window.confirm("Deactivate your account?")) return;
                await api.put("/providers/deactivate");
                alert("Account deactivated");
                setIsActive(false);
              }}
            >
              Deactivate account
            </button>
          </div>
        ) : (
          <div>
            <p className="pd-status pd-status-off">Inactive</p>
            <button
              type="button"
              className="pd-btn"
              onClick={async () => {
                await api.put("/providers/reactivate");
                alert("Account reactivated");
                setIsActive(true);
              }}
            >
              Reactivate account
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
