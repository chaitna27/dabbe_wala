import { useEffect, useState } from "react";
import api from "../api";
import { Navigate } from "react-router-dom";

export default function ProviderOrders() {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token || role !== "provider") {
    return <Navigate to="/login" />;
  }

  const [orders, setOrders] = useState([]);

  const fetchOrders = async () => {
    try {
      const res = await api.get("/orders/provider");
      setOrders(res.data);
    } catch {
      alert("Failed to fetch provider orders");
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const updateStatus = async (orderId, status) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status });
      fetchOrders();
    } catch {
      alert("Failed to update order");
    }
  };

  return (
    <div className="container">
      <h2>Incoming Orders 📦</h2>

      {orders.length === 0 ? (
        <p>No orders yet</p>
      ) : (
        orders.map((order) => (
          <div
            key={order.order_id}
            style={{
              border: "1px solid #ccc",
              padding: "12px",
              marginBottom: "10px",
              borderRadius: "6px",
            }}
          >
            <p><b>Student:</b> {order.student_name}</p>
            <p><b>Items:</b> {order.items}</p>
            <p><b>Price:</b> ₹{order.price}</p>
            <p><b>Delivery Address:</b> {order.delivery_address}</p>
            <p><b>Status:</b> {order.status}</p>

            {order.status === "pending" && (
              <>
                <button onClick={() => updateStatus(order.order_id, "accepted")}>
                  Accept
                </button>{" "}
                <button onClick={() => updateStatus(order.order_id, "rejected")}>
                  Reject
                </button>
              </>
            )}

            {order.status === "accepted" && (
              <button onClick={() => updateStatus(order.order_id, "delivered")}>
                Mark Delivered
              </button>
            )}
          </div>
        ))
      )}
    </div>
  );
}


