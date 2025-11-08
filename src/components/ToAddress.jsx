import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./Address.css";
import Loader from "./Loader";

export default function ToAddress() {
  const navigate = useNavigate();
  const { state } = useLocation();

  const phoneNumber = state?.phoneNumber;
  const userType = state?.userType;
  const from = state?.from;
  const toPlace = state?.toPlace; // ✅ Google place object
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

  const handleChange = (e) =>
    setTo({ ...to, [e.target.name]: e.target.value });

  const handleNext = () => {
    if (!to.city || !to.state) {
      alert("Please fill all required fields!");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (userType === "TRAVELER") {
        navigate("/flight-details", {
          state: { phoneNumber, userType, from, to, distance },
        });
      } else if (userType === "SENDER") {
        navigate("/item-details", {
          state: { phoneNumber, userType, from, to, distance },
        });
      }
    }, 800);
  };

  const handleBack = () => {
    navigate("/from-address", {
      state: { phoneNumber, userType, from },
    });
  };

  return (
    <div className="addr-container">
      {loading && <Loader />}
      <div className="addr-card">
        <h3 className="addr-title">To Address</h3>

        <input
          name="houseNumber"
          value={to.houseNumber}
          onChange={handleChange}
          placeholder="House / Flat Number"
          className="addr-input"
        />
        <input
          name="street"
          value={to.street}
          onChange={handleChange}
          placeholder="Street / Locality"
          className="addr-input"
        />
        <input
          name="area"
          value={to.area}
          onChange={handleChange}
          placeholder="Area / Landmark"
          className="addr-input"
        />
        <input
          name="city"
          value={to.city}
          onChange={handleChange}
          placeholder="City"
          className="addr-input"
        />
        <input
          name="state"
          value={to.state}
          onChange={handleChange}
          placeholder="State"
          className="addr-input"
        />
        <input
          name="postalCode"
          value={to.postalCode}
          onChange={handleChange}
          placeholder="Postal Code"
          className="addr-input"
        />

        {distance && (
          <div className="distance-bubble">
            <strong>Approx Distance:</strong>{" "}
            <span className="distance">{distance} km</span>
          </div>
        )}

        <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
          <button
            className="addr-next"
            style={{ background: "#f2f2f2", color: "#555", flex: 1 }}
            onClick={handleBack}
          >
            Back
          </button>
          <button
            className="addr-next"
            style={{ flex: 2 }}
            onClick={handleNext}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
