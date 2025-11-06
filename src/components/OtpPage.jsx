import React, { useState, useRef } from "react";
import "./OtpPage.css";
import logo from "../assets/turantx-logo.png";
import { ArrowLeft } from "lucide-react";
import SelectionPage from "./SelectionPage";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

const OtpPage = ({ phoneNumber, onBack }) => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isComplete, setIsComplete] = useState(false);
  const [verified, setVerified] = useState(false);
  const inputRefs = useRef([]);

  const handleChange = (e, index) => {
    const value = e.target.value.slice(-1).replace(/\D/g, "");
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) inputRefs.current[index + 1].focus();
    setIsComplete(newOtp.every((v) => v !== ""));
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace") {
      const newOtp = [...otp];
      if (!newOtp[index] && index > 0) inputRefs.current[index - 1].focus();
      newOtp[index] = "";
      setOtp(newOtp);
      setIsComplete(false);
    }
  };

  const handleVerify = async () => {
    const otpValue = otp.join("");
    if (otpValue.length !== 6) return;

    // save to firestore (same as Android flow)
    await setDoc(doc(db, "users", phoneNumber), {
      phoneNumber,
      verified: true,
      timestamp: Date.now(),
    }, { merge: true });

    setVerified(true);
  };

  if (verified) return <SelectionPage phoneNumber={phoneNumber} />;

  return (
    <div className="otp-page">
      <button className="otp-back" onClick={onBack}>
        <ArrowLeft size={18} /> Back
      </button>

      <img src={logo} alt="turantx" className="otp-logo" />

      <h2 className="otp-title">Enter OTP</h2>
      <p className="otp-subtext">We’ve sent a 6-digit code to <br /> +91 {phoneNumber}</p>

      <div className="otp-input-row">
        {otp.map((digit, i) => (
          <input
            key={i}
            ref={(el) => (inputRefs.current[i] = el)}
            maxLength="1"
            value={digit}
            onChange={(e) => handleChange(e, i)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            className="otp-box"
          />
        ))}
      </div>

      <p className="otp-resend">Resend OTP</p>

      <button
        className={`otp-verify-btn ${isComplete ? "active" : ""}`}
        onClick={handleVerify}
        disabled={!isComplete}
      >
        Verify OTP
      </button>
    </div>
  );
};

export default OtpPage;
