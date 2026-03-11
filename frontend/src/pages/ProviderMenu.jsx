import { useEffect, useState } from "react";
import api from "../api";
import { Navigate } from "react-router-dom";

export default function ProviderMenu() {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token || role !== "provider") {
    return <Navigate to="/login" />;
  }

  const [menus, setMenus] = useState([]);
  const [day, setDay] = useState("Monday");
  const [mealType, setMealType] = useState("Lunch");
  const [items, setItems] = useState("");
  const [price, setPrice] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editItems, setEditItems] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [image, setImage] = useState(null);
  const [editImage, setEditImage] = useState(null);



  const fetchMenus = async () => {
    try {
      const res = await api.get("/menus/provider");
      setMenus(res.data);
    } catch (err) {
      console.error(err);
      alert("Failed to fetch menus");
    }
  };

  useEffect(() => {
    fetchMenus();
  }, []);

  const handleAddMenu = async () => {
    if (!image) {
      alert("Please select an image");
      return;
    }
  
    try {
      const formData = new FormData();
      formData.append("day", day);
      formData.append("meal_type", mealType);
      formData.append("items", items);
      formData.append("price", Number(price));
      formData.append("image", image);
  
      await api.post("/menus", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      alert("Menu added ✅");
      setItems("");
      setPrice("");
      setImage(null);
      fetchMenus();
    } catch (err) {
      console.error("ADD MENU ERROR:", err.response?.data || err);
      alert("Failed to add menu");
    }
  };


  const deleteMenu = async (menuId) => {
    if (!window.confirm("Delete this menu?")) return;
    try {
      await api.delete(`/menus/${menuId}`);
      alert("Menu deleted");
      fetchMenus();
    } catch (err) {
      alert("Failed to delete menu");
    }
  };

  const updateMenu = async (menuId) => {
  try {
    const formData = new FormData();
    formData.append("items", editItems);
    formData.append("price", Number(editPrice));
    formData.append("is_available", 1);

    if (editImage) {
      formData.append("image", editImage);
    }

    await api.put(`/menus/${menuId}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    alert("Menu updated ✅");
    setEditingId(null);
    setEditImage(null);
    fetchMenus();
  } catch (err) {
    console.error("UPDATE ERROR:", err.response?.data || err);
    alert("Failed to update menu");
  }
};



  return (
    <div className="container">
      <h2>Add Menu</h2>

      <select value={day} onChange={(e) => setDay(e.target.value)}>
        {["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].map(d => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>

      <select value={mealType} onChange={(e) => setMealType(e.target.value)}>
        <option value="Breakfast">Breakfast</option>
        <option value="Lunch">Lunch</option>
        <option value="Dinner">Dinner</option>
      </select>

      <input
        placeholder="Items (comma separated)"
        value={items}
        onChange={(e) => setItems(e.target.value)}
      />

      <input
        type="number"
        placeholder="Price"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
      />
      
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setImage(e.target.files[0])}
      />

      {image && (
        <img
          src={URL.createObjectURL(image)}
          alt="preview"
          style={{
            width: "120px",
            height: "120px",
            objectFit: "cover",
            marginTop: "10px",
            borderRadius: "8px"
          }}
        />
      )}



      <button onClick={handleAddMenu}>Add Menu</button>

      <hr />

      <h3>My Menus</h3>
      {menus.length === 0 ? (
        <p>No menus yet</p>
      ) : (
        <ul>
          {menus.map((m) => (
            <li key={m.id} style={{ marginBottom: "10px" }}>
            <b>{m.day}</b> ({m.meal_type}) –

            {editingId === m.id ? (
              <>
                <input
                  value={editItems}
                  onChange={(e) => setEditItems(e.target.value)}
                  style={{ marginLeft: "6px" }}
                />

                <input
                  type="number"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  style={{ width: "80px", marginLeft: "6px" }}
                />

                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setEditImage(e.target.files[0])}
                  style={{ marginLeft: "6px" }}
                />
                
                <button onClick={() => updateMenu(m.id)}>Save</button>
                <button onClick={() => setEditingId(null)}>Cancel</button>
              </>
            ) : (
              <>
                {m.image && (
                  <div style={{ marginTop: "6px" }}>
                    <img
                    src={m.image}
                    alt="menu"
                      style={{
                        width: "120px",
                        height: "120px",
                        objectFit: "cover",
                        borderRadius: "8px",
                        marginBottom: "6px"
                      }}
                    />
                  </div>
                )}

              {m.items} – ₹{m.price}


                <button
                  onClick={() => {
                    setEditingId(m.id);
                    setEditItems(m.items);
                    setEditPrice(m.price);
                  }}
                  style={{ marginLeft: "10px" }}
                >
                  Edit
                </button>

                <button
                  onClick={() => deleteMenu(m.id)}
                  style={{ marginLeft: "6px" }}
                >
                  Delete
                </button>
              </>
            )}
          </li>

          ))}
        </ul>
      )}
    </div>
  );
}
