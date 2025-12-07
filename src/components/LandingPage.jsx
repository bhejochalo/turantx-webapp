import React, { useState } from "react";
import Loader from "./Loader";
import OtpPage from "./OtpPage";
import "./LandingPage.css";
import logo from "../assets/turantx-logo.png";

const LandingPage = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isValid, setIsValid] = useState(false);
  const [showOtpPage, setShowOtpPage] = useState(false);
  const [loading, setLoading] = useState(false);
  localStorage.setItem("PHONE_NUMBER", phoneNumber);

  const handleChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");
    setPhoneNumber(value);
    setIsValid(/^[6-9]\d{9}$/.test(value));
  };

  const handleSendOtp = () => {
    if (!isValid) {
      alert("Enter valid mobile number");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setShowOtpPage(true);
      setLoading(false);
    }, 1500);
  };

  if (loading) return <Loader />;
  if (showOtpPage) return <OtpPage phoneNumber={phoneNumber} onBack={() => setShowOtpPage(false)} />;

  return (
    <div className="landing-container">
      <div className="landing-card">
        <img src={logo} alt="TurantX" className="landing-logo" />
        <h2 className="landing-title">
          Welcome to <span>TurantX</span>
        </h2>
        <p className="landing-subtitle">Instant and Reliable Travel & Delivery Connections</p>
        <input
          type="tel"
          placeholder="Enter mobile number"
          value={phoneNumber}
          onChange={handleChange}
          maxLength={10}
          className={`landing-input ${isValid ? "active" : ""}`}
        />
        <button className={`landing-btn ${isValid ? "active" : ""}`} onClick={handleSendOtp}>
          Send OTP
        </button>
      </div>
    </div>
  );
};

export default LandingPage;
