import React, { useEffect, useRef, useState, useCallback } from "react";
import "./AutoCompleteAddress.css";
import logo from "../assets/turantx-logo.png";
import Loader from "./Loader";
import { useNavigate, useLocation } from "react-router-dom";

const GOOGLE_SCRIPT_ID = "google-maps-script";

const ALLOWED_CITIES = ["pune", "mumbai", "delhi", "bangalore", "bengaluru", "kolkata"];

// All keyword variants that must appear in a suggestion to be shown
const CITY_KEYWORDS = ["mumbai", "pune", "delhi", "new delhi", "bangalore", "bengaluru", "kolkata"];

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
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1);
}

const extractCity = (address = "") => {
  const a = address.toLowerCase();
  if (a.includes("bengaluru") || a.includes("bangalore")) return "bangalore";
  return ALLOWED_CITIES.find((c) => a.includes(c)) || null;
};

const isAllowedCity = (description = "") => {
  const d = description.toLowerCase();
  return CITY_KEYWORDS.some((city) => d.includes(city));
};

export default function AutoCompleteAddress() {
  const navigate = useNavigate();
  const { state } = useLocation();

  const phoneNumber = state?.phoneNumber || localStorage.getItem("PHONE_NUMBER") || "";
  const userType = state?.userType || "";
  const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

  const autocompleteService = useRef(null);
  const placesService = useRef(null);
  const debounceTimer = useRef(null);

  const [fromInput, setFromInput] = useState("");
  const [toInput, setToInput] = useState("");
  const [fromSuggestions, setFromSuggestions] = useState([]);
  const [toSuggestions, setToSuggestions] = useState([]);
  const [showFromDrop, setShowFromDrop] = useState(false);
  const [showToDrop, setShowToDrop] = useState(false);

  const [fromAddress, setFromAddress] = useState("");
  const [toAddress, setToAddress] = useState("");
  const [fromCoords, setFromCoords] = useState(null);
  const [toCoords, setToCoords] = useState(null);
  const [fromComponents, setFromComponents] = useState([]);
  const [toComponents, setToComponents] = useState([]);
  const [distance, setDistance] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadGoogleMaps(apiKey).then((google) => {
      autocompleteService.current = new google.maps.places.AutocompleteService();
      placesService.current = new google.maps.places.PlacesService(
        document.createElement("div")
      );
    });
  }, [apiKey]);

  const fetchSuggestions = useCallback((input, setSuggestions, setShow) => {
    if (!input || input.length < 2) {
      setSuggestions([]);
      setShow(false);
      return;
    }

    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      autocompleteService.current?.getPlacePredictions(
        { input, componentRestrictions: { country: "IN" } },
        (predictions, status) => {
          if (status === "OK" && predictions) {
            const filtered = predictions.filter((p) =>
              isAllowedCity(p.description)
            );
            setSuggestions(filtered);
            setShow(filtered.length > 0);
          } else {
            setSuggestions([]);
            setShow(false);
          }
        }
      );
    }, 250);
  }, []);

  const selectSuggestion = (prediction, type) => {
    placesService.current.getDetails(
      { placeId: prediction.place_id, fields: ["formatted_address", "geometry", "address_components"] },
      (place, status) => {
        if (status !== "OK" || !place?.geometry) return;

        const address = place.formatted_address;
        const coords = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        };
        const components = place.address_components || [];

        if (type === "from") {
          setFromInput(address);
          setFromAddress(address);
          setFromCoords(coords);
          setFromComponents(components);
          setFromSuggestions([]);
          setShowFromDrop(false);
        } else {
          setToInput(address);
          setToAddress(address);
          setToCoords(coords);
          setToComponents(components);
          setToSuggestions([]);
          setShowToDrop(false);
        }
      }
    );
  };

  // Same-city / distance check
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
      calculateDistance(fromCoords.lat, fromCoords.lng, toCoords.lat, toCoords.lng)
    );
  }, [fromAddress, toAddress]);

  const handleNext = () => {
    if (error || !fromAddress || !toAddress) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigate("/from-address", {
        state: { phoneNumber, fromAddress, toAddress, distance, userType, fromComponents, toComponents },
      });
    }, 1000);
  };

  return (
    <div className="auto-page">
      {loading && <Loader />}

      <div className="auto-card">
        <img src={logo} alt="TurantX" className="auto-logo" />
        <h2 className="auto-title">Enter Your Route ✈️</h2>

        <div className="route-info">
          <span className="route-label">Operating Cities</span>
          <div className="route-cities" style={{ fontSize: "12px" }}>
            <span>• Bangalore • Mumbai • Delhi • Pune • Kolkata</span>
          </div>
        </div>

        {error && (
          <div className="route-error">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}

        <div className="auto-fields">
          {/* FROM */}
          <div className="autocomplete-wrapper">
            <input
              className="auto-input"
              placeholder="From address"
              value={fromInput}
              onChange={(e) => {
                setFromInput(e.target.value);
                setFromAddress("");
                setDistance(null);
                setError("");
                fetchSuggestions(e.target.value, setFromSuggestions, setShowFromDrop);
              }}
              onFocus={() => fromSuggestions.length > 0 && setShowFromDrop(true)}
              onBlur={() => setTimeout(() => setShowFromDrop(false), 150)}
            />
            {showFromDrop && fromSuggestions.length > 0 && (
              <ul className="autocomplete-dropdown">
                {fromSuggestions.map((p) => (
                  <li key={p.place_id} onMouseDown={() => selectSuggestion(p, "from")}>
                    <span className="suggestion-main">
                      {p.structured_formatting?.main_text}
                    </span>
                    <span className="suggestion-secondary">
                      {p.structured_formatting?.secondary_text}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* TO */}
          <div className="autocomplete-wrapper">
            <input
              className="auto-input"
              placeholder="To address"
              value={toInput}
              onChange={(e) => {
                setToInput(e.target.value);
                setToAddress("");
                setDistance(null);
                setError("");
                fetchSuggestions(e.target.value, setToSuggestions, setShowToDrop);
              }}
              onFocus={() => toSuggestions.length > 0 && setShowToDrop(true)}
              onBlur={() => setTimeout(() => setShowToDrop(false), 150)}
            />
            {showToDrop && toSuggestions.length > 0 && (
              <ul className="autocomplete-dropdown">
                {toSuggestions.map((p) => (
                  <li key={p.place_id} onMouseDown={() => selectSuggestion(p, "to")}>
                    <span className="suggestion-main">
                      {p.structured_formatting?.main_text}
                    </span>
                    <span className="suggestion-secondary">
                      {p.structured_formatting?.secondary_text}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
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
