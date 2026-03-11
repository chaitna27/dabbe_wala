import { useEffect, useState } from "react";
import api from "../api";
import { Navigate } from "react-router-dom";
import "../styles/StudentOrders.css";

function StudentOrders() {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  // 🔐 Protection
  if (!token || role !== "student") {
    return <Navigate to="/login" />;
  }

  const [orders, setOrders] = useState([]);

  // ⭐ Reviews state per order
  const [reviews, setReviews] = useState({});

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await api.get("/orders/student");
      setOrders(res.data);
    } catch {
      alert("Failed to load orders");
    }
  };

  const cancelOrder = async (orderId) => {
    if (!window.confirm("Cancel this order?")) return;

    try {
      await api.delete(`/orders/${orderId}`);
      alert("Order cancelled");
      fetchOrders();
    } catch {
      alert("Cannot cancel order");
    }
  };

  // ⭐ Update review state per order
  const updateReview = (orderId, field, value) => {
    setReviews((prev) => ({
      ...prev,
      [orderId]: {
        ...prev[orderId],
        [field]: value,
      },
    }));
  };

  // ⭐ Submit review
  const submitReview = async (orderId) => {
    const review = reviews[orderId];

    if (!review || !review.rating) {
      alert("Please select a rating");
      return;
    }

    if (!review.comment || review.comment.trim().length < 5) {
      alert("Please write a meaningful review (at least 5 characters)");
      return;
    }

    try {
      await api.post("/reviews", {
        order_id: orderId,
        rating: review.rating,
        comment: review.comment.trim(),
      });

      alert("Review submitted successfully!");

      // clear only this order review
      setReviews((prev) => {
        const copy = { ...prev };
        delete copy[orderId];
        return copy;
      });

      fetchOrders();
    } catch {
      alert("Failed to submit review");
    }
  };

  const statusColor = (status) => {
    if (status === "pending") return "orange";
    if (status === "accepted") return "blue";
    if (status === "delivered") return "green";
    return "red";
  };

return (
  <div className="orders-container">
    <h2 className="orders-title">My Orders</h2>

    {orders.length === 0 ? (
      <p>No orders yet</p>
    ) : (
      <div className="orders-grid">
        {orders.map((order) => {
          const current = reviews[order.order_id] || {};

          return (
            <div key={order.order_id} className="order-card">

              {/* 🔹 ORDER ID TOP RIGHT */}
              <div className="order-id">
                #{order.order_id}
              </div>

              <h3 className="order-items">{order.items}</h3>

              <p className="order-meta">
                ₹{order.price} • {order.provider_name}
              </p>

              <p className="order-date">
                Ordered on{" "}
                {new Date(order.order_date).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>

              {/* 🔹 STATUS + ACTION ROW */}
              <div className="status-row">

                <div className={`status-badge ${order.status}`}>
                 {order.status}
                </div>

               {order.status === "pending" && (
                  <button
                    className="cancel-btn"
                   onClick={() => cancelOrder(order.order_id)}
                  >
                   Cancel Order
                  </button>
                )}

               {order.status === "delivered" && order.reviewed === 1 && (
                 <span className="reviewed-text">
                    ✓ Reviewed
                 </span>
                )}

              </div>
              
              {/* ⭐ REVIEW SECTION */}
              {order.status === "delivered" && order.reviewed !== 1 && (
                <div className="review-section">
                  <b>Rate this order</b>

                  <div className="stars-row">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={
                          star <= (current.hover || current.rating || 0)
                            ? "star active"
                            : "star"
                        }
                        onClick={() =>
                          updateReview(order.order_id, "rating", star)
                        }
                        onMouseEnter={() =>
                          updateReview(order.order_id, "hover", star)
                        }
                        onMouseLeave={() =>
                          updateReview(order.order_id, "hover", 0)
                        }
                      >
                        ★
                      </span>
                    ))}
                  </div>

                  <textarea
                    placeholder="Write your review..."
                    value={current.comment || ""}
                    onChange={(e) =>
                      updateReview(
                        order.order_id,
                        "comment",
                        e.target.value
                      )
                    }
                    className="review-input"
                  />

                  <button
                    onClick={() => submitReview(order.order_id)}
                    className="submit-review-btn"
                  >
                    Submit Review
                  </button>
                </div>
              )}

              {order.reviewed === 1 && (
                <p className="reviewed-text">
                  ✅ You already reviewed this order
                </p>
              )}
            </div>
          );
        })}
      </div>
    )}
  </div>
);

}

export default StudentOrders;



