import { useEffect, useState } from "react";
import api from "../api";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import "../styles/common.css";           // Existing styles
import "../styles/StudentFindMeals.css";  // New specific styles

export default function StudentFindMeals() {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const navigate = useNavigate();
  const { providerId } = useParams();

  // 🔐 Student protection
  if (!token || role !== "student") {
    return <Navigate to="/login" />;
  }

  const [menus, setMenus] = useState([]);
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [address, setAddress] = useState("");

  // 🔍 Filters
  const [vegOnly, setVegOnly] = useState(false);
  const [maxPrice, setMaxPrice] = useState(300);

  // 📦 Subscription
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
      setMenus(res.data);

      const providerRes = await api.get("/providers/public");
      const selected = providerRes.data.find(
        (p) => String(p.id) === String(providerId)
      );
      setProvider(selected || null);
    } catch {
      alert("Failed to load menu");
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentAddress = async () => {
    try {
      const res = await api.get("/auth/me");
      setAddress(res.data.address || "");
    } catch {
      console.log("Could not fetch student address");
    }
  };


  // 📞 Call provider
  const callProvider = () => {
    if (!provider?.phone) {
      alert("Phone number not available");
      return;
    }
    window.location.href = `tel:+91${provider.phone}`;
  };

  // 📲 WhatsApp
  const contactWhatsApp = () => {
    if (!provider?.whatsapp) {
      alert("WhatsApp number not available");
      return;
    }
    window.open(`https://wa.me/91${provider.whatsapp}`, "_blank");
  };

  const placeOrder = async (menuId) => {
    try {
      if (!address.trim()) {
        alert("Please enter delivery address");
        return;
      }
      
      await api.post("/orders", {
        menu_id: menuId,
        delivery_address: address,
      });

      alert("Order placed successfully!");
      navigate("/student/orders");
    } catch {
      alert("Failed to place order");
    }
  };

  // 📦 Submit subscription
  const submitSubscription = async () => {
    if (!startDate || !endDate) {
      alert("Please select start and end dates");
      return;
    }

    try {
      await api.post("/subscriptions", {
        provider_id: providerId,
        plan,
        start_date: startDate,
        end_date: endDate,
      });

      alert("Subscription request sent!");
      setShowSubscribe(false);
      setStartDate("");
      setEndDate("");
    } catch {
      alert("Failed to subscribe");
    }
  };

  // 🔍 Apply filters
  const filteredMenus = menus.filter((m) => {
    if (vegOnly && Number(m.is_veg) !== 1) return false;
    if (Number(m.price) > maxPrice) return false;
    return true;
  });


  if (loading) return <p style={{ padding: "20px" }}>Loading...</p>;

  return (
    <div className="find-meals-container">
      {/* HEADER SECTION - Matches the "Welcome" style */}
      <header className="page-header">
        <div className="header-text">
          <p>{new Date().toDateString()}</p>
        </div>      
      </header>
      


    {provider && (
  <div className="provider-hero-card">

    {/* LEFT SIDE */}
    <div className="provider-hero-left">

      <h2 className="provider-hero-name">
        {provider.kitchen_name}
      </h2>

      <div className="provider-location-row">
        <span className="provider-hero-location">
          📍 {provider.location}
        </span>

        {provider.phone && (
          <button className="mini-icon-btn" onClick={callProvider}>
            📞
          </button>
        )}

        {provider.whatsapp && (
          <button className="mini-icon-btn" onClick={contactWhatsApp}>
            💬
          </button>
        )}
      </div>

      {/* Rating (optional, won’t break layout) */}
      <div className="rating-subscribe-row">
        {Number(provider.rating) > 0 && (
          <div className="provider-rating-badge">
            ⭐ {Number(provider.rating).toFixed(1)}
          </div>
        )}

        <button
          className="subscribe-btn"
          onClick={() => setShowSubscribe(true)}
       >
          Subscribe
        </button>
      </div>
      



    </div>


    {/* RIGHT SIDE - DELIVERY ADDRESS */}
    <div className="delivery-box">
      <label>Delivery Address</label>

      <textarea
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder="Room No, Hostel..."
        className="delivery-input"
      />

      <button
        className="save-address-btn"
        onClick={() => alert("Address saved locally")}
      >
        Save Address
      </button>
    </div>

  </div>
)}


      
      {/* FILTER SECTION */}
      <div className="filters-row">
        <h3>Your Menu</h3>

        <div className="filter-controls">

         {/* 💰 Price Filter */}
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

          {/* 🌱 Veg Filter */}
          <button
            className={`filter-pill ${vegOnly ? "active" : ""}`}
            onClick={() => setVegOnly(!vegOnly)}
         >
            Veg Only
         </button>

        </div>
      </div>
      

      {/* MEALS GRID - This creates the 2-per-line layout */}
      <div className="menu-grid">
        {filteredMenus.map((menu) => (
          <div key={menu.id} className="menu-card">

            <div className="card-image-wrapper">
              <img
                src={
                  menu.image ||
                  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c"
                }
                alt="food"
                className="menu-image"
              />

              <span
                className={`diet-badge ${
                  Number(menu.is_veg) === 1 ? "veg" : "non-veg"
                }`}
              >
                {Number(menu.is_veg) === 1 ? "Veg" : "Non-Veg"}
              </span>
              
            </div>

            <div className="card-content">
              <h3 className="menu-title">{menu.items}</h3>
              <p className="menu-meta">
                {menu.meal_type} • {menu.day}
              </p>

              <div className="card-footer">
                <span className="menu-price">₹{menu.price}</span>
                <button
                  className="order-btn"
                  onClick={() => placeOrder(menu.id)}
                >
                  Order Now
                </button>
              </div>
            </div>

          </div>
        ))}
      </div>
    
    </div>
  );
}
