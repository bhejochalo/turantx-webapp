import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Loader from "./Loader";
import "./Address.css";

export default function FromAddress() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const phoneNumber = state?.phoneNumber;
  const fromPlace = state?.fromPlace;
  const toPlace = state?.toPlace;
  const userType = state?.userType;

  const [loading] = useState(false);
  const [from, setFrom] = useState({});

  useEffect(() => {
    if (fromPlace)
      setFrom({
        street: fromPlace.name || "",
        city: fromPlace.address_components?.find((c) => c.types.includes("locality"))?.long_name || "",
        state: fromPlace.address_components?.find((c) => c.types.includes("administrative_area_level_1"))?.long_name || "",
        postalCode: fromPlace.address_components?.find((c) => c.types.includes("postal_code"))?.long_name || "",
        latitude: fromPlace.geometry?.location?.lat(),
        longitude: fromPlace.geometry?.location?.lng(),
      });
  }, [fromPlace]);

  const handleChange = (e) => setFrom({ ...from, [e.target.name]: e.target.value });
  const handleNext = () => navigate("/to-address", { state: { phoneNumber, userType, from, toPlace } });

  return (
    <div className="addr-container page-transition">
      {loading && <Loader />}
      <div className="addr-card">
        <h3 className="addr-title">From Address</h3>
        {["street", "city", "state", "postalCode"].map((f) => (
          <input key={f} name={f} value={from[f] || ""} onChange={handleChange} placeholder={f} />
        ))}
        <button className="addr-next" onClick={handleNext}>Next</button>
      </div>
    </div>
  );
}
