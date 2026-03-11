import { useState } from "react";
import api from "../api";
import { Link } from "react-router-dom";

export default function ForgotPassword() {
    console.log("FORGOT PASSWORD COMPONENT RENDERED");

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      alert("Please enter your email");
      return;
    }

    try {
      setLoading(true);
      const res = await api.post("/auth/forgot-password", { email });
      setMessage(res.data.message);
    } catch (err) {
      alert(
        err.response?.data?.message || "Failed to send reset email"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: "400px" }}>
      <h2>Forgot Password 🔐</h2>

      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Enter your registered email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            background: "#c05a2b",
            color: "white",
            padding: "8px",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </button>
      </form>

      {message && (
        <p style={{ marginTop: "10px", color: "green" }}>{message}</p>
      )}

      <p style={{ marginTop: "10px" }}>
        <Link to="/login">Back to Login</Link>
      </p>
    </div>
  );
}
