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
const ENABLED_STATES = ["Maharashtra", "Karnataka", "Delhi", "West Bengal"];

export default function FromAddress() {
  const navigate = useNavigate();
  const { state } = useLocation();

  const phoneNumber = state?.phoneNumber || localStorage.getItem("PHONE_NUMBER") || "";
  const userType = state?.userType;
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

  // Parse using Google address_components (reliable, language-independent)
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

    // Match state to enabled dropdown option
    const matchedState = indianStates.find(
      (s) => s.toLowerCase() === stateName.toLowerCase()
    ) || stateName;

    return { houseNumber, street, area, city, state: matchedState, postalCode };
  };

  useEffect(() => {
    const fromComponents = state?.fromComponents || [];
    if (fromComponents.length > 0) {
      const parsed = parseComponents(fromComponents);
      setFrom((prev) => ({ ...prev, ...parsed }));
    }
  }, [state]);

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
      state: { phoneNumber, userType, from, distance, toAddress, toComponents: state?.toComponents || [] }
    });
    
  };

  return (
    <div className="addr-container">
      {loading && <Loader />}
      <div className="addr-card">
        <h3 className="addr-title">From Address</h3>

        <div className="addr-field">
          <label className="addr-label">House / Flat Number</label>
          <input
            name="houseNumber"
            value={from.houseNumber}
            onChange={handleChange}
            placeholder="e.g. 12B, Flat 3"
            className={`addr-input ${errors.houseNumber ? "error" : ""}`}
          />
        </div>

        <div className="addr-field">
          <label className="addr-label">Street / Locality</label>
          <input
            name="street"
            value={from.street}
            onChange={handleChange}
            placeholder="e.g. MG Road"
            className={`addr-input ${errors.street ? "error" : ""}`}
          />
        </div>

        <div className="addr-field">
          <label className="addr-label">Area / Landmark</label>
          <input
            name="area"
            value={from.area}
            onChange={handleChange}
            placeholder="e.g. Near City Mall"
            className={`addr-input ${errors.area ? "error" : ""}`}
          />
        </div>

        <div className="addr-field">
          <label className="addr-label">City</label>
          <input
            name="city"
            value={from.city}
            onChange={handleChange}
            placeholder="e.g. Mumbai"
            className={`addr-input ${errors.city ? "error" : ""}`}
          />
        </div>

        <div className="addr-field">
          <label className="addr-label">State</label>
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
                <option key={i} value={s} disabled={!isEnabled} style={{ color: isEnabled ? "#000" : "#aaa" }}>
                  {s} {!isEnabled ? " (Coming Soon)" : ""}
                </option>
              );
            })}
          </select>
        </div>

        <div className="addr-field">
          <label className="addr-label">Postal Code</label>
          <input
            name="postalCode"
            value={from.postalCode}
            onChange={handleChange}
            placeholder="e.g. 400001"
            className={`addr-input ${errors.postalCode ? "error" : ""}`}
          />
        </div>

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
