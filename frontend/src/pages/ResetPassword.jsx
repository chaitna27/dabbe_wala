import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      alert("Please fill all fields");
      return;
    }

    if (password.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      const res = await api.post(`/auth/reset-password/${token}`, {
        password,
      });

      setMessage(res.data.message || "Password reset successful");

      // Auto redirect to login after success
      setTimeout(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        navigate("/login", { replace: true });
      }, 2000);
      
    } catch (err) {
      alert(err.response?.data?.message || "Invalid or expired token");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: "400px" }}>
      <h2>Reset Password 🔑</h2>

      <form onSubmit={handleSubmit}>
        <input
          type="password"
          placeholder="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
        />

        <input
          type="password"
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
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
          {loading ? "Resetting..." : "Reset Password"}
        </button>
      </form>

      {message && (
        <p style={{ marginTop: "10px", color: "green" }}>{message}</p>
      )}
    </div>
  );
}

