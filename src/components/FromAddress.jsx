import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./Address.css";
import Loader from "./Loader";

const indianStates = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Delhi", "Jammu and Kashmir",
  "Ladakh", "Lakshadweep", "Puducherry"
];
const ENABLED_STATES = ["Maharashtra", "Karnataka", "Delhi"];

export default function FromAddress() {
  const navigate = useNavigate();
  const { state } = useLocation();

  const phoneNumber = state?.phoneNumber;
  const userType = state?.userType;
  const fromAddress = state?.fromAddress || "";
  const distance = state?.distance || "";

  const [loading] = useState(false);
  const toAddress = state?.toAddress || "";
  const [from, setFrom] = useState({
    houseNumber: "",
    street: "",
    area: "",
    city: "",
    state: "",
    postalCode: "",
    latitude: null,
    longitude: null,
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (fromAddress) {
      const parts = fromAddress.split(",");
      setFrom((prev) => ({
        ...prev,
        street: parts[0]?.trim() || "",
        area: parts[1]?.trim() || "",
        city: parts[2]?.trim() || "",
        state: parts[3]?.trim() || "",
        postalCode: parts[4]?.replace(/\D/g, "") || "",
      }));
    }
  }, [fromAddress]);

  const handleChange = (e) => {
    setFrom({ ...from, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const validateFields = () => {
    let newErrors = {};
    Object.keys(from).forEach((key) => {
      if (!from[key] && key !== "latitude" && key !== "longitude")
        newErrors[key] = "Required";
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateFields()) return;
    navigate("/to-address", {
      state: { phoneNumber, userType, from, distance, toAddress }
    });
    
  };

  return (
    <div className="addr-container">
      {loading && <Loader />}
      <div className="addr-card">
        <h3 className="addr-title">From Address</h3>

        <input
          name="houseNumber"
          value={from.houseNumber}
          onChange={handleChange}
          placeholder="House / Flat Number"
          className={`addr-input ${errors.houseNumber ? "error" : ""}`}
        />
        <input
          name="street"
          value={from.street}
          onChange={handleChange}
          placeholder="Street / Locality"
          className={`addr-input ${errors.street ? "error" : ""}`}
        />
        <input
          name="area"
          value={from.area}
          onChange={handleChange}
          placeholder="Area / Landmark"
          className={`addr-input ${errors.area ? "error" : ""}`}
        />
        <input
          name="city"
          value={from.city}
          onChange={handleChange}
          placeholder="City"
          className={`addr-input ${errors.city ? "error" : ""}`}
        />

<select
  name="state"
  value={from.state}
  onChange={handleChange}
  className={`addr-input ${errors.state ? "error" : ""}`}
>
  <option value="">Select State</option>

  {indianStates.map((s, i) => {
    const isEnabled = ENABLED_STATES.includes(s);

    return (
      <option
        key={i}
        value={s}
        disabled={!isEnabled}
        style={{
          color: isEnabled ? "#000" : "#aaa",
        }}
      >
        {s} {!isEnabled ? " (Coming Soon)" : ""}
      </option>
    );
  })}
</select>


        <input
          name="postalCode"
          value={from.postalCode}
          onChange={handleChange}
          placeholder="Postal Code"
          className={`addr-input ${errors.postalCode ? "error" : ""}`}
        />

        {Object.values(errors).length > 0 && (
          <p className="error-msg">⚠️ Please fill all required fields.</p>
        )}

        {distance && (
          <div className="distance-bubble">
            <strong>Approx Distance:</strong>{" "}
            <span className="distance">{distance} km</span>
          </div>
        )}

        <button className="addr-next" onClick={handleNext}>
          Next
        </button>
      </div>
    </div>
  );
}
