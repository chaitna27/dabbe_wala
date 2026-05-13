import { useEffect, useState, useCallback } from "react";
import api from "../api";
import { Navigate, useNavigate } from "react-router-dom";
import "../styles/ProviderDashboard.css";

function sanitizeCoordInput(value) {
  return String(value ?? "")
    .replace(/[°NSEWnsew]/g, "")
    .replace(/[^\d.\-]/g, "")
    .replace(/(?!^)-/g, "");
}

function countDigits(s) {
  return (String(s).match(/\d/g) || []).length;
}

function validateKitchenForm(kitchen) {
  const errors = {};
  if (!kitchen.kitchenName.trim()) {
    errors.kitchenName = "Kitchen name is required.";
  }
  if (!kitchen.location.trim()) {
    errors.location = "Location is required.";
  }
  const phone = kitchen.phone.trim();
  if (phone && countDigits(phone) < 10) {
    errors.phone = "Enter a valid phone number (at least 10 digits).";
  }
  const wa = kitchen.whatsapp.trim();
  if (wa && countDigits(wa) < 10) {
    errors.whatsapp = "Enter a valid WhatsApp number (at least 10 digits).";
  }
  const latStr = kitchen.latitude.trim();
  const lngStr = kitchen.longitude.trim();
  if (latStr || lngStr) {
    if (latStr) {
      const la = Number(latStr);
      if (!Number.isFinite(la) || la < -90 || la > 90) {
        errors.latitude = "Latitude must be a number between −90 and 90.";
      }
    }
    if (lngStr) {
      const lo = Number(lngStr);
      if (!Number.isFinite(lo) || lo < -180 || lo > 180) {
        errors.longitude = "Longitude must be a number between −180 and 180.";
      }
    }
  }
  return errors;
}

export default function ProviderDashboard() {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const navigate = useNavigate();

  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [isActive, setIsActive] = useState(null);
  const [summary, setSummary] = useState(null);
  const [summaryError, setSummaryError] = useState("");
  const [kitchen, setKitchen] = useState({
    kitchenName: "",
    location: "",
    phone: "",
    whatsapp: "",
    latitude: "",
    longitude: "",
  });
  const [savingKitchen, setSavingKitchen] = useState(false);
  const [profileReady, setProfileReady] = useState(false);
  const [profileLoadError, setProfileLoadError] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const [toast, setToast] = useState(null);

  const loadSummary = useCallback(async () => {
    try {
      const res = await api.get("/orders/provider/summary");
      setSummary(res.data);
      setSummaryError("");
    } catch (err) {
      setSummary(null);
      setSummaryError(err.response?.data?.message || "Could not load order summary.");
    }
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
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
      setProfileLoadError("");
      try {
        const res = await api.get("/providers/profile");
        const d = res.data;
        setIsActive(d?.isActive === true);
        setKitchen({
          kitchenName: d.kitchenName ?? "",
          location: d.location ?? "",
          phone: d.phone ?? "",
          whatsapp: d.whatsapp ?? "",
          latitude: d.latitude != null ? String(d.latitude) : "",
          longitude: d.longitude != null ? String(d.longitude) : "",
        });
      } catch (err) {
        setIsActive(null);
        setProfileLoadError(err.response?.data?.message || "Could not load kitchen profile.");
      } finally {
        setProfileReady(true);
      }
    };
    loadSummary();
    loadReviews();
    loadProfile();
  }, [loadSummary]);

  const saveKitchen = async (e) => {
    e.preventDefault();
    const errors = validateKitchenForm(kitchen);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      setToast({ type: "error", message: "Please fix the highlighted fields." });
      return;
    }

    try {
      setSavingKitchen(true);
      await api.put("/providers/profile", {
        kitchenName: kitchen.kitchenName.trim(),
        location: kitchen.location.trim(),
        phone: kitchen.phone.trim(),
        whatsapp: kitchen.whatsapp.trim(),
        latitude: kitchen.latitude.trim() === "" ? null : Number(kitchen.latitude),
        longitude: kitchen.longitude.trim() === "" ? null : Number(kitchen.longitude),
      });
      setToast({ type: "success", message: "Kitchen details saved successfully." });
      setFormErrors({});
      loadSummary();
    } catch (err) {
      const msg = err.response?.data?.message || "Could not save kitchen details.";
      setToast({ type: "error", message: msg });
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

      {toast ? (
        <div className={`pd-toast pd-toast-${toast.type}`} role="status">
          {toast.message}
        </div>
      ) : null}

      <section className="pd-section">
        <h3 className="pd-section-title">Kitchen &amp; location</h3>
        <p className="pd-muted">
          Students see your kitchen name, address text, and distance when you set coordinates.
        </p>
        {profileLoadError ? (
          <div className="pd-banner pd-banner-error" role="alert">
            {profileLoadError}
          </div>
        ) : null}
        <form className="pd-form" onSubmit={saveKitchen} noValidate>
          <div className="pd-grid">
            <label className="pd-field">
              <span>Kitchen name</span>
              <input
                value={kitchen.kitchenName}
                onChange={(e) =>
                  setKitchen((k) => ({ ...k, kitchenName: e.target.value }))
                }
                maxLength={200}
                aria-invalid={Boolean(formErrors.kitchenName)}
              />
              {formErrors.kitchenName ? (
                <span className="pd-field-error">{formErrors.kitchenName}</span>
              ) : null}
            </label>
            <label className="pd-field">
              <span>Location (area / landmark)</span>
              <input
                value={kitchen.location}
                onChange={(e) => setKitchen((k) => ({ ...k, location: e.target.value }))}
                maxLength={300}
                aria-invalid={Boolean(formErrors.location)}
              />
              {formErrors.location ? (
                <span className="pd-field-error">{formErrors.location}</span>
              ) : null}
            </label>
            <label className="pd-field">
              <span>Phone</span>
              <input
                value={kitchen.phone}
                onChange={(e) => setKitchen((k) => ({ ...k, phone: e.target.value }))}
                maxLength={20}
                inputMode="tel"
                aria-invalid={Boolean(formErrors.phone)}
              />
              {formErrors.phone ? <span className="pd-field-error">{formErrors.phone}</span> : null}
            </label>
            <label className="pd-field">
              <span>WhatsApp</span>
              <input
                value={kitchen.whatsapp}
                onChange={(e) => setKitchen((k) => ({ ...k, whatsapp: e.target.value }))}
                maxLength={20}
                inputMode="tel"
                aria-invalid={Boolean(formErrors.whatsapp)}
              />
              {formErrors.whatsapp ? (
                <span className="pd-field-error">{formErrors.whatsapp}</span>
              ) : null}
            </label>
            <label className="pd-field">
              <span>Latitude (optional)</span>
              <input
                value={kitchen.latitude}
                onChange={(e) =>
                  setKitchen((k) => ({
                    ...k,
                    latitude: sanitizeCoordInput(e.target.value),
                  }))
                }
                placeholder="21.2487"
                inputMode="decimal"
                aria-invalid={Boolean(formErrors.latitude)}
              />
              {formErrors.latitude ? (
                <span className="pd-field-error">{formErrors.latitude}</span>
              ) : null}
            </label>
            <label className="pd-field">
              <span>Longitude (optional)</span>
              <input
                value={kitchen.longitude}
                onChange={(e) =>
                  setKitchen((k) => ({
                    ...k,
                    longitude: sanitizeCoordInput(e.target.value),
                  }))
                }
                placeholder="81.6296"
                inputMode="decimal"
                aria-invalid={Boolean(formErrors.longitude)}
              />
              {formErrors.longitude ? (
                <span className="pd-field-error">{formErrors.longitude}</span>
              ) : null}
            </label>
          </div>
          <button type="submit" className="pd-btn" disabled={savingKitchen || !profileReady}>
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
        {summaryError ? (
          <p className="pd-banner pd-banner-error">{summaryError}</p>
        ) : !summary ? (
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
          <button
            type="button"
            className="pd-btn pd-btn-secondary"
            onClick={() => navigate("/provider/menu")}
          >
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
                try {
                  await api.put("/providers/deactivate");
                  setToast({ type: "success", message: "Account deactivated." });
                  setIsActive(false);
                } catch (err) {
                  setToast({
                    type: "error",
                    message: err.response?.data?.message || "Could not deactivate.",
                  });
                }
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
                try {
                  await api.put("/providers/reactivate");
                  setToast({ type: "success", message: "Account reactivated." });
                  setIsActive(true);
                } catch (err) {
                  setToast({
                    type: "error",
                    message: err.response?.data?.message || "Could not reactivate.",
                  });
                }
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
