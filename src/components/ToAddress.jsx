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

export default function ToAddress() {
  const navigate = useNavigate();
  const { state } = useLocation();

  const phoneNumber = state?.phoneNumber;
  const userType = state?.userType;
  const from = state?.from;
  const toPlace = state?.toPlace;
  const distance = state?.distance || "";

  const [loading, setLoading] = useState(false);
  const [to, setTo] = useState({
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
    if (toPlace) {
      const comps = toPlace.address_components || [];
      const get = (type) =>
        comps.find((c) => c.types.includes(type))?.long_name || "";

      setTo({
        houseNumber: "",
        street: get("route") || toPlace.name || "",
        area: get("sublocality_level_1") || get("locality") || "",
        city: get("locality") || get("administrative_area_level_2"),
        state: get("administrative_area_level_1"),
        postalCode: get("postal_code"),
        latitude: toPlace.geometry?.location?.lat(),
        longitude: toPlace.geometry?.location?.lng(),
      });
    }
  }, [toPlace]);

  const handleChange = (e) => {
    setTo({ ...to, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const validateFields = () => {
    let newErrors = {};
    Object.keys(to).forEach((key) => {
      if (!to[key] && key !== "latitude" && key !== "longitude")
        newErrors[key] = "Required";
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateFields()) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (userType === "TRAVELER") {
        navigate("/flight-details", { state: { phoneNumber, userType, from, to, distance } });
      } else {
        navigate("/item-details", { state: { phoneNumber, userType, from, to, distance, panDetails: state?.panDetails } });
      }
    }, 800);
  };

  const handleBack = () => {
    navigate("/from-address", { state: { phoneNumber, userType, from } });
  };

  return (
    <div className="addr-container">
      {loading && <Loader />}
      <div className="addr-card">
        <h3 className="addr-title">To Address</h3>

        <input name="houseNumber" value={to.houseNumber} onChange={handleChange} placeholder="House / Flat Number" className={`addr-input ${errors.houseNumber ? "error" : ""}`} />
        <input name="street" value={to.street} onChange={handleChange} placeholder="Street / Locality" className={`addr-input ${errors.street ? "error" : ""}`} />
        <input name="area" value={to.area} onChange={handleChange} placeholder="Area / Landmark" className={`addr-input ${errors.area ? "error" : ""}`} />
        <input name="city" value={to.city} onChange={handleChange} placeholder="City" className={`addr-input ${errors.city ? "error" : ""}`} />

        <select name="state" value={to.state} onChange={handleChange} className={`addr-input ${errors.state ? "error" : ""}`}>
          <option value="">Select State</option>
          {indianStates.map((s, i) => (
            <option key={i} value={s}>{s}</option>
          ))}
        </select>

        <input name="postalCode" value={to.postalCode} onChange={handleChange} placeholder="Postal Code" className={`addr-input ${errors.postalCode ? "error" : ""}`} />

        {Object.values(errors).length > 0 && <p className="error-msg">⚠️ Please fill all required fields.</p>}

        {distance && (
          <div className="distance-bubble">
            <strong>Approx Distance:</strong>{" "}
            <span className="distance">{distance} km</span>
          </div>
        )}

        <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
          <button className="addr-next" style={{ background: "#f2f2f2", color: "#555", flex: 1 }} onClick={handleBack}>Back</button>
          <button className="addr-next" style={{ flex: 2 }} onClick={handleNext}>Next</button>
        </div>
      </div>
    </div>
  );
}
