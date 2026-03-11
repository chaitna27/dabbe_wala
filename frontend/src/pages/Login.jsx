import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import Input from "../components/Input";
import "../styles/Auth.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await api.post("/auth/login", {
        email,
        password,
      });

      const token = res.data.token;
      const role = res.data.user.role;

      localStorage.setItem("token", token);
      localStorage.setItem("role", role);

      // Delay navigation to avoid render timing issues
      setTimeout(() => {
        if (role === "student") {
          navigate("/student/orders");
        } else if (role === "provider") {
          navigate("/provider/dashboard");
        } else {
          navigate("/");
        }
      }, 0);

    } catch (err) {
      if (err.response) {
        alert(err.response.data?.message || "Login failed");
      } else {
        console.error("Frontend error:", err);
      }
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-card">
        <h2 className="auth-title">Welcome Back</h2>
        <p className="auth-subtitle">Login to order your favorite home-cooked meals</p>
        
        <form className="auth-form" onSubmit={handleLogin}>
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
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          
          <button type="submit" className="auth-btn">Login</button>
        </form>
        
        <p className="auth-footer">
          Don't have an account? <a href="/register">Register here</a>
        </p>
        <p style={{ marginTop: "10px" }}>
          <a href="/forgot-password">Forgot Password?</a>
        </p>

      </div>
    </div>
  );
}

export default Login;
