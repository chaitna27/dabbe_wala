import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import Input from "../components/Input";
import "../styles/Auth.css";
import { GoogleLogin } from "@react-oauth/google";
import { Eye, EyeOff } from "lucide-react";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await api.post("/auth/login", {
        email,
        password,
      });

      const token = res.data.token;
      const user = res.data.user;

      localStorage.setItem("token", token);
      localStorage.setItem("role", user.role);
      localStorage.setItem("name", user.name || "");
      localStorage.setItem("avatar", user.avatar || "");

      // Delay navigation to avoid render timing issues
      setTimeout(() => {
        if (user.role === "student") {
          navigate("/student/orders");
        } else if (user.role === "provider") {
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

  const handleGoogleLogin = async (credentialResponse) => {
    try {
      const res = await api.post("/auth/google", {
        credential: credentialResponse.credential,
      });

      const token = res.data.token;
      const user = res.data.user;

      localStorage.setItem("token", token);
      localStorage.setItem("role", user.role);
      localStorage.setItem("name", user.name || "");
      localStorage.setItem("avatar", user.avatar || "");

      if (user.role === "student") {
        navigate("/student/orders");
      } else if (user.role === "provider") {
        navigate("/provider/dashboard");
      } else {
        navigate("/");
      }
    } catch (err) {
      console.error(err);
      alert("Google Login Failed");
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-card">
        <h2 className="auth-title">Welcome Back</h2>
        <p className="auth-subtitle">
          Login to order your favorite home-cooked meals
        </p>

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

          <button type="submit" className="auth-btn">
            Login
          </button>

          <div style={{ marginTop: "20px" }}>
            <GoogleLogin
              onSuccess={handleGoogleLogin}
              onError={() => alert("Google Login Failed")}
              theme="outline"
              size="large"
              text="signin_with"
              shape="rectangular"
              width="350"
            />
          </div>
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
