import { useNavigate } from "react-router-dom";

export default function NotFound() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  const dashboardPath =
    role === "provider" ? "/provider/dashboard" : "/student/orders";

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "80px 24px 40px",
      background: "linear-gradient(-45deg, #fcfaf8, #fff3ef, #f2f7f5, #ffffff)",
      backgroundSize: "400% 400%",
      textAlign: "center",
    }}>
      {/* Icon */}
      <div style={{
        fontSize: "5rem",
        marginBottom: 16,
        lineHeight: 1,
      }}>
        🍱
      </div>

      {/* 404 number */}
      <h1 style={{
        margin: "0 0 8px",
        fontSize: "clamp(4rem, 12vw, 7rem)",
        fontWeight: 900,
        color: "#c05a2b",
        letterSpacing: "-0.04em",
        lineHeight: 1,
      }}>
        404
      </h1>

      {/* Title */}
      <h2 style={{
        margin: "0 0 12px",
        fontSize: "clamp(1.2rem, 3vw, 1.6rem)",
        fontWeight: 700,
        color: "#1f3d36",
      }}>
        Oops, this page doesn't exist
      </h2>

      {/* Subtitle */}
      <p style={{
        margin: "0 0 40px",
        fontSize: "1rem",
        color: "#6b5344",
        maxWidth: 380,
        lineHeight: 1.6,
      }}>
        Looks like this tiffin got delivered to the wrong address.
        Let's get you back on track.
      </p>

      {/* Action buttons */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 14, justifyContent: "center" }}>
        <button
          type="button"
          onClick={() => navigate("/")}
          style={{
            padding: "12px 28px",
            border: "none",
            borderRadius: 12,
            background: "#c05a2b",
            color: "#fff",
            fontWeight: 700,
            fontSize: "0.95rem",
            cursor: "pointer",
            transition: "background 0.2s",
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = "#a94c24"}
          onMouseLeave={(e) => e.currentTarget.style.background = "#c05a2b"}
        >
          Go to Home
        </button>

        {token && (
          <button
            type="button"
            onClick={() => navigate(dashboardPath)}
            style={{
              padding: "12px 28px",
              border: "2px solid #c05a2b",
              borderRadius: 12,
              background: "transparent",
              color: "#c05a2b",
              fontWeight: 700,
              fontSize: "0.95rem",
              cursor: "pointer",
              transition: "background 0.2s, color 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#c05a2b";
              e.currentTarget.style.color = "#fff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#c05a2b";
            }}
          >
            Go to Dashboard
          </button>
        )}
      </div>
    </div>
  );
}
