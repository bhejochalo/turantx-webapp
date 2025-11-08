import React, { useRef, useState } from "react";
import { LoadScript, Autocomplete } from "@react-google-maps/api";
import { useNavigate, useLocation } from "react-router-dom";
import Loader from "./Loader";
import "./AddressSelection.css";
import logo from "../assets/turantx-logo.png";

const libraries = ["places"];

export default function AddressSelection() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const phoneNumber = state?.phoneNumber;
  const userType = state?.userType || "TRAVELER";

  const [loading, setLoading] = useState(false);
  const fromRef = useRef(null);
  const toRef = useRef(null);
  const [from, setFrom] = useState(null);
  const [to, setTo] = useState(null);

  const onFromChanged = () => setFrom(fromRef.current.getPlace());
  const onToChanged = () => setTo(toRef.current.getPlace());

  const handleNext = () => {
    if (!from || !to) return alert("Please select both From and To address.");
  
    // ✅ Extract only serializable data
    const fromData = {
      address: from.formatted_address || from.name || "",
      latitude: from.geometry?.location?.lat(),
      longitude: from.geometry?.location?.lng(),
    };
  
    const toData = {
      address: to.formatted_address || to.name || "",
      latitude: to.geometry?.location?.lat(),
      longitude: to.geometry?.location?.lng(),
    };
  
    // ✅ Navigate with plain JSON (safe to clone)
    navigate("/from-address", {
      state: {
        phoneNumber,
        userType,
        fromPlace: fromData,
        toPlace: toData,
      },
    });
  };
  

  return (
    <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY} libraries={libraries}>
      <div className="addr-container page-transition">
        {loading && <Loader />}
        <div className="addr-card">
          <img src={logo} className="addr-logo" alt="TurantX" />
          <h3 className="addr-title">Enter Your Route ✈️</h3>

          <Autocomplete onLoad={(ac) => (fromRef.current = ac)} onPlaceChanged={onFromChanged}>
            <input className="addr-input" placeholder="From Address" />
          </Autocomplete>

          <Autocomplete onLoad={(ac) => (toRef.current = ac)} onPlaceChanged={onToChanged}>
            <input className="addr-input" placeholder="To Address" />
          </Autocomplete>

          <button className="addr-next" onClick={handleNext}>Next</button>
        </div>
      </div>
    </LoadScript>
  );
}
