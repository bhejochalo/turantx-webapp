import React, { useState } from "react";
import "./LandingPage.css";
import logo from "../assets/turantxlogo.gif";
import Loader from "./Loader";
import OtpPage from "./OtpPage";

export default function LandingPage() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isValid, setIsValid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);

  localStorage.setItem("PHONE_NUMBER", phoneNumber);

  const handleChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");
    setPhoneNumber(value);
    setIsValid(/^[6-9]\d{9}$/.test(value));
  };

  const handleContinue = () => {
    if (!isValid) return;
    setLoading(true);

    setTimeout(() => {
      sessionStorage.setItem("AUTH_OK", "true"); // 🔐 temp auth
      setLoading(false);
      setShowOtp(true);
    }, 1200);
  };

  if (loading) return <Loader />;
  if (showOtp) return <OtpPage phoneNumber={phoneNumber} />;

  return (
    <div className="login-wrapper">
      {/* LEFT BRAND PANEL */}
      <div className="login-left">
        <div className="brand-content">
          <h1>
            Fast. Trusted.
            <br />
            Human-Powered Delivery ✈️
          </h1>

          <p>
            Send urgent items with verified flight travelers.
            <br />
            No cargo delays. No couriers.
          </p>

          <ul className="trust-points">
            <li>✔ PAN & ID verified travelers</li>
            <li>✔ Flights manually reviewed</li>
            <li>✔ Refund guaranteed if no match</li>
          </ul>
        </div>
      </div>

      {/* RIGHT LOGIN CARD */}
      <div className="login-right">
        <div className="login-card">
          <img src={logo} alt="TurantX" className="login-logo" />

          <h2>Login to TurantX</h2>
          <p className="login-subtitle">
            Enter your mobile number to continue
          </p>

          <label>Mobile Number</label>
          <input
            type="tel"
            placeholder="10-digit mobile number"
            value={phoneNumber}
            onChange={handleChange}
            maxLength={10}
            className={isValid ? "active" : ""}
          />

          <button
            className={`login-btn ${isValid ? "active" : ""}`}
            onClick={handleContinue}
            disabled={!isValid}
          >
            Continue
          </button>

          <p className="login-note">
            By continuing, you agree to TurantX’s
            <br />
            <span>Terms & Privacy Policy</span>
          </p>
        </div>
      </div>
    </div>
  );
}
