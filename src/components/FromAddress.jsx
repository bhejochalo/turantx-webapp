import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./Address.css";
import Loader from "./Loader";

export default function FromAddress() {
  const navigate = useNavigate();
  const { state } = useLocation();

  const phoneNumber = state?.phoneNumber;
  const userType = state?.userType;
  const fromAddress = state?.fromAddress || ""; // ✅ from previous page
  const distance = state?.distance || "";

  const [loading] = useState(false);
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

  // ✅ Autofill From Address fields if available from AutoComplete
  useEffect(() => {
    if (fromAddress) {
      // Try to break address roughly into parts
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
  };

  const handleNext = () => {
    if (!from.city || !from.state) {
      alert("Please fill all required fields!");
      return;
    }

    navigate("/to-address", {
      state: { phoneNumber, userType, from, distance, panDetails: state?.panDetails },
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
          className="addr-input"
        />
        <input
          name="street"
          value={from.street}
          onChange={handleChange}
          placeholder="Street / Locality"
          className="addr-input"
        />
        <input
          name="area"
          value={from.area}
          onChange={handleChange}
          placeholder="Area / Landmark"
          className="addr-input"
        />
        <input
          name="city"
          value={from.city}
          onChange={handleChange}
          placeholder="City"
          className="addr-input"
        />
        <input
          name="state"
          value={from.state}
          onChange={handleChange}
          placeholder="State"
          className="addr-input"
        />
        <input
          name="postalCode"
          value={from.postalCode}
          onChange={handleChange}
          placeholder="Postal Code"
          className="addr-input"
        />

        {/* Optional distance display */}
        {distance && (
          <div className="distance-bubble">
            <strong>Approx Distance:</strong> <span className="distance">{distance} km</span>
          </div>
        )}

        <button className="addr-next" onClick={handleNext}>
          Next
        </button>
      </div>
    </div>
  );
}
