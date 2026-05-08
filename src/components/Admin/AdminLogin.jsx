import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/turantx-logo.png";
import "./AdminLogin.css";

const ADMIN_PASSWORD = "123";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem("ADMIN_AUTH", "true");
      navigate("/admin/dashboard");
    } else {
      setError("Incorrect password. Try again.");
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <img src={logo} alt="TurantX" className="admin-logo" />
        <h2>Admin Panel</h2>
        <p className="admin-subtitle">TurantX Operations</p>

        <form onSubmit={handleLogin}>
          <input
            type="password"
            placeholder="Enter admin password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
            }}
            className="admin-input"
            autoFocus
          />
          {error && <p className="admin-error">{error}</p>}
          <button type="submit" className="admin-login-btn">
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
