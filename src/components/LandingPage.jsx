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

  const [mode, setMode] = useState("LOGIN"); // LOGIN | SIGNUP
  const [showAlreadyModal, setShowAlreadyModal] = useState(false);

  localStorage.setItem("PHONE_NUMBER", phoneNumber);

  const handleChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");
    setPhoneNumber(value);
    setIsValid(/^[6-9]\d{9}$/.test(value));
  };

  const mockUserExists = (phone) => {
    // 🔥 TEMP MOCK — later Firestore check
    return phone === "9999999999";
  };

  const handleContinue = () => {
    if (!isValid) return;

    // 🚨 SIGNUP but already exists
    if (mode === "SIGNUP" && mockUserExists(phoneNumber)) {
      setShowAlreadyModal(true);
      return;
    }

    setLoading(true);

    setTimeout(() => {
      sessionStorage.setItem("AUTH_OK", "true");
      sessionStorage.setItem("AUTH_MODE", mode);
      setLoading(false);
      setShowOtp(true);
    }, 1200);
  };

  if (loading) return <Loader />;
  if (showOtp) return <OtpPage phoneNumber={phoneNumber} />;

  return (
    <div className="login-wrapper">
      {/* LEFT BRAND */}
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

      {/* RIGHT LOGIN */}
      <div className="login-right">
        <div className="login-card">
          <img src={logo} alt="TurantX" className="login-logo" />

          {/* 🔁 TOGGLE */}
          <div className="login-toggle">
            <button
              className={mode === "LOGIN" ? "active" : ""}
              onClick={() => setMode("LOGIN")}
            >
              Login
            </button>
            <button
              className={mode === "SIGNUP" ? "active" : ""}
              onClick={() => setMode("SIGNUP")}
            >
              Sign Up
            </button>
          </div>

          <h2>{mode === "LOGIN" ? "Login to TurantX" : "Create TurantX Account"}</h2>

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
            {mode === "LOGIN" ? "Continue" : "Sign Up"}
          </button>

          <p className="login-note">
            By continuing, you agree to TurantX’s
            <br />
            <span>Terms & Privacy Policy</span>
          </p>
        </div>
      </div>

      {/* 🔔 ALREADY REGISTERED MODAL */}
      {showAlreadyModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h3>Already Registered</h3>
            <p>
              This mobile number is already registered with TurantX.
              <br />
              Please log in instead.
            </p>

            <div className="modal-actions">
              <button
                className="secondary"
                onClick={() => setShowAlreadyModal(false)}
              >
                Cancel
              </button>
              <button
                className="primary"
                onClick={() => {
                  setShowAlreadyModal(false);
                  setMode("LOGIN");
                }}
              >
                Go to Login
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
