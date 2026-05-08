import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./Address.css";
import Loader from "./Loader";
import StepIndicator from "./StepIndicator";
import { showToast } from "./Toast";

const indianStates = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Delhi", "Jammu and Kashmir",
  "Ladakh", "Lakshadweep", "Puducherry"
];
const ENABLED_STATES = ["Maharashtra", "Karnataka", "Delhi", "West Bengal"];

export default function ToAddress() {
  const navigate = useNavigate();
  const { state } = useLocation();

  const phoneNumber = state?.phoneNumber || localStorage.getItem("PHONE_NUMBER") || "";
  const userType = state?.userType;
  const from = state?.from;
  const distance = state?.distance || "";

  const [loading, setLoading] = useState(false);
  const [to, setTo] = useState({
    houseNumber: "",
    street: "",
    area: "",
    city: "",
    state: "",
    postalCode: "",
    latitude: state?.toLatitude || null,
    longitude: state?.toLongitude || null,
  });

  const [errors, setErrors] = useState({});

  const parseComponents = (components) => {
    const get = (...types) => {
      for (const type of types) {
        const c = components.find((c) => c.types.includes(type));
        if (c) return c.long_name;
      }
      return "";
    };

    const houseNumber = [get("subpremise"), get("premise")].filter(Boolean).join(", ");
    const street      = get("route", "sublocality_level_2");
    const area        = get("sublocality_level_1", "sublocality", "neighborhood");
    const city        = get("locality", "administrative_area_level_2");
    const stateName   = get("administrative_area_level_1");
    const postalCode  = get("postal_code");

    const matchedState = indianStates.find(
      (s) => s.toLowerCase() === stateName.toLowerCase()
    ) || stateName;

    return { houseNumber, street, area, city, state: matchedState, postalCode };
  };

  useEffect(() => {
    const toComponents = state?.toComponents || [];
    if (toComponents.length > 0) {
      const parsed = parseComponents(toComponents);
      setTo((prev) => ({ ...prev, ...parsed }));
    }
  }, [state]);
  

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
    if (to.postalCode && !/^\d{6}$/.test(to.postalCode)) {
      newErrors.postalCode = "Must be 6 digits";
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      const first = Object.values(newErrors)[0];
      showToast(first === "Required" ? "Please fill all required fields" : first, "warning");
    }
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateFields()) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (userType === "TRAVELER") {
        navigate("/flight-details", { state: { phoneNumber, userType, from, to, distance } });
      } else if(userType === "SENDER"){
        navigate("/item-details", { state: { phoneNumber, userType, from, to, distance, panDetails: state?.panDetails } });
      }
      else{
        console.log("User type undefined!", userType);
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
        <StepIndicator current={4} total={5} label="Drop address" />
        <h3 className="addr-title">To Address</h3>

        <div className="addr-field">
          <label className="addr-label">House / Flat Number</label>
          <input name="houseNumber" value={to.houseNumber} onChange={handleChange} placeholder="e.g. 12B, Flat 3" className={`addr-input ${errors.houseNumber ? "error" : ""}`} />
        </div>

        <div className="addr-field">
          <label className="addr-label">Street / Locality</label>
          <input name="street" value={to.street} onChange={handleChange} placeholder="e.g. MG Road" className={`addr-input ${errors.street ? "error" : ""}`} />
        </div>

        <div className="addr-field">
          <label className="addr-label">Area / Landmark</label>
          <input name="area" value={to.area} onChange={handleChange} placeholder="e.g. Near City Mall" className={`addr-input ${errors.area ? "error" : ""}`} />
        </div>

        <div className="addr-field">
          <label className="addr-label">City</label>
          <input name="city" value={to.city} onChange={handleChange} placeholder="e.g. Delhi" className={`addr-input ${errors.city ? "error" : ""}`} />
        </div>

        <div className="addr-field">
          <label className="addr-label">State</label>
          <select name="state" value={to.state} onChange={handleChange} className={`addr-input ${errors.state ? "error" : ""}`}>
            <option value="">Select State</option>
            {indianStates.map((s, i) => {
              const isEnabled = ENABLED_STATES.includes(s);
              return (
                <option key={i} value={s} disabled={!isEnabled} style={{ color: isEnabled ? "#000" : "#aaa" }}>
                  {s} {!isEnabled ? " (Coming Soon)" : ""}
                </option>
              );
            })}
          </select>
        </div>

        <div className="addr-field">
          <label className="addr-label">Postal Code</label>
          <input name="postalCode" value={to.postalCode} onChange={handleChange} placeholder="e.g. 110001" className={`addr-input ${errors.postalCode ? "error" : ""}`} />
        </div>

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
