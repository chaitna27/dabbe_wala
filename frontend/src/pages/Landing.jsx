import { useCallback, useEffect, useState } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";
import "./../styles/Landing.css";
import { dialDigitsForLink } from "../utils/phone";
import { readStudentGeo, writeStudentGeo } from "../utils/studentGeo";

function Landing() {
  const [providers, setProviders] = useState([]);
  const [studentGeo, setStudentGeo] = useState(() => readStudentGeo());
  const [geoLoading, setGeoLoading] = useState(false);
  const navigate = useNavigate();

  const fetchProviders = useCallback(async () => {
    try {
      const g = studentGeo;
      const params = {};
      if (g) {
        params.lat = g.lat;
        params.lng = g.lng;
        params.sort = "nearest";
      } else {
        params.sort = "rating";
      }
      const res = await api.get("/providers/public", { params });
      setProviders(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to load providers", err);
      setProviders([]);
    }
  }, [studentGeo]);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        writeStudentGeo(lat, lng);
        setStudentGeo({ lat, lng });
        setGeoLoading(false);
      },
      () => setGeoLoading(false),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
    );
  };


  return (
    <div className="landing-page-wrapper">
    
      {/* ================= HERO SECTION ================= */}
      <section className="hero-container">
        <div className="hero-background"></div>
        
        <div className="hero-content">
          <span style={{
            letterSpacing: "2px",
            fontSize: "20px",
            fontWeight: "700",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.7)"
          }}>
            Women-Led & Authentic
          </span>
          
          <h1 className="hero-title">
            Ghar ka khana,<br />away from home.
          </h1>
          
          <p className="hero-subtitle">
            Wholesome, home-cooked tiffins delivered to your doorstep.
          </p>
          
          <button className="hero-btn" onClick={() => navigate("/student/find-meals")}>
            Explore Home-Cooked Tiffins
          </button>
        </div>

      </section>

      {/* ================= FIND MEALS SECTION ================= */}
      <section id="find-meals">
        <div style={{ textAlign: "center", marginBottom: "60px" }}>
          <h2 style={{ fontSize: "42px", color: "#1a3c34", fontWeight: "800", fontFamily: "'Playfair Display', serif" }}>
            Our Kitchen Partners
          </h2>
          <div style={{ width: "60px", height: "4px", background: "#ff6d33", margin: "15px auto" }}></div>
        </div>

        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <button
            type="button"
            className="landing-geo-btn"
            onClick={useMyLocation}
            disabled={geoLoading}
          >
            {geoLoading ? "Locating…" : "📍 Use my location"}
          </button>
          {studentGeo && (
            <p className="landing-geo-note">Showing kitchens nearest to you first.</p>
          )}
        </div>

        <div className="provider-grid">
          {providers.length === 0 ? (
            <p style={{ fontSize: "18px", color: "#666" }}>Loading fresh meals for you...</p>
          ) : (
            providers.map((provider) => (
              <div key={provider.id} className="provider-card-animated">
                {Number(provider.rating || 0) >= 4 && (
                  <div className="recommended-badge">
                    <span>✨</span> RECOMMENDED
                  </div>
                )}
                
                <h3 style={{ color: "var(--deep-green)", fontSize: "22px", marginBottom: "8px" }}>
                  {provider.kitchenName ?? provider.kitchen_name}
                </h3>
                <p style={{ color: "#666", marginBottom: "8px", fontSize: "14px" }}>
                  📍 {provider.location || "—"}
                </p>
                {provider.distanceLabel ? (
                  <p className="landing-distance">{provider.distanceLabel}</p>
                ) : null}
                {provider.minMenuPrice != null && Number.isFinite(provider.minMenuPrice) ? (
                  <p className="landing-from-price">From ₹{provider.minMenuPrice}</p>
                ) : null}

                {/* Star Rating & Call Row */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "5px", fontWeight: "bold", color: "#444" }}>
                    <span style={{ color: "#ffb400" }}>⭐</span> 
                    {Number(provider.rating || 0).toFixed(1)}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {provider.phone && (
                    <button
                      title="Call Provider"
                      type="button"
                      onClick={() => {
                        const d = dialDigitsForLink(provider.phone);
                        window.location.href = d ? `tel:+${d}` : `tel:${provider.phone}`;
                      }}
                      className="call-btn-circle"
                    >
                      📞
                    </button>
                  )}
                  {(provider.whatsapp || provider.phone) && (
                    <button
                      type="button"
                      title="WhatsApp"
                      onClick={() => {
                        const raw = provider.whatsapp || provider.phone;
                        const d = dialDigitsForLink(raw);
                        if (d) window.open(`https://wa.me/${d}`, "_blank");
                      }}
                      className="call-btn-circle"
                    >
                      💬
                    </button>
                  )}
                  </div>
                </div>

                <button
                  className="main-button"
                  style={{ width: "100%", marginTop: "0", padding: "12px", fontSize: "16px" }}
                  onClick={() => navigate(`/student/find-meals/${provider.id}`)}
                >
                  View Menu
                </button>
              </div>
            ))
          )}
        </div>

      </section>

      {/* ================= HOW IT WORKS SECTION ================= */}
      {/* Replace your current section with this exact code */}
<section id="how-it-works" className="how-it-works-section">
  <h2 className="how-it-works-title">
    Fresh Meals in 3 Simple Steps
  </h2>

  <div className="steps-container-grid">
    <div className="step-box">
      <div className="step-icon-bg">🍱</div>
      <h3 className="step-box-title">Choose Your Kitchen</h3>
      <p className="step-box-text">Browse authentic, women-led home kitchens near you.</p>
    </div>

    <div className="step-box">
      <div className="step-icon-bg">📅</div>
      <h3 className="step-box-title">Pick a Subscription</h3>
      <p className="step-box-text">Choose weekly or monthly plans that fit your student schedule.</p>
    </div>

    <div className="step-box">
      <div className="step-icon-bg">🚚</div>
      <h3 className="step-box-title">Enjoy Home Food</h3>
      <p className="step-box-text">Hot, nutritious tiffins delivered right to your doorstep daily.</p>
    </div>
  </div>
</section>
    </div>
  );
}

/* ================= REUSABLE COMPONENTS ================= */

function ProviderCard({ name, price }) {
  return (
    <div
      style={{
        background: "white",
        padding: "24px",
        borderRadius: "16px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
      }}
    >
      <h3 style={{ marginBottom: "8px" }}>{name}</h3>
      <p style={{ color: "#555" }}>{price}</p>
      <button
        style={{
          marginTop: "12px",
          padding: "10px 16px",
          background: "#c05a2b",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
        }}
      >
        View Menu
      </button>
    </div>
  );
}

function StepCard({ title, desc }) {
  return (
    <div
      style={{
        flex: 1,
        padding: "20px",
        borderRadius: "12px",
        background: "#f9f9f9",
      }}
    >
      <h3>{title}</h3>
      <p style={{ color: "#555" }}>{desc}</p>
    </div>
  );
}
const cardStyle = {
  background: "white",
  padding: "20px",
  borderRadius: "16px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
};

const buttonStyle = {
  marginTop: "10px",
  padding: "8px 14px",
  background: "#c05a2b",
  color: "white",
  border: "none",
  cursor: "pointer",
};

export default Landing;
