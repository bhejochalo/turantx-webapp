import React, { useState } from "react";
import "./LandingPage.css";
import { FiPhone } from "react-icons/fi";
import logo from "../assets/logo.png";

function LandingPage() {
  const [phone, setPhone] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const isValid = phone.length === 10;

  const handleChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");
    setPhone(value);
  };

  return (
    <div className="landing-container">
      <div className="card">
        <img src={logo} alt="TurantX Logo" className="logo" />

        <h2 className="title">Welcome to TurantX</h2>
        <p className="subtitle">Delivering speed, reliability, and trust.</p>

        <div className={`input-box ${isFocused ? "focused" : ""}`}>
          <FiPhone color="#ff7a00" size={20} />
          <input
            type="text"
            maxLength="10"
            placeholder="Enter your mobile number"
            value={phone}
            onChange={handleChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
        </div>

        <button
          className={`otp-btn ${isValid ? "active" : ""}`}
          disabled={!isValid}
        >
          Send OTP
        </button>
      </div>
    </div>
  );
}

export default LandingPage;
