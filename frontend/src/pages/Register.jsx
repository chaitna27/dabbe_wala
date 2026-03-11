import { useState } from "react";
import api from "../api";
import Input from "../components/Input";
import "../styles/Auth.css";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await api.post("/auth/register", {
      name,
      email,
      password,
      role,
      });
      alert("Registered successfully");
    } catch (err) {
        console.error(err);
        alert(err.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-card">
        <h2 className="auth-title">Join DabbeWala</h2>
        <p className="auth-subtitle">Get wholesome tiffins delivered to your doorstep</p>
        
        <form className="auth-form" onSubmit={handleRegister}>
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
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
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

          <button type="submit" className="auth-btn">Register</button>
        </form>
        
        <p className="auth-footer">
          Already have an account? <a href="/login">Login here</a>
        </p>
      </div>
    </div>
  );
}

export default Register;
