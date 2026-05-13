import { useEffect, useMemo, useState } from "react";
import api from "../api";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import "../styles/common.css";
import "../styles/StudentFindMeals.css";
import { dialDigitsForLink } from "../utils/phone";
import { readStudentGeo } from "../utils/studentGeo";

function isMenuVeg(m) {
  if (m.isVeg !== undefined) return Boolean(m.isVeg);
  return Number(m.is_veg) === 1;
}

export default function StudentFindMeals() {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const navigate = useNavigate();
  const { providerId } = useParams();

  const [menus, setMenus] = useState([]);
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [address, setAddress] = useState("");

  const [vegOnly, setVegOnly] = useState(false);
  const [maxPrice, setMaxPrice] = useState(300);
  const [budgetOnly, setBudgetOnly] = useState(false);
  const [premiumOnly, setPremiumOnly] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState("default");

  const [showSubscribe, setShowSubscribe] = useState(false);
  const [plan, setPlan] = useState("weekly");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    fetchProviderMenus();
    fetchStudentAddress();
  }, [providerId]);

  const fetchProviderMenus = async () => {
    try {
      setLoading(true);

      const res = await api.get(`/menus/provider/${providerId}`);
      setMenus(Array.isArray(res.data) ? res.data : []);

      const geo = readStudentGeo();
      const providerRes = await api.get("/providers/public", {
        params: geo
          ? { lat: geo.lat, lng: geo.lng, sort: "nearest" }
          : {},
      });
      const list = Array.isArray(providerRes.data) ? providerRes.data : [];
      const selected = list.find((p) => String(p.id) === String(providerId));
      setProvider(selected || null);
    } catch {
      alert("Failed to load menu");
      setMenus([]);
      setProvider(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentAddress = async () => {
    try {
      const res = await api.get("/auth/me");
      setAddress(res.data?.address || "");
    } catch {
      /* optional profile fetch */
    }
  };

  const saveAddress = async () => {
    try {
      await api.patch("/auth/me", { address: address.trim() });
      alert("Address saved");
    } catch {
      alert("Could not save address. Try again.");
    }
  };

  const callProvider = () => {
    const raw = provider?.phone;
    if (!raw) {
      alert("Phone number not available");
      return;
    }
    const digits = dialDigitsForLink(raw);
    window.location.href = digits ? `tel:+${digits}` : `tel:${raw}`;
  };

  const contactWhatsApp = () => {
    const raw = provider?.whatsapp || provider?.phone;
    if (!raw) {
      alert("WhatsApp number not available");
      return;
    }
    const digits = dialDigitsForLink(raw);
    if (!digits) {
      alert("WhatsApp number not available");
      return;
    }
    window.open(`https://wa.me/${digits}`, "_blank");
  };

  const placeOrder = async (menuId) => {
    try {
      if (!address.trim()) {
        alert("Please enter delivery address");
        return;
      }

      await api.post("/orders", {
        menuId,
        deliveryAddress: address.trim(),
      });

      alert("Order placed successfully!");
      navigate("/student/orders");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to place order");
    }
  };

  const submitSubscription = async () => {
    if (!startDate || !endDate) {
      alert("Please select start and end dates");
      return;
    }

    try {
      await api.post("/subscriptions", {
        providerId,
        plan,
        startDate,
        endDate,
      });

      alert("Subscription request sent!");
      setShowSubscribe(false);
      setStartDate("");
      setEndDate("");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to subscribe");
    }
  };

  const kitchenName = provider?.kitchenName ?? provider?.kitchen_name ?? "Kitchen";
  const locationText = provider?.location || "—";
  const providerRating = Number(provider?.rating ?? 0);

  const filteredMenus = useMemo(() => {
    let list = (menus || []).filter((m) => {
      const price = Number(m.price) || 0;
      if (vegOnly && !isMenuVeg(m)) return false;
      if (price > maxPrice) return false;
      if (budgetOnly && price > 100) return false;
      if (premiumOnly && price < 150) return false;
      if (minRating > 0 && providerRating < minRating) return false;
      return true;
    });

    const copy = [...list];
    if (sortBy === "price-asc") copy.sort((a, b) => Number(a.price) - Number(b.price));
    else if (sortBy === "price-desc") copy.sort((a, b) => Number(b.price) - Number(a.price));

    return copy;
  }, [
    menus,
    vegOnly,
    maxPrice,
    budgetOnly,
    premiumOnly,
    minRating,
    providerRating,
    sortBy,
  ]);

  if (!token || role !== "student") {
    return <Navigate to="/login" />;
  }

  if (loading) return <p style={{ padding: "20px" }}>Loading...</p>;

  return (
    <div className="find-meals-container">
      <header className="page-header">
        <div className="header-text">
          <p>{new Date().toDateString()}</p>
        </div>
      </header>

      {provider && (
        <div className="provider-hero-card">
          <div className="provider-hero-left">
            <h2 className="provider-hero-name">{kitchenName}</h2>

            <div className="provider-location-row">
              <span className="provider-hero-location">📍 {locationText}</span>
              <button type="button" className="mini-icon-btn" onClick={callProvider} title="Call">
                📞
              </button>
              <button type="button" className="mini-icon-btn" onClick={contactWhatsApp} title="WhatsApp">
                💬
              </button>
            </div>
            {provider?.distanceLabel ? (
              <p className="provider-distance-line">{provider.distanceLabel}</p>
            ) : null}

            <div className="provider-status-row">
              <span className={`provider-status-pill ${provider.isActive !== false ? "on" : "off"}`}>
                {provider.isActive !== false ? "● Active kitchen" : "○ Inactive"}
              </span>
              {provider.vegOnly ? <span className="provider-veg-pill">Veg kitchen</span> : null}
            </div>

            <div className="rating-subscribe-row">
              {providerRating > 0 ? (
                <div className="provider-rating-badge">⭐ {providerRating.toFixed(1)}</div>
              ) : (
                <div className="provider-rating-badge provider-rating-new">New kitchen</div>
              )}

              <button type="button" className="subscribe-btn" onClick={() => setShowSubscribe(true)}>
                Subscribe
              </button>
            </div>
          </div>

          <div className="delivery-box">
            <label>Delivery Address</label>

            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Room No, Hostel..."
              className="delivery-input"
            />

            <button type="button" className="save-address-btn" onClick={saveAddress}>
              Save Address
            </button>
          </div>
        </div>
      )}

      <div className="filters-row">
        <h3>Your Menu</h3>

        <div className="filter-controls">
          <div className="price-filter">
            <label>Max Price: ₹{maxPrice}</label>
            <input
              type="range"
              min="30"
              max="300"
              step="10"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
            />
          </div>

          <div className="filter-sort-group">
            <label className="filter-label-inline">Sort</label>
            <select
              className="filter-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="default">Default</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
            </select>
          </div>

          <div className="filter-sort-group">
            <label className="filter-label-inline">Min rating</label>
            <select
              className="filter-select"
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
            className={`filter-pill ${vegOnly ? "active" : ""}`}
            onClick={() => setVegOnly(!vegOnly)}
          >
            Veg only
          </button>

          <button
            type="button"
            className={`filter-pill ${budgetOnly ? "active" : ""}`}
            onClick={() => {
              setBudgetOnly(!budgetOnly);
              if (!budgetOnly) setPremiumOnly(false);
            }}
          >
            Budget (≤ ₹100)
          </button>

          <button
            type="button"
            className={`filter-pill ${premiumOnly ? "active" : ""}`}
            onClick={() => {
              setPremiumOnly(!premiumOnly);
              if (!premiumOnly) setBudgetOnly(false);
            }}
          >
            Premium (≥ ₹150)
          </button>
        </div>
      </div>

      {showSubscribe && (
        <div className="subscribe-modal-overlay" onClick={() => setShowSubscribe(false)}>
          <div className="subscribe-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Subscribe</h3>
            <select value={plan} onChange={(e) => setPlan(e.target.value)}>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
            <label>Start</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <label>End</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            <div className="subscribe-modal-actions">
              <button type="button" className="order-btn" onClick={submitSubscription}>
                Submit
              </button>
              <button type="button" className="save-address-btn" onClick={() => setShowSubscribe(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="menu-grid">
        {filteredMenus.length === 0 ? (
          <p className="menu-empty-hint">No meals match these filters.</p>
        ) : (
          filteredMenus.map((menu) => {
            const veg = isMenuVeg(menu);
            const mealType = menu.mealType ?? menu.meal_type ?? "";
            const imgSrc =
              menu.image ||
              "https://images.unsplash.com/photo-1546069901-ba9599a7e63c";

            return (
              <div key={menu.id} className="menu-card">
                <div className="card-image-wrapper">
                  <img src={imgSrc} alt={menu.items || "Meal"} className="menu-image" loading="lazy" />

                  <span className={`diet-badge ${veg ? "veg" : "non-veg"}`}>
                    {veg ? "Veg" : "Non-Veg"}
                  </span>
                </div>

                <div className="card-content">
                  <h3 className="menu-title">{menu.items || "Meal"}</h3>
                  <p className="menu-meta">
                    {mealType} • {menu.day}
                  </p>

                  <div className="card-footer">
                    <span className="menu-price">₹{Number(menu.price) || 0}</span>
                    <button type="button" className="order-btn" onClick={() => placeOrder(menu.id)}>
                      Order Now
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
