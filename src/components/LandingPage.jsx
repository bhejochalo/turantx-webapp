import React, { useState } from "react";
import "./LandingPage.css";
import logo from "../assets/turantx-logo.png"; // make sure this logo path is correct
import OtpPage from "./OtpPage";

const LandingPage = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isValid, setIsValid] = useState(false);
  const [showOtpPage, setShowOtpPage] = useState(false);

  const handleChange = (e) => {
    const value = e.target.value.replace(/\D/g, ""); // allow only numbers
    setPhoneNumber(value);
    setIsValid(/^[6-9]\d{9}$/.test(value)); // highlight when valid 10-digit
  };

  const handleSendOtp = () => {
    if (!/^[6-9]\d{9}$/.test(phoneNumber)) {
      alert("Please enter a valid 10-digit mobile number.");
      return;
    }
    setShowOtpPage(true); // show OTP screen
  };

  if (showOtpPage) {
    return <OtpPage phoneNumber={phoneNumber} onBack={() => setShowOtpPage(false)} />;
  }

  return (
    <div className="landing-container">
      <div className="landing-card">
        <img src={logo} alt="TurantX Logo" className="landing-logo" />

        <h2 className="landing-title">
          Welcome to <span>TurantX</span>
        </h2>
        <p className="landing-subtitle">
          Instant and Reliable Travel & Delivery Connections
        </p>

        <input
          type="tel"
          placeholder="Enter mobile number"
          value={phoneNumber}
          onChange={handleChange}
          maxLength={10}
          className={`landing-input ${isValid ? "active" : ""}`}
        />

        <button
          className={`landing-btn ${isValid ? "active" : ""}`}
          onClick={handleSendOtp}
        >
          Send OTP
        </button>
      </div>
    </div>
  );
};

export default LandingPage;
