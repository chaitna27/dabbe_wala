import { useEffect, useState } from "react";
import api from "../api";
import { Navigate } from "react-router-dom";

function orderStatusBadge(status) {
  const base =
    "inline-flex shrink-0 items-center rounded-full px-3 py-1 text-xs font-semibold capitalize tracking-wide ring-1 ring-inset";
  switch (status) {
    case "pending":
      return `${base} bg-amber-50 text-amber-900 ring-amber-600/20`;
    case "accepted":
      return `${base} bg-sky-50 text-sky-900 ring-sky-600/15`;
    case "delivered":
      return `${base} bg-emerald-50 text-emerald-800 ring-emerald-600/15`;
    case "rejected":
      return `${base} bg-red-50 text-red-800 ring-red-600/15`;
    default:
      return `${base} bg-stone-100 text-stone-700 ring-stone-500/10`;
  }
}

function OrdersSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="animate-pulse rounded-xl border border-stone-200/90 bg-white/95 p-6 shadow-card"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="h-6 w-[45%] rounded-lg bg-stone-200" />
            <div className="h-7 w-20 rounded-full bg-stone-100" />
          </div>
          <div className="mt-4 h-4 w-full rounded bg-stone-100" />
          <div className="mt-2 h-4 w-[80%] rounded bg-stone-100" />
          <div className="mt-6 h-10 w-full rounded-xl bg-stone-100" />
        </div>
      ))}
    </div>
  );
}

export default function StudentOrders() {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const [orders, setOrders] = useState([]);
  const [reviews, setReviews] = useState({});
  const [loading, setLoading] = useState(true);

  const authorized = Boolean(token && role === "student");

  useEffect(() => {
    if (!authorized) {
      setLoading(false);
      return undefined;
    }

    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const res = await api.get("/orders/student");
        if (!cancelled) setOrders(Array.isArray(res.data) ? res.data : []);
      } catch {
        if (!cancelled) {
          alert("Failed to load orders");
          setOrders([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authorized]);

  const updateReview = (orderId, field, value) => {
    setReviews((prev) => ({
      ...prev,
      [orderId]: {
        ...prev[orderId],
        [field]: value,
      },
    }));
  };

  const cancelOrder = async (orderId) => {
    if (!window.confirm("Cancel this order?")) return;
    try {
      await api.delete(`/orders/${orderId}`);
      alert("Order cancelled");
      const res = await api.get("/orders/student");
      setOrders(Array.isArray(res.data) ? res.data : []);
    } catch {
      alert("Cannot cancel order");
    }
  };

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
        orderId,
        rating: review.rating,
        comment: review.comment.trim(),
      });
      alert("Review submitted successfully!");
      setReviews((prev) => {
        const copy = { ...prev };
        delete copy[orderId];
        return copy;
      });
      const res = await api.get("/orders/student");
      setOrders(Array.isArray(res.data) ? res.data : []);
    } catch {
      alert("Failed to submit review");
    }
  };

  if (!authorized) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-brand-cream via-white to-brand-sand/40 px-4 pb-16 pt-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10">
          <p className="mb-1 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-brand-orange-dark">
            <span aria-hidden className="text-lg">
              🍱
            </span>
            Your tiffins
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl">My orders</h1>
          <p className="mt-2 max-w-2xl text-sm text-stone-600 sm:text-base">
            Track status, dates, and amounts. Leave a review when your meal is delivered.
          </p>
        </header>

        {loading ? (
          <OrdersSkeleton />
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-stone-300/80 bg-white/85 px-6 py-20 text-center shadow-card backdrop-blur-sm">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-brand-orange/15 to-brand-teal/10 text-4xl">
              🥘
            </div>
            <h2 className="text-xl font-bold text-stone-900">No orders yet</h2>
            <p className="mt-2 max-w-md text-sm text-stone-600">
              When you order from a kitchen, it will show up here with live status updates.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {orders.map((order) => {
              const current = reviews[order.order_id] || {};
              const dateStr = new Date(order.order_date).toLocaleDateString("en-IN", {
                weekday: "short",
                day: "numeric",
                month: "short",
                year: "numeric",
              });

              return (
                <article
                  key={order.order_id}
                  className="group relative flex flex-col rounded-xl border border-stone-200/90 bg-white/95 p-6 shadow-card transition duration-300 hover:-translate-y-1 hover:border-brand-orange/25 hover:shadow-card-hover"
                >
                  <div className="absolute right-4 top-4 flex flex-col items-end gap-1.5">
                    {order.menu_image ? (
                      <img
                        src={order.menu_image}
                        alt={order.items || "Meal"}
                        style={{
                          width: 80,
                          height: 80,
                          objectFit: "cover",
                          borderRadius: 10,
                          flexShrink: 0,
                          boxShadow: "0 2px 10px rgba(0,0,0,0.10)",
                          border: "2px solid #f0e0d4",
                          display: "block",
                        }}
                      />
                    ) : null}
                    <span className="text-xs font-medium text-stone-400">
                      #{String(order.order_id).slice(-8)}
                    </span>
                  </div>

                  <h2 className="pr-24 text-lg font-bold leading-snug text-stone-900">
                    {order.items ?? "Meal"}
                  </h2>

                  <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-stone-600">
                    <span className="font-semibold text-brand-orange-dark">
                      ₹{order.price ?? "—"}
                    </span>
                    <span className="text-stone-300" aria-hidden>
                      •
                    </span>
                    <span className="font-medium text-stone-700">{order.provider_name ?? "Provider"}</span>
                  </div>

                  <p className="mt-2 text-xs text-stone-500">{dateStr}</p>

                  <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-stone-100 pt-4">
                    <span className={orderStatusBadge(order.status)}>{order.status}</span>
                    {order.status === "pending" ? (
                      <button
                        type="button"
                        onClick={() => cancelOrder(order.order_id)}
                        className="ml-auto rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-800 transition hover:bg-red-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2"
                      >
                        Cancel order
                      </button>
                    ) : null}
                    {order.status === "delivered" && order.reviewed ? (
                      <span className="ml-auto text-sm font-semibold text-emerald-700">✓ Reviewed</span>
                    ) : null}
                  </div>

                  {order.status === "delivered" && !order.reviewed ? (
                    <div className="mt-5 border-t border-stone-100 pt-5">
                      <p className="mb-3 flex items-center gap-2 text-sm font-bold text-stone-800">
                        <span aria-hidden>⭐</span>
                        Rate this order
                      </p>
                      <div className="flex gap-1" role="group" aria-label="Star rating">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            className={`rounded p-0.5 text-2xl transition ${
                              star <= (current.hover || current.rating || 0)
                                ? "text-amber-400 drop-shadow-sm"
                                : "text-stone-300 hover:text-amber-200"
                            }`}
                            onClick={() => updateReview(order.order_id, "rating", star)}
                            onMouseEnter={() => updateReview(order.order_id, "hover", star)}
                            onMouseLeave={() => updateReview(order.order_id, "hover", 0)}
                            aria-label={`${star} star${star > 1 ? "s" : ""}`}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                      <textarea
                        placeholder="Write your review..."
                        value={current.comment || ""}
                        onChange={(e) =>
                          updateReview(order.order_id, "comment", e.target.value)
                        }
                        rows={3}
                        className="mt-3 w-full resize-y rounded-xl border border-stone-200 bg-stone-50/50 px-3 py-2 text-sm text-stone-900 shadow-inner outline-none transition placeholder:text-stone-400 focus:border-brand-orange/50 focus:ring-2 focus:ring-brand-orange/20"
                      />
                      <button
                        type="button"
                        onClick={() => submitReview(order.order_id)}
                        className="mt-3 w-full rounded-xl bg-gradient-to-r from-brand-orange to-brand-orange-dark py-2.5 text-sm font-semibold text-white shadow-md transition hover:brightness-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2"
                      >
                        Submit review
                      </button>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
