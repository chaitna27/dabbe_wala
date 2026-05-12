import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";

function CreateOrder() {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const navigate = useNavigate();

  const [foodName, setFoodName] = useState("");

  if (!token || role !== "student") {
    return <Navigate to="/login" />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    navigate("/student/find-meals");
  };

  return (
    <div className="container" style={{ padding: "24px" }}>
      <h2>Create Order</h2>
      <p style={{ color: "#555", maxWidth: "520px" }}>
        Orders are placed from a kitchen&apos;s menu so portions and pricing stay accurate. Browse providers,
        open a menu, and tap <b>Order Now</b> on the meal you want.
      </p>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Optional note (not sent yet)"
          value={foodName}
          onChange={(e) => setFoodName(e.target.value)}
          style={{ width: "100%", maxWidth: "400px", padding: "8px" }}
        />

        <br />
        <br />

        <button type="submit" style={{ background: "#c05a2b", color: "#fff", border: "none", padding: "10px 16px", borderRadius: "8px", cursor: "pointer" }}>
          Go to Find Meals
        </button>
      </form>
    </div>
  );
}

export default CreateOrder;
