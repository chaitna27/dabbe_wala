import { useEffect, useState } from "react";
import api from "../api";
import { Navigate, useNavigate } from "react-router-dom";

function formatDate(raw) {
  if (!raw) return "—";
  const d = new Date(raw);
  if (isNaN(d)) return raw;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function formatPlan(plan) {
  if (!plan) return "—";
  return String(plan).charAt(0).toUpperCase() + String(plan).slice(1).toLowerCase();
}

function statusBadge(status) {
  const styles = {
    pending:   { background: "#fff8e1", color: "#7a5c00", border: "1px solid #ffe082" },
    active:    { background: "#e8f5e9", color: "#1b5e20", border: "1px solid #a5d6a7" },
    rejected:  { background: "#ffebee", color: "#b71c1c", border: "1px solid #ef9a9a" },
    cancelled: { background: "#f5f5f5", color: "#616161", border: "1px solid #e0e0e0" },
  };
  const s = styles[status] || styles.cancelled;
  return {
    ...s,
    display: "inline-block",
    padding: "3px 12px",
    borderRadius: 999,
    fontSize: "0.75rem",
    fontWeight: 700,
    textTransform: "capitalize",
    letterSpacing: "0.04em",
  };
}

export default function ProviderSubscriptions() {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const navigate = useNavigate();

  // ── All hooks MUST be declared before any conditional return ──
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchSubs();
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  // ── Auth guard after hooks ──
  if (!token || role !== "provider") {
    return <Navigate to="/login" replace />;
  }

  const fetchSubs = async () => {
    setLoading(true);
    try {
      const res = await api.get("/subscriptions/provider");
      setSubs(Array.isArray(res.data) ? res.data : []);
    } catch {
      setToast({ type: "error", message: "Failed to load subscriptions" });
      setSubs([]);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    setBusyId(id);
    try {
      await api.patch(`/subscriptions/${id}/status`, { status });
      setToast({
        type: "success",
        message: status === "active" ? "Subscription approved." : "Subscription rejected.",
      });
      fetchSubs();
    } catch {
      setToast({ type: "error", message: "Failed to update status" });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      padding: "88px 24px 56px",
      background: "linear-gradient(165deg, #fff9f2 0%, #ffeedd 45%, #fffdfb 100%)",
    }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>

        {/* ── Header ── */}
        <header style={{ marginBottom: 32 }}>
          <p style={{
            margin: "0 0 4px",
            fontSize: "0.8rem",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "#c05a2b",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}>
            <span aria-hidden>🧾</span>
            Meal plans
          </p>
          <h1 style={{
            margin: "0 0 8px",
            fontSize: "clamp(1.55rem, 3vw, 2rem)",
            fontWeight: 800,
            color: "#3d2914",
            letterSpacing: "-0.02em",
          }}>
            Subscription Requests
          </h1>
          <p style={{ margin: 0, color: "#6b5344", fontSize: "0.95rem", maxWidth: "52ch", lineHeight: 1.55 }}>
            Review and approve meal plan requests from students.
          </p>
        </header>

        {/* ── Loading skeleton ── */}
        {loading ? (
          <div style={{ display: "grid", gap: 18, gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{
                borderRadius: 18,
                border: "1px solid #f0e0d4",
                background: "#fff",
                padding: 24,
                boxShadow: "0 6px 24px rgba(61,41,20,0.07)",
              }}>
                <div style={{ background: "#f5ebe3", borderRadius: 8, height: 20, width: "55%", marginBottom: 12 }} />
                <div style={{ background: "#fdf6f0", borderRadius: 6, height: 14, width: "80%", marginBottom: 8 }} />
                <div style={{ background: "#fdf6f0", borderRadius: 6, height: 14, width: "60%", marginBottom: 8 }} />
                <div style={{ background: "#fdf6f0", borderRadius: 6, height: 14, width: "40%", marginBottom: 20 }} />
                <div style={{ background: "#f5ebe3", borderRadius: 10, height: 38, width: "100%" }} />
              </div>
            ))}
          </div>
        ) : subs.length === 0 ? (
          /* ── Empty state ── */
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 360,
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
              🧾
            </div>
            <h3 style={{ margin: "0 0 8px", fontSize: "1.2rem", fontWeight: 700, color: "#3d2914" }}>
              No subscription requests yet
            </h3>
            <p style={{ margin: "0 0 24px", color: "#8d6e63", fontSize: "0.95rem", maxWidth: 340 }}>
              When students subscribe to your kitchen, their requests will appear here.
            </p>
            <button
              type="button"
              onClick={() => navigate("/provider/menu")}
              style={{
                background: "linear-gradient(135deg, #e07830, #c85a22)",
                color: "#fff",
                border: "none",
                borderRadius: 12,
                padding: "12px 24px",
                fontWeight: 700,
                fontSize: "0.92rem",
                cursor: "pointer",
              }}
            >
              Go to your Menu
            </button>
          </div>
        ) : (
          /* ── Subscription cards ── */
          <div style={{
            display: "grid",
            gap: 20,
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          }}>
            {subs.map((s) => (
              <article
                key={s.id}
                style={{
                  background: "#fff",
                  borderRadius: 18,
                  border: "1px solid rgba(192,90,43,0.12)",
                  boxShadow: "0 6px 24px rgba(61,41,20,0.07)",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  transition: "transform 0.25s ease, box-shadow 0.25s ease",
                }}
              >
                {/* Card header strip */}
                <div style={{
                  background: "linear-gradient(135deg, #fff5eb, #ffe8d6)",
                  padding: "14px 18px 12px",
                  borderBottom: "1px solid #f0ddd0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                }}>
                  <div style={{
                    width: 42,
                    height: 42,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #e07830, #c85a22)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.2rem",
                    color: "#fff",
                    fontWeight: 700,
                    flexShrink: 0,
                  }}>
                    {(s.student_name || "S").charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontWeight: 700, color: "#3d2914", fontSize: "1rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {s.student_name || "Student"}
                    </p>
                    <p style={{ margin: 0, fontSize: "0.78rem", color: "#7a5c45", textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 600 }}>
                      {formatPlan(s.plan)} plan
                    </p>
                  </div>
                  <span style={statusBadge(s.status)}>{s.status}</span>
                </div>

                {/* Card body */}
                <div style={{ padding: "16px 18px", flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div style={{ background: "#fdf6f0", borderRadius: 10, padding: "10px 12px" }}>
                      <p style={{ margin: "0 0 2px", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#9a7d68" }}>From</p>
                      <p style={{ margin: 0, fontWeight: 600, color: "#3d2914", fontSize: "0.88rem" }}>{formatDate(s.start_date)}</p>
                    </div>
                    <div style={{ background: "#fdf6f0", borderRadius: 10, padding: "10px 12px" }}>
                      <p style={{ margin: "0 0 2px", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#9a7d68" }}>To</p>
                      <p style={{ margin: 0, fontWeight: 600, color: "#3d2914", fontSize: "0.88rem" }}>{formatDate(s.end_date)}</p>
                    </div>
                  </div>

                  {/* Action buttons — only show for pending */}
                  {s.status === "pending" && (
                    <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                      <button
                        type="button"
                        onClick={() => updateStatus(s.id, "active")}
                        disabled={busyId === s.id}
                        style={{
                          flex: 1,
                          padding: "10px 14px",
                          border: "none",
                          borderRadius: 12,
                          background: busyId === s.id ? "#ccc" : "linear-gradient(135deg, #e07830, #c85a22)",
                          color: "#fff",
                          fontWeight: 700,
                          fontSize: "0.88rem",
                          cursor: busyId === s.id ? "not-allowed" : "pointer",
                          transition: "opacity 0.2s",
                          opacity: busyId === s.id ? 0.65 : 1,
                        }}
                      >
                        {busyId === s.id ? "Saving…" : "✅ Approve"}
                      </button>
                      <button
                        type="button"
                        onClick={() => updateStatus(s.id, "rejected")}
                        disabled={busyId === s.id}
                        style={{
                          flex: 1,
                          padding: "10px 14px",
                          border: "1.5px solid #ffcdd2",
                          borderRadius: 12,
                          background: "#ffebee",
                          color: "#c62828",
                          fontWeight: 700,
                          fontSize: "0.88rem",
                          cursor: busyId === s.id ? "not-allowed" : "pointer",
                          opacity: busyId === s.id ? 0.55 : 1,
                        }}
                      >
                        ❌ Reject
                      </button>
                    </div>
                  )}

                  {/* Resolved status message */}
                  {s.status !== "pending" && (
                    <p style={{
                      margin: "8px 0 0",
                      textAlign: "center",
                      fontSize: "0.82rem",
                      color: "#8d6e63",
                      fontStyle: "italic",
                    }}>
                      {s.status === "active" ? "Approved and active" : "Request declined"}
                    </p>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* ── Toast notification ── */}
      {toast && (
        <div
          role="status"
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 50,
            padding: "14px 20px",
            borderRadius: 14,
            fontWeight: 600,
            fontSize: "0.92rem",
            boxShadow: "0 12px 40px rgba(61,41,20,0.18)",
            animation: "pm-slide-up 0.35s ease",
            background: toast.type === "success" ? "#1b5e20" : "#b71c1c",
            color: "#fff",
          }}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
