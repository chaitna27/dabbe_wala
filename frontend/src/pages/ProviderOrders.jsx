import { useEffect, useState } from "react";
import api from "../api";
import { Navigate } from "react-router-dom";

export default function ProviderOrders() {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  // ── All hooks MUST be declared before any conditional return ──
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

  // ── Auth guard after hooks ──
  if (!token || role !== "provider") {
    return <Navigate to="/login" />;
  }

  const updateStatus = async (orderId, status) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status });
      fetchOrders();
    } catch {
      alert("Failed to update order");
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      padding: "88px 24px 56px",
      background: "linear-gradient(165deg, #fff9f2 0%, #ffeedd 45%, #fffdfb 100%)",
    }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#3d2914", marginBottom: 28 }}>
          Incoming Orders 📦
        </h2>

        {orders.length === 0 ? (
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 380,
            borderRadius: 20,
            border: "2px dashed #e8d5c4",
            background: "#fff",
            textAlign: "center",
            padding: "48px 24px",
          }}>
            <div style={{
              fontSize: "3rem",
              marginBottom: 16,
              background: "linear-gradient(135deg, rgba(224,120,48,0.15), rgba(61,41,20,0.08))",
              borderRadius: "50%",
              width: 80,
              height: 80,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              📦
            </div>
            <h3 style={{ margin: "0 0 8px", fontSize: "1.2rem", fontWeight: 700, color: "#3d2914" }}>
              No orders yet
            </h3>
            <p style={{ margin: 0, color: "#8d6e63", fontSize: "0.95rem", maxWidth: 340 }}>
              When students place orders from your kitchen, they will appear here.
            </p>
          </div>
        ) : (
          orders.map((order) => (
            <div
              key={order.order_id}
              style={{
                border: "1px solid #e8d5c4",
                padding: "16px 20px",
                marginBottom: 14,
                borderRadius: 14,
                background: "#fff",
                boxShadow: "0 4px 16px rgba(61,41,20,0.06)",
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
    </div>
  );
}
