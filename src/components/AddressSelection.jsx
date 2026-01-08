import React, { useEffect, useRef, useState } from "react";
import "./AutoCompleteAddress.css";
import logo from "../assets/turantx-logo.png";
import Loader from "./Loader";
import { useNavigate, useLocation } from "react-router-dom";

const GOOGLE_SCRIPT_ID = "google-maps-script";

const ALLOWED_CITIES = ["pune", "mumbai", "delhi", "bangalore", "bengaluru"];

function loadGoogleMaps(apiKey) {
  return new Promise((resolve, reject) => {
    if (window.google?.maps?.places) return resolve(window.google);

    const script = document.createElement("script");
    script.id = GOOGLE_SCRIPT_ID;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google);
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lat2 - lat1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (R * c).toFixed(1);
}

// ✅ City normalizer
const extractCity = (address = "") => {
  const a = address.toLowerCase();
  if (a.includes("bengaluru") || a.includes("bangalore")) return "bangalore";
  return ALLOWED_CITIES.find((c) => a.includes(c)) || null;
};

export default function AutoCompleteAddress() {
  const navigate = useNavigate();
  const { state } = useLocation();

  const phoneNumber = state?.phoneNumber || "";
  const userType = state?.userType || "";

  const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

  const fromRef = useRef(null);
  const toRef = useRef(null);
  const geocoder = useRef(null);

  const [fromAddress, setFromAddress] = useState("");
  const [toAddress, setToAddress] = useState("");
  const [fromCoords, setFromCoords] = useState(null);
  const [toCoords, setToCoords] = useState(null);
  const [distance, setDistance] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadGoogleMaps(apiKey).then((google) => {
      geocoder.current = new google.maps.Geocoder();
      initAutocomplete(google);
    });
  }, []);

  const initAutocomplete = (google) => {
    const fromAuto = new google.maps.places.Autocomplete(fromRef.current, {
      componentRestrictions: { country: "IN" },
      fields: ["formatted_address", "geometry"],
    });

    const toAuto = new google.maps.places.Autocomplete(toRef.current, {
      componentRestrictions: { country: "IN" },
      fields: ["formatted_address", "geometry"],
    });

    fromAuto.addListener("place_changed", () => {
      const p = fromAuto.getPlace();
      handlePlaceSelect("from", p);
    });

    toAuto.addListener("place_changed", () => {
      const p = toAuto.getPlace();
      handlePlaceSelect("to", p);
    });
  };

  const handlePlaceSelect = (type, place) => {
    if (!place?.formatted_address || !place?.geometry) return;

    const city = extractCity(place.formatted_address);
    if (!city) {
      reset(type);
      setError("We currently operate only in Pune, Mumbai, Delhi & Bangalore.");
      return;
    }

    if (type === "from") {
      setFromAddress(place.formatted_address);
      setFromCoords({
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
      });
    } else {
      setToAddress(place.formatted_address);
      setToCoords({
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
      });
    }
  };

  const reset = (type) => {
    if (type === "from") {
      setFromAddress("");
      setFromCoords(null);
      fromRef.current.value = "";
    } else {
      setToAddress("");
      setToCoords(null);
      toRef.current.value = "";
    }
    setDistance(null);
  };

  // ✅ HARD SAME-CITY BLOCK
  useEffect(() => {
    if (!fromAddress || !toAddress) return;

    const fromCity = extractCity(fromAddress);
    const toCity = extractCity(toAddress);

    if (fromCity === toCity) {
      setError("Pickup and destination cities must be different.");
      setDistance(null);
      return;
    }

    setError("");
    setDistance(
      calculateDistance(
        fromCoords.lat,
        fromCoords.lng,
        toCoords.lat,
        toCoords.lng
      )
    );
  }, [fromAddress, toAddress]);

  const handleNext = () => {
    if (error || !fromAddress || !toAddress) return;

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigate("/from-address", {
        state: { phoneNumber, fromAddress, toAddress, distance, userType },
      });
    }, 1000);
  };

  return (
    <div className="auto-page">
      {loading && <Loader />}

      <div className="auto-card">
        <img src={logo} alt="TurantX" className="auto-logo" />

        <h2 className="auto-title">Enter Your Route ✈️</h2>

        {/* ✅ CLEAN INFO */}
        <div className="route-info">
  <span className="route-label">Operating Cities</span>
  <div className="route-cities">
    Pune · Mumbai · Delhi · Bangalore
  </div>
</div>


        {error && <div className="route-error">{error}</div>}

        <div className="auto-fields">
          <input ref={fromRef} placeholder="From address" />
          <input ref={toRef} placeholder="To address" />
        </div>

        {distance && (
          <div className="distance-box">
            <div className="distance-inner">
              <span className="plane-icon">🛫</span>
              <h3>{distance} km</h3>
              <p>Approx travel distance</p>
            </div>
          </div>
        )}


        <button
          className={`next-btn ${distance && !error ? "active" : ""}`}
          disabled={!distance || !!error}
          onClick={handleNext}
        >
          Next
        </button>
      </div>
      
    </div>
  );
}
