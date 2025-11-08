import React, { useEffect, useRef, useState } from "react";
import "./AutoCompleteAddress.css";
import logo from "../assets/turantx-logo.png";
import Loader from "./Loader";
import { useNavigate, useLocation } from "react-router-dom";

const GOOGLE_SCRIPT_ID = "google-maps-script";

function loadGoogleMaps(apiKey) {
  return new Promise((resolve, reject) => {
    if (window.google && window.google.maps && window.google.maps.places) {
      return resolve(window.google);
    }

    if (document.getElementById(GOOGLE_SCRIPT_ID)) {
      const checkInterval = setInterval(() => {
        if (window.google && window.google.maps && window.google.maps.places) {
          clearInterval(checkInterval);
          resolve(window.google);
        }
      }, 100);
      return;
    }

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

// ✅ Helper function to calculate Haversine distance (km)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (R * c).toFixed(1);
}

export default function AutoCompleteAddress() {
  const navigate = useNavigate();
  const location = useLocation();
  const userType = location.state?.userType || ""; // ✅ traveler or sender
  const phoneNumber = location.state?.phoneNumber || "";

  const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
  const fromRef = useRef(null);
  const toRef = useRef(null);
  const [fromAddress, setFromAddress] = useState("");
  const [toAddress, setToAddress] = useState("");
  const [fromCoords, setFromCoords] = useState(null);
  const [toCoords, setToCoords] = useState(null);
  const [distance, setDistance] = useState(null);
  const [loading, setLoading] = useState(false);
  const geocoder = useRef(null);

  // ✅ Load Google Maps
  useEffect(() => {
    if (!apiKey) return console.error("Missing API key in .env");
    loadGoogleMaps(apiKey).then((google) => {
      geocoder.current = new google.maps.Geocoder();
      initAutocomplete(google);
      autofillCurrentLocation(google);
    });
  }, []);

  // ✅ Initialize Google Autocomplete
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
      const place = fromAuto.getPlace();
      if (place.formatted_address && place.geometry) {
        setFromAddress(place.formatted_address);
        setFromCoords({
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        });
      }
    });

    toAuto.addListener("place_changed", () => {
      const place = toAuto.getPlace();
      if (place.formatted_address && place.geometry) {
        setToAddress(place.formatted_address);
        setToCoords({
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        });
      }
    });
  };

  // ✅ Autofill user's current location
  const autofillCurrentLocation = (google) => {
    if (!navigator.geolocation || !geocoder.current) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latlng = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        geocoder.current.geocode({ location: latlng }, (results, status) => {
          if (status === "OK" && results[0]) {
            setFromAddress(results[0].formatted_address);
            setFromCoords(latlng);
            fromRef.current.value = results[0].formatted_address;
          }
        });
      },
      () => console.warn("Location permission denied or unavailable")
    );
  };

  // ✅ Automatically calculate distance
  useEffect(() => {
    if (fromCoords && toCoords) {
      const dist = calculateDistance(
        fromCoords.lat,
        fromCoords.lng,
        toCoords.lat,
        toCoords.lng
      );
      setDistance(dist);
    }
  }, [fromCoords, toCoords]);

  // ✅ Handle Next
  const handleNext = () => {
    if (!fromAddress || !toAddress) return;
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      navigate("/from-address", {
        state: { phoneNumber, fromAddress, toAddress, distance, userType },
      });
    }, 1200);
  };

  return (
    <div className="auto-page">
      {loading && <Loader />}
      <div className="auto-card">
        <img src={logo} alt="TurantX Logo" className="auto-logo" />

        <h2 className="auto-title">
          Enter Your Route ✈️
        </h2>

        <div className="auto-fields">
          <input
            ref={fromRef}
            type="text"
            placeholder="From Address"
            defaultValue={fromAddress}
            className="field-input"
          />
          <input
            ref={toRef}
            type="text"
            placeholder="To Address"
            defaultValue={toAddress}
            className="field-input"
          />
        </div>

        {/* ✅ Auto distance display */}
        {distance && (
          <div className="distance-box">
            <div className="distance-inner">
              <span className="plane-icon">🛫</span>
              <h3>{distance} km</h3>
              <p>Approx travel distance between locations</p>
            </div>
          </div>
        )}

        <button
          className={`next-btn ${fromAddress && toAddress ? "active" : ""}`}
          onClick={handleNext}
          disabled={!fromAddress || !toAddress}
        >
          Next
        </button>
      </div>
    </div>
  );
}
