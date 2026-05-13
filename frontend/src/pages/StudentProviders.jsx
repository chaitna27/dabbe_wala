import { useCallback, useEffect, useState } from "react";
import api from "../api";
import { Navigate, useNavigate } from "react-router-dom";
import "../styles/StudentProviders.css";
import { dialDigitsForLink } from "../utils/phone";
import { readStudentGeo, writeStudentGeo } from "../utils/studentGeo";

export default function StudentProviders() {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const navigate = useNavigate();

  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState("");
  const [studentGeo, setStudentGeo] = useState(() => readStudentGeo());

  const [sortBy, setSortBy] = useState("nearest");
  const [vegOnly, setVegOnly] = useState(false);
  const [minRating, setMinRating] = useState(0);

  const fetchProviders = useCallback(async () => {
    try {
      setLoading(true);
      const g = studentGeo;
      const params = {
        vegOnly: vegOnly ? "true" : "false",
        minRating: minRating > 0 ? minRating : undefined,
      };
      let sortParam = sortBy;
      if (g) {
        params.lat = g.lat;
        params.lng = g.lng;
      } else if (sortBy === "nearest") {
        sortParam = "rating";
      }
      params.sort = sortParam;
      const res = await api.get("/providers/public", { params });
      setProviders(Array.isArray(res.data) ? res.data : []);
    } catch {
      alert("Failed to load providers");
      setProviders([]);
    } finally {
      setLoading(false);
    }
  }, [studentGeo, sortBy, vegOnly, minRating]);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setGeoError("Location is not supported in this browser.");
      return;
    }
    setGeoError("");
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        writeStudentGeo(lat, lng);
        setStudentGeo({ lat, lng });
        setSortBy("nearest");
        setGeoLoading(false);
      },
      () => {
        setGeoError("Could not read your location. Check browser permissions.");
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
    );
  };

  const clearLocation = () => {
    sessionStorage.removeItem("dabbeStudentGeo");
    setStudentGeo(null);
    if (sortBy === "nearest") setSortBy("rating");
  };

  const callProvider = (phone) => {
    if (!phone) {
      alert("Phone number not available");
      return;
    }
    const digits = dialDigitsForLink(phone);
    window.location.href = digits ? `tel:+${digits}` : `tel:${phone}`;
  };

  const openWhatsApp = (raw) => {
    const digits = dialDigitsForLink(raw);
    if (!digits) {
      alert("WhatsApp number not available");
      return;
    }
    window.open(`https://wa.me/${digits}`, "_blank");
  };

  if (!token || role !== "student") {
    return <Navigate to="/login" />;
  }

  return (
    <div className="student-providers-page">
      <h2>Available Tiffin Providers</h2>
      <p className="student-providers-sub">
        Browse kitchens, sort by distance or price, and open a menu to order.
      </p>

      <div className="sp-toolbar">
        <button
          type="button"
          className="sp-btn sp-btn-primary"
          onClick={useMyLocation}
          disabled={geoLoading}
        >
          {geoLoading ? "Locating…" : "📍 Use my location"}
        </button>
        {studentGeo && (
          <button type="button" className="sp-btn" onClick={clearLocation}>
            Clear location
          </button>
        )}
        {geoError && <p className="sp-geo-hint">{geoError}</p>}
        {!studentGeo && (
          <p className="sp-geo-hint">
            Turn on location to sort by nearest kitchen and see &quot;km away&quot; labels.
          </p>
        )}
      </div>

      <div className="sp-filters">
        <div>
          <div className="sp-filter-label">Sort</div>
          <select
            className="sp-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="nearest">Nearest</option>
            <option value="rating">Highest rated</option>
            <option value="pricelow">Menu price: low → high</option>
            <option value="pricehigh">Menu price: high → low</option>
            <option value="name">Name (A–Z)</option>
          </select>
        </div>
        <div>
          <div className="sp-filter-label">Min rating</div>
          <select
            className="sp-select"
            value={String(minRating)}
            onChange={(e) => setMinRating(Number(e.target.value))}
          >
            <option value="0">Any</option>
            <option value="3">3+</option>
            <option value="4">4+</option>
            <option value="4.5">4.5+</option>
          </select>
        </div>
        <button
          type="button"
          className={`sp-pill ${vegOnly ? "active" : ""}`}
          onClick={() => setVegOnly(!vegOnly)}
        >
          Veg only kitchens
        </button>
      </div>

      {loading ? (
        <div className="sp-empty">Loading kitchens…</div>
      ) : providers.length === 0 ? (
        <div className="sp-empty">
          No providers match these filters. Try clearing filters or location.
        </div>
      ) : (
        <div className="provider-grid-sp">
          {providers.map((p) => {
            const name = p.kitchenName ?? p.kitchen_name ?? "Kitchen";
            const wa = p.whatsapp || p.phone;
            const minP = p.minMenuPrice;
            return (
              <div key={p.id} className="sp-card">
                <h3>{name}</h3>
                <p className="sp-card-loc">📍 {p.location || "—"}</p>
                {p.distanceLabel ? (
                  <p className="sp-distance">{p.distanceLabel}</p>
                ) : null}
                <p className="sp-meta-line">
                  {p.isActive === false ? "○ Inactive" : "● Active"}
                  {p.vegOnly ? " · Veg only" : ""}
                </p>
                {minP != null && Number.isFinite(minP) ? (
                  <p className="sp-price-hint">Menus from ₹{minP}</p>
                ) : null}

                <div className="sp-actions-row">
                  {Number(p.rating) > 0 ? (
                    <span style={{ fontWeight: 700, color: "#444" }}>
                      ⭐ {Number(p.rating).toFixed(1)}
                    </span>
                  ) : (
                    <span
                      style={{
                        background: "#e8f5e9",
                        color: "#2e7d32",
                        padding: "2px 8px",
                        borderRadius: "12px",
                        fontSize: "12px",
                        fontWeight: 600,
                      }}
                    >
                      New
                    </span>
                  )}
                  {p.phone && (
                    <button
                      type="button"
                      title="Call"
                      className="sp-icon-btn"
                      onClick={() => callProvider(p.phone)}
                    >
                      📞
                    </button>
                  )}
                  {wa && (
                    <button
                      type="button"
                      title="WhatsApp"
                      className="sp-icon-btn"
                      onClick={() => openWhatsApp(wa)}
                    >
                      💬
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  className="sp-view-menu"
                  onClick={() => navigate(`/student/find-meals/${p.id}`)}
                >
                  View menu
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
