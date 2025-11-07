import React, { useState, useRef } from "react";
import "./OtpPage.css";
import logo from "../assets/turantx-logo.png";
import { ArrowLeft } from "lucide-react";
import SelectionPage from "./SelectionPage";
import Loader from "./Loader"; // ✅ Import Loader
import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

const OtpPage = ({ phoneNumber, onBack }) => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isComplete, setIsComplete] = useState(false);
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(false); // ✅ Loader state
  const inputRefs = useRef([]);

  // Handle OTP input
  const handleChange = (e, index) => {
    const value = e.target.value.slice(-1).replace(/\D/g, "");
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) inputRefs.current[index + 1].focus();
    setIsComplete(newOtp.every((v) => v !== ""));
  };

  // Handle Backspace
  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace") {
      const newOtp = [...otp];
      if (!newOtp[index] && index > 0) inputRefs.current[index - 1].focus();
      newOtp[index] = "";
      setOtp(newOtp);
      setIsComplete(false);
    }
  };

  // Handle Verify OTP
  const handleVerify = async () => {
    const otpValue = otp.join("");
    if (otpValue.length !== 6) {
      alert("Please enter a valid 6-digit OTP");
      return;
    }

    // ✅ Show Loader
    setLoading(true);

    try {
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // ✅ Save user in Firestore (like Android)
      await setDoc(
        doc(db, "users", phoneNumber),
        {
          phoneNumber,
          verified: true,
          timestamp: Date.now(),
        },
        { merge: true }
      );

      console.log("✅ User saved successfully!");
      setVerified(true);
    } catch (error) {
      console.error("❌ Firestore Error:", error);
    } finally {
      // ✅ Hide loader after slight delay for smoothness
      setTimeout(() => setLoading(false), 1000);
    }
  };

  // ✅ Display Loader while verifying
  if (loading) return <Loader />;

  // ✅ Go to next page after verification
  if (verified) return <SelectionPage phoneNumber={phoneNumber} />;

  return (
    <div className="otp-page">
      <button className="otp-back" onClick={onBack}>
        <ArrowLeft size={18} /> Back
      </button>

      <img src={logo} alt="TurantX" className="otp-logo" />

      <h2 className="otp-title">Enter OTP</h2>
      <p className="otp-subtext">
        We’ve sent a 6-digit code to <br /> +91 {phoneNumber}
      </p>

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
