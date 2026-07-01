import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import Input from "../components/Input";
import "../styles/Auth.css";
import { GoogleLogin } from "@react-oauth/google";
import { Eye, EyeOff } from "lucide-react";

function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await api.post("/auth/register", {
        name,
        email,
        password,
        role,
      });
      setSuccess(true);
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Registration failed");
    }
  };

  const handleGoogleRegister = async (credentialResponse) => {
    try {
      const res = await api.post("/auth/google", {
        credential: credentialResponse.credential,
        role,
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.user.role);

      if (res.data.user.role === "provider") {
        window.location.href = "/provider/dashboard";
      } else {
        window.location.href = "/student/orders";
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Google signup failed");
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-card">
        <h2 className="auth-title">Join DabbeWala</h2>
        <p className="auth-subtitle">
          Get wholesome tiffins delivered to your doorstep
        </p>

        {success && (
          <div style={{
            background: "#e8f5e9",
            border: "1px solid #a5d6a7",
            borderRadius: 10,
            padding: "12px 16px",
            marginBottom: 16,
            textAlign: "center",
          }}>
            <p style={{ margin: 0, fontWeight: 700, color: "#1b5e20", fontSize: "1rem" }}>
              ✅ Account created!
            </p>
            <p style={{ margin: "4px 0 0", fontSize: "0.87rem", color: "#2e7d32" }}>
              Redirecting you to login…
            </p>
          </div>
        )}

        <form className="auth-form" onSubmit={handleRegister} style={{ opacity: success ? 0.5 : 1, pointerEvents: success ? "none" : "auto" }}>
          <div className="input-group">
            <label>Full Name</label>
            <Input
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label>Email Address</label>
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label>Password</label>

            <div className="password-wrapper">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="input-group">
            <label>I am a...</label>
            <select
              className="auth-select"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="student">Student</option>
              <option value="provider">Provider</option>
            </select>
          </div>

          <button type="submit" className="auth-btn">
            Register
          </button>

          <div style={{ marginTop: "20px" }}>
            <GoogleLogin
              onSuccess={handleGoogleRegister}
              onError={() => alert("Google signup failed")}
              theme="outline"
              size="large"
              text="signup_with"
              shape="rectangular"
              width="350"
            />
          </div>
        </form>

        <p className="auth-footer">
          Already have an account? <a href="/login">Login here</a>
        </p>
      </div>
    </div>
  );
}

export default Register;
