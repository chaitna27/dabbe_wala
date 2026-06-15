import { useState } from "react";
import api from "../api";
import { Link } from "react-router-dom";
import Input from "../components/Input";
import "../styles/Auth.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [devLink, setDevLink] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      alert("Please enter your email");
      return;
    }

    try {
      setLoading(true);
      setMessage("");
      setDevLink("");
      const res = await api.post("/auth/forgot-password", { email });
      setMessage(res.data?.message || "Check your email.");
      if (res.data?.devResetLink) {
        setDevLink(res.data.devResetLink);
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to send reset email";
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-card">
        <h2 className="auth-title">Forgot password</h2>
        <p className="auth-subtitle">We&apos;ll send a secure link to reset your password</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Email</label>
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? "Sending..." : "Send reset link"}
          </button>
        </form>

        {message ? <p className="auth-success">{message}</p> : null}

        {devLink ? (
          <div className="auth-dev-box">
            <strong>Local / dev only:</strong> email is not configured or dev flag is on. Use this link once:
            <code>{devLink}</code>
          </div>
        ) : null}

        <p className="auth-muted">
          Production email is sent by the backend mail provider configured in environment variables.
        </p>

        <p className="auth-footer">
          <Link to="/login">Back to login</Link>
        </p>
      </div>
    </div>
  );
}
