import { useState } from "react";
import api from "../api";
import { Navigate } from "react-router-dom";

function CreateOrder() {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  // 🔐 Protect page
  if (!token || role !== "student") {
    return <Navigate to="/login" />;
  }

  const [foodName, setFoodName] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!foodName.trim()) {
      alert("Enter food name");
      return;
    }

    try {
      await api.post("/orders", {
        food_name: foodName,
      });

      alert("Order placed successfully");
      setFoodName("");
    } catch (err) {
      alert("Failed to place order");
    }
  };

  return (
    <div>
      <h2>Create Order</h2>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Food name"
          value={foodName}
          onChange={(e) => setFoodName(e.target.value)}
        />

        <br /><br />

        <button type="submit">Place Order</button>
      </form>
    </div>
  );
}

export default CreateOrder;
