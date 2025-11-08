import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./Address.css";
import Loader from "./Loader";
import { callSaveTraveler } from "../firebaseConfig";

export default function ToAddress() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const phoneNumber = state?.phoneNumber || window.localStorage.getItem("PHONE_NUMBER");
  const initialFrom = state?.from;

  const [to, setTo] = useState({
    houseNumber: "",
    street: "",
    area: "",
    postalCode: "",
    city: "",
    state: "",
    latitude: initialFrom?.latitude || null,
    longitude: initialFrom?.longitude || null,
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setTo({ ...to, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    if (!to.city || !to.postalCode) {
      alert("Please fill city and postal code for destination");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        phoneNumber,
        from: initialFrom,
        to,
        meta: { source: "web", createdBy: phoneNumber },
      };
  
      const res = await fetch(
        "https://us-central1-bhejochalo-3d292.cloudfunctions.net/saveTraveler",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
  
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Server error");
  
      alert(`Traveler saved successfully! Distance: ${data.distanceKm} km`);
      navigate("/pnr-check", { state: { phoneNumber } });
    } catch (err) {
      console.error("Error saving traveler:", err);
      alert("Something went wrong while saving traveler.");
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <div className="addr-container">
      {loading && <Loader />}
      <div className="addr-card">
        <h3 className="addr-title">To Address</h3>

        <input name="houseNumber" value={to.houseNumber} onChange={handleChange} placeholder="House number" />
        <input name="street" value={to.street} onChange={handleChange} placeholder="Street" />
        <input name="area" value={to.area} onChange={handleChange} placeholder="Area / Locality" />
        <input name="postalCode" value={to.postalCode} onChange={handleChange} placeholder="Postal Code" />
        <input name="city" value={to.city} onChange={handleChange} placeholder="City" />
        <input name="state" value={to.state} onChange={handleChange} placeholder="State" />

        <div className="distance-bubble">
          <strong>Approx distance:</strong> <span className="distance">11 km</span>
        </div>

        <button className="addr-next" onClick={handleSubmit}>Next</button>
      </div>
    </div>
  );
}
