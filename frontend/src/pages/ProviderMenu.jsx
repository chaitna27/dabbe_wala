import { useEffect, useState, useCallback } from "react";
import api from "../api";
import { Navigate } from "react-router-dom";
import "../styles/ProviderMenu.css";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function capitalizeWords(s) {
  if (!s) return "";
  return String(s)
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function showMenuError(err) {
  const msg =
    err?.response?.data?.message ||
    (typeof err?.response?.data === "string" ? err.response.data : null) ||
    err?.message ||
    "Something went wrong";
  return msg;
}

export default function ProviderMenu() {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  const [menus, setMenus] = useState([]);
  const [loadingMenus, setLoadingMenus] = useState(true);
  const [day, setDay] = useState("Monday");
  const [mealType, setMealType] = useState("Lunch");
  const [items, setItems] = useState("");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [editItems, setEditItems] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editImage, setEditImage] = useState(null);
  const [editAvailable, setEditAvailable] = useState(true);

  const [adding, setAdding] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [toast, setToast] = useState(null);
  const [bannerError, setBannerError] = useState("");

  const fetchMenus = useCallback(async () => {
    setLoadingMenus(true);
    setBannerError("");
    try {
      const res = await api.get("/menus/provider");
      setMenus(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setBannerError(showMenuError(err));
      setMenus([]);
    } finally {
      setLoadingMenus(false);
    }
  }, []);

  useEffect(() => {
    fetchMenus();
  }, [fetchMenus]);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const handleAddMenu = async () => {
    setBannerError("");
    if (!items.trim()) {
      setToast({ type: "error", message: "Please describe the food items." });
      return;
    }
    if (price === "" || Number(price) < 0 || !Number.isFinite(Number(price))) {
      setToast({ type: "error", message: "Enter a valid price." });
      return;
    }
    if (!image) {
      setToast({ type: "error", message: "Please select an image." });
      return;
    }

    try {
      setAdding(true);
      const formData = new FormData();
      formData.append("day", day);
      formData.append("meal_type", mealType);
      formData.append("items", items.trim());
      formData.append("price", Number(price));
      formData.append("image", image);

      await api.post("/menus", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setToast({ type: "success", message: "Menu item added successfully." });
      setItems("");
      setPrice("");
      setImage(null);
      fetchMenus();
    } catch (err) {
      setToast({ type: "error", message: showMenuError(err) });
    } finally {
      setAdding(false);
    }
  };

  const deleteMenu = async (menuId) => {
    if (!window.confirm("Delete this menu item?")) return;
    setBannerError("");
    try {
      setBusyId(menuId);
      await api.delete(`/menus/${menuId}`);
      setToast({ type: "success", message: "Menu item deleted." });
      fetchMenus();
    } catch (err) {
      setToast({ type: "error", message: showMenuError(err) });
    } finally {
      setBusyId(null);
    }
  };

  const updateMenu = async (menuId) => {
    setBannerError("");
    try {
      setBusyId(menuId);
      const formData = new FormData();
      formData.append("items", editItems.trim());
      formData.append("price", Number(editPrice));
      formData.append("is_available", editAvailable ? "1" : "0");

      if (editImage) {
        formData.append("image", editImage);
      }

      await api.put(`/menus/${menuId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setToast({ type: "success", message: "Menu updated." });
      setEditingId(null);
      setEditImage(null);
      fetchMenus();
    } catch (err) {
      setToast({ type: "error", message: showMenuError(err) });
    } finally {
      setBusyId(null);
    }
  };

  const toggleAvailability = async (m) => {
    setBannerError("");
    try {
      setBusyId(m.id);
      const formData = new FormData();
      formData.append("items", m.items);
      formData.append("price", String(m.price));
      formData.append("is_available", m.isAvailable ? "0" : "1");

      await api.put(`/menus/${m.id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setToast({
        type: "success",
        message: m.isAvailable ? "Marked unavailable for students." : "Marked available.",
      });
      fetchMenus();
    } catch (err) {
      setToast({ type: "error", message: showMenuError(err) });
    } finally {
      setBusyId(null);
    }
  };

  if (!token || role !== "provider") {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="pm-page">
      <div className="pm-inner">
        <header className="pm-hero">
          <h1>Your kitchen menu</h1>
          <p>Add meals by day, set prices, upload photos, and control what students can order.</p>
        </header>

        {bannerError ? (
          <div className="pm-alert pm-alert-error" role="alert">
            {bannerError}
          </div>
        ) : null}

        <section className="pm-form-card" aria-labelledby="add-menu-title">
          <h2 id="add-menu-title" className="pm-form-title">
            Add a menu item
          </h2>
          <div className="pm-form-grid">
            <label className="pm-label">
              Day
              <select className="pm-select" value={day} onChange={(e) => setDay(e.target.value)}>
                {DAYS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </label>
            <label className="pm-label">
              Meal
              <select
                className="pm-select"
                value={mealType}
                onChange={(e) => setMealType(e.target.value)}
              >
                <option value="Breakfast">Breakfast</option>
                <option value="Lunch">Lunch</option>
                <option value="Dinner">Dinner</option>
              </select>
            </label>
            <label className="pm-label" style={{ gridColumn: "1 / -1" }}>
              <span>
                Items <span className="hint">comma-separated list is fine</span>
              </span>
              <input
                className="pm-input"
                placeholder="e.g. Dal, rice, sabzi, roti"
                value={items}
                onChange={(e) => setItems(e.target.value)}
              />
            </label>
            <label className="pm-label">
              Price (₹)
              <input
                className="pm-input"
                type="number"
                min="0"
                step="1"
                placeholder="80"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </label>
            <label className="pm-label" style={{ gridColumn: "1 / -1" }}>
              Food photo
              <span className="pm-file-row">
                <input
                  className="pm-file-input"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImage(e.target.files?.[0] || null)}
                />
                {image ? (
                  <img className="pm-preview" src={URL.createObjectURL(image)} alt="" />
                ) : null}
              </span>
            </label>
          </div>
          <button type="button" className="pm-submit" onClick={handleAddMenu} disabled={adding}>
            {adding ? (
              <>
                <span className="pm-spinner" aria-hidden />
                Adding…
              </>
            ) : (
              "Add to menu"
            )}
          </button>
        </section>

        <div className="pm-section-head">
          <h2>Your dishes</h2>
        </div>

        {loadingMenus ? (
          <div className="pm-skeleton-grid" aria-busy="true" aria-label="Loading menu">
            <div className="pm-skel" />
            <div className="pm-skel" />
            <div className="pm-skel" />
          </div>
        ) : menus.length === 0 ? (
          <div className="pm-empty">
            <div className="pm-empty-icon" aria-hidden>
              🍱
            </div>
            <h3>No dishes yet</h3>
            <p>Your first meal card will show up here — add a photo and you are ready to serve.</p>
          </div>
        ) : (
          <div className="pm-grid-cards">
            {menus.map((m) => (
              <article key={m.id} className="pm-card">
                <div className="pm-card-img-wrap">
                  {m.image ? (
                    <img className="pm-card-img" src={m.image} alt="" />
                  ) : (
                    <div className="pm-card-img pm-card-img-ph" aria-hidden>
                      🍽️
                    </div>
                  )}
                  <div className="pm-badges">
                    <span className="pm-badge pm-badge-day">{capitalizeWords(m.day)}</span>
                    <span className="pm-badge pm-badge-meal">
                      {capitalizeWords(m.mealType ?? "")}
                    </span>
                    {m.isVeg ? (
                      <span className="pm-badge pm-badge-veg">
                        Veg
                      </span>
                    ) : (
                      <span className="pm-badge pm-badge-nonveg">Non-veg</span>
                    )}
                  </div>
                </div>
                <div className="pm-card-body">
                  <h3 className="pm-card-title">{m.items}</h3>
                  <p className="pm-card-desc">
                    {capitalizeWords(m.mealType ?? "")} · {capitalizeWords(m.day)}
                  </p>
                  <div className="pm-card-meta">
                    <span className="pm-price">₹{m.price}</span>
                    <label className="pm-toggle">
                      <span>{m.isAvailable ? "Available" : "Hidden"}</span>
                      <button
                        type="button"
                        className={`pm-switch ${m.isAvailable ? "pm-switch-on" : "pm-switch-off"}`}
                        onClick={() => toggleAvailability(m)}
                        disabled={busyId === m.id || editingId === m.id}
                        aria-pressed={m.isAvailable}
                        aria-label={m.isAvailable ? "Mark unavailable" : "Mark available"}
                      />
                    </label>
                  </div>

                  {editingId === m.id ? (
                    <div className="pm-edit-panel">
                      <label className="pm-label">
                        Items
                        <input
                          className="pm-input"
                          value={editItems}
                          onChange={(e) => setEditItems(e.target.value)}
                        />
                      </label>
                      <label className="pm-label">
                        Price
                        <input
                          className="pm-input"
                          type="number"
                          min="0"
                          value={editPrice}
                          onChange={(e) => setEditPrice(e.target.value)}
                        />
                      </label>
                      <label className="pm-label">
                        <span className="hint">Replace image (optional)</span>
                        <input
                          className="pm-file-input"
                          type="file"
                          accept="image/*"
                          onChange={(e) => setEditImage(e.target.files?.[0] || null)}
                        />
                      </label>
                      <label className="pm-toggle" style={{ marginTop: 4 }}>
                        <span>Available to students</span>
                        <button
                          type="button"
                          className={`pm-switch ${editAvailable ? "pm-switch-on" : "pm-switch-off"}`}
                          onClick={() => setEditAvailable((v) => !v)}
                          aria-pressed={editAvailable}
                        />
                      </label>
                      <div className="pm-edit-actions">
                        <button
                          type="button"
                          className="pm-btn pm-btn-save"
                          onClick={() => updateMenu(m.id)}
                          disabled={busyId === m.id}
                        >
                          {busyId === m.id ? "Saving…" : "Save changes"}
                        </button>
                        <button
                          type="button"
                          className="pm-btn pm-btn-cancel"
                          onClick={() => {
                            setEditingId(null);
                            setEditImage(null);
                          }}
                          disabled={busyId === m.id}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="pm-card-actions">
                      <button
                        type="button"
                        className="pm-btn pm-btn-edit"
                        onClick={() => {
                          setEditingId(m.id);
                          setEditItems(m.items);
                          setEditPrice(String(m.price));
                          setEditImage(null);
                          setEditAvailable(Boolean(m.isAvailable));
                        }}
                        disabled={busyId === m.id}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="pm-btn pm-btn-del"
                        onClick={() => deleteMenu(m.id)}
                        disabled={busyId === m.id}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {toast ? (
        <div className={`pm-toast pm-toast-${toast.type}`} role="status">
          {toast.message}
        </div>
      ) : null}
    </div>
  );
}
