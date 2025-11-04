import React, { useState } from "react";
import "./OtpPage.css";
import logo from "../assets/turantx-logo.png";
import { FiArrowLeft } from "react-icons/fi";

const OtpPage = ({ phoneNumber, onBack, onVerify }) => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);

  const handleChange = (value, index) => {
    if (/^\d?$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      if (value && index < 5) {
        document.getElementById(`otp-${index + 1}`).focus();
      }
    }
  };

  const handleVerify = () => {
    const fullOtp = otp.join("");
    if (fullOtp.length === 6) {
      onVerify(fullOtp);
    } else {
      alert("Please enter a valid 6-digit OTP");
    }
  };

  return (
    <div className="otp-container">
      <div className="otp-card">
        <div className="otp-back" onClick={onBack}>
          <FiArrowLeft size={20} />
          <span>Back</span>
        </div>

        <img src={logo} alt="TurantX Logo" className="otp-logo" />

        <h2>Enter OTP</h2>
        <p>
          We’ve sent a 6-digit code to <br />
          <strong>+91 {phoneNumber}</strong>
        </p>

        <div className="otp-inputs">
          {otp.map((digit, i) => (
            <input
              key={i}
              id={`otp-${i}`}
              type="text"
              maxLength={1}
              className="otp-box"
              value={digit}
              onChange={(e) => handleChange(e.target.value, i)}
            />
          ))}
        </div>

        <p className="resend">Resend OTP</p>

        <button className="verify-btn" onClick={handleVerify}>
          Verify OTP
        </button>
      </div>
    </div>
  );
};

export default OtpPage;
