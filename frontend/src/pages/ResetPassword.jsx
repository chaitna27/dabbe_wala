import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../api";
import Input from "../components/Input";
import "../styles/Auth.css";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      alert("Invalid reset link");
      return;
    }

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
      const res = await api.post(`/auth/reset-password/${encodeURIComponent(token)}`, {
        password,
      });

      setMessage(res.data?.message || "Password reset successful");

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

  if (!token) {
    return (
      <div className="auth-page-wrapper">
        <div className="auth-card">
          <h2 className="auth-title">Invalid link</h2>
          <p className="auth-muted">Open the reset link from your email again, or request a new one.</p>
          <p className="auth-footer">
            <Link to="/forgot-password">Forgot password</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page-wrapper">
      <div className="auth-card">
        <h2 className="auth-title">Reset password</h2>
        <p className="auth-subtitle">Choose a new password for your account</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <label>New password</label>
            <Input
              type="password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="input-group">
            <label>Confirm password</label>
            <Input
              type="password"
              placeholder="Repeat password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? "Updating…" : "Update password"}
          </button>
        </form>

        {message ? <p className="auth-success">{message}</p> : null}
        <p className="auth-muted">Redirecting to login after success…</p>

        <p className="auth-footer">
          <Link to="/login">Back to login</Link>
        </p>
      </div>
    </div>
  );
}
