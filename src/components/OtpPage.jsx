import React, { useState, useRef } from "react";
import "./OtpPage.css";
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
    const value = e.target.value.replace(/\D/g, ""); // only digits
    if (!value) return;

    const newOtp = [...otp];
    newOtp[index] = value[0];
    setOtp(newOtp);

    // move to next input
    if (index < 5) inputRefs.current[index + 1].focus();

    setIsComplete(newOtp.every((digit) => digit !== ""));
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace") {
      const newOtp = [...otp];
      if (otp[index] === "") {
        if (index > 0) {
          inputRefs.current[index - 1].focus();
          newOtp[index - 1] = "";
        }
      } else {
        newOtp[index] = "";
      }
      setOtp(newOtp);
      setIsComplete(false);
    }
  };

  const handleVerify = async () => {
    const otpValue = otp.join("");
  
    if (otpValue.length !== 6) {
      alert("Enter a valid 6-digit OTP");
      return;
    }
  
    // ✅ OTP Verified UI
    alert(`✅ OTP Verified Successfully`);
  
    // ✅ Save phoneNumber to Firestore (just like Android)
    try {
      await setDoc(doc(db, "users", phoneNumber), {
        phoneNumber: phoneNumber,
        verified: true,
        timestamp: Date.now()
      }, { merge: true });
  
      console.log("✅ User stored/updated successfully.");
    } catch (error) {
      console.error("❌ Firestore Error:", error);
    }
  
    // ✅ Move to Selection Page
    setVerified(true);
  };
  

  const handleClearAll = () => {
    setOtp(["", "", "", "", "", ""]);
    inputRefs.current[0].focus();
    setIsComplete(false);
  };

  // ✅ if verified, show selection page
  if (verified) {
    return <SelectionPage phoneNumber={phoneNumber} />;
  }

  return (
    <div className="otp-container">
      <div className="otp-card">
        <div className="otp-header">
          <button className="back-btn" onClick={onBack}>
            <ArrowLeft size={20} />
          </button>
          <h3>Verify OTP</h3>
        </div>

        <p className="otp-text">Sent to +91 {phoneNumber}</p>

        <div className="otp-input-group">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              maxLength="1"
              value={digit}
              onChange={(e) => handleChange(e, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className="otp-input"
            />
          ))}
        </div>

        <button
          className={`verify-btn ${isComplete ? "active" : ""}`}
          onClick={handleVerify}
          disabled={!isComplete}
        >
          Verify OTP
        </button>

        <div className="otp-footer">
          <button className="clear-btn" onClick={handleClearAll}>
            Clear All
          </button>
          <p className="resend-text">
            Didn’t receive the code? <span>Resend OTP</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default OtpPage;
