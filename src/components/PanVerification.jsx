import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import logo from "../assets/turantx-logo.png";
import "./PanVerification.css";
import { CheckCircle } from "lucide-react";

export default function PanVerification() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const phoneNumber = state?.phoneNumber;
  const userType = state?.userType || "SENDER";

  const [pan, setPan] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifiedData, setVerifiedData] = useState(null);

  const handleVerify = async () => {
    if (!pan) return alert("Enter valid PAN number");
    setLoading(true);
    try {
      // simulate API
      await new Promise((res) => setTimeout(res, 1200));
      setVerifiedData({ name: "Rajesh Kumar Singh", status: "Verified" });
    } catch {
      alert("PAN verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    navigate("/address-selection", {
      state: { phoneNumber, userType, panVerified: true },
    });
  };

  return (
    <div className="auto-page">
      <div className="auto-card">
        <img src={logo} alt="TurantX" className="auto-logo" />
        <h3 className="auto-title">Enter PAN Details</h3>
        <input
          value={pan}
          onChange={(e) => setPan(e.target.value.toUpperCase())}
          placeholder="Enter PAN Card Number"
          className="field-input"
          disabled={!!verifiedData}
        />

        {verifiedData && (
          <div className="pan-success">
            <CheckCircle color="green" size={22} />
            <p className="success-text">{verifiedData.status}</p>
            <p className="pan-name">{verifiedData.name}</p>
          </div>
        )}

        <button
          className={`next-btn ${verifiedData ? "active" : ""}`}
          onClick={verifiedData ? handleContinue : handleVerify}
        >
          {verifiedData ? "Continue" : loading ? "Verifying..." : "Verify"}
        </button>
      </div>
    </div>
  );
}
