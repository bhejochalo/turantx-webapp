import React, { useEffect, useRef, useState, useCallback } from "react";
import "./AutoCompleteAddress.css";
import { useNavigate, useLocation } from "react-router-dom";
import StepIndicator from "./StepIndicator";

const GOOGLE_SCRIPT_ID = "google-maps-script";

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
  if (a.includes("bengaluru") || a.includes("bangalore")) return "Bangalore";
  if (a.includes("mumbai")) return "Mumbai";
  if (a.includes("pune")) return "Pune";
  if (a.includes("kolkata")) return "Kolkata";
  if (a.includes("new delhi") || a.includes("delhi")) return "Delhi";
  return null;
};

const getCityFromComponents = (components = []) => {
  const get = (...types) => {
    for (const type of types) {
      const c = components.find((comp) => comp.types.includes(type));
      if (c) return c.long_name;
    }
    return null;
  };
  const raw = get("locality", "administrative_area_level_2") || "";
  const r = raw.toLowerCase();
  if (r.includes("bengaluru") || r.includes("bangalore")) return "Bangalore";
  if (r.includes("mumbai")) return "Mumbai";
  if (r.includes("pune")) return "Pune";
  if (r.includes("kolkata")) return "Kolkata";
  if (r.includes("delhi")) return "Delhi";
  return raw || null;
};

const isAllowedCity = (description = "") => {
  const d = description.toLowerCase();
  return CITY_KEYWORDS.some((city) => d.includes(city));
};

export default function AutoCompleteAddress() {
  const navigate = useNavigate();
  const { state } = useLocation();

  const phoneNumber = state?.phoneNumber || localStorage.getItem("PHONE_NUMBER") || "";
  const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

  // Role state — pre-fill from navigation state or localStorage
  const [role, setRole] = useState(state?.userType || localStorage.getItem("USER_ROLE") || null);
  const [roleError, setRoleError] = useState(false);

  // Prefill addresses from sessionStorage (survives browser back)
  const savedAddrs = (() => {
    try {
      const s = sessionStorage.getItem("addressSelectionData");
      return s ? JSON.parse(s) : null;
    } catch { return null; }
  })();
  const prefill = (state?.from && state?.to) ? state : savedAddrs;

  const autocompleteService = useRef(null);
  const placesService = useRef(null);
  const debounceTimer = useRef(null);

  const [fromInput, setFromInput] = useState(prefill?.from?.fullAddress || "");
  const [toInput, setToInput] = useState(prefill?.to?.fullAddress || "");
  const [fromSuggestions, setFromSuggestions] = useState([]);
  const [toSuggestions, setToSuggestions] = useState([]);
  const [showFromDrop, setShowFromDrop] = useState(false);
  const [showToDrop, setShowToDrop] = useState(false);

  const [fromAddress, setFromAddress] = useState(prefill?.from?.fullAddress || "");
  const [toAddress, setToAddress] = useState(prefill?.to?.fullAddress || "");
  const [fromCoords, setFromCoords] = useState(
    prefill?.from ? { lat: prefill.from.latitude, lng: prefill.from.longitude } : null
  );
  const [toCoords, setToCoords] = useState(
    prefill?.to ? { lat: prefill.to.latitude, lng: prefill.to.longitude } : null
  );
  const [fromComponents, setFromComponents] = useState([]);
  const [toComponents, setToComponents] = useState([]);
  const [fromCity, setFromCity] = useState(prefill?.from?.city || null);
  const [toCity, setToCity] = useState(prefill?.to?.city || null);
  const [distance, setDistance] = useState(prefill?.distance || null);
  const [error, setError] = useState("");
  const [apiError, setApiError] = useState(false);

  useEffect(() => {
    loadGoogleMaps(apiKey)
      .then((google) => {
        autocompleteService.current = new google.maps.places.AutocompleteService();
        placesService.current = new google.maps.places.PlacesService(
          document.createElement("div")
        );
      })
      .catch(() => setApiError(true));
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
            const filtered = predictions.filter((p) => isAllowedCity(p.description));
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
        const cityFromDesc = extractCity(prediction.description)
          || getCityFromComponents(components)
          || extractCity(address);

        if (type === "from") {
          setFromInput(address); setFromAddress(address);
          setFromCoords(coords); setFromComponents(components);
          setFromCity(cityFromDesc);
          setFromSuggestions([]); setShowFromDrop(false);
        } else {
          setToInput(address); setToAddress(address);
          setToCoords(coords); setToComponents(components);
          setToCity(cityFromDesc);
          setToSuggestions([]); setShowToDrop(false);
        }
      }
    );
  };

  // Persist addresses to sessionStorage so they survive Back navigation
  useEffect(() => {
    const fromData = fromAddress ? {
      fullAddress: fromAddress, city: fromCity,
      latitude: fromCoords?.lat || null, longitude: fromCoords?.lng || null,
    } : null;
    const toData = toAddress ? {
      fullAddress: toAddress, city: toCity,
      latitude: toCoords?.lat || null, longitude: toCoords?.lng || null,
    } : null;

    if (!fromData && !toData) {
      sessionStorage.removeItem("addressSelectionData");
    } else {
      sessionStorage.setItem("addressSelectionData", JSON.stringify({ from: fromData, to: toData, distance }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromAddress, toAddress]);

  // Same-city / distance check
  useEffect(() => {
    if (!fromAddress || !toAddress) return;

    if (fromCity && toCity && fromCity === toCity) {
      setError("Pickup and destination cities must be different.");
      setDistance(null);
      return;
    }

    setError("");
    setDistance(
      calculateDistance(fromCoords.lat, fromCoords.lng, toCoords.lat, toCoords.lng)
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromCity, toCity, fromAddress, toAddress]);

  const clearFrom = () => {
    setFromInput(""); setFromAddress(""); setFromCity(null);
    setFromCoords(null); setFromComponents([]);
    setFromSuggestions([]); setShowFromDrop(false);
    setDistance(null); setError("");
  };

  const clearTo = () => {
    setToInput(""); setToAddress(""); setToCity(null);
    setToCoords(null); setToComponents([]);
    setToSuggestions([]); setShowToDrop(false);
    setDistance(null); setError("");
  };

  const handleNext = () => {
    if (!role) { setRoleError(true); return; }
    if (error || !fromAddress || !toAddress) return;

    const resolvedPhone = phoneNumber || localStorage.getItem("PHONE_NUMBER") || "";
    localStorage.setItem("USER_ROLE", role);

    const from = {
      city: fromCity || getCityFromComponents(fromComponents) || extractCity(fromAddress) || fromAddress,
      fullAddress: fromAddress,
      latitude: fromCoords?.lat || null,
      longitude: fromCoords?.lng || null,
    };
    const to = {
      city: toCity || getCityFromComponents(toComponents) || extractCity(toAddress) || toAddress,
      fullAddress: toAddress,
      latitude: toCoords?.lat || null,
      longitude: toCoords?.lng || null,
    };

    if (role === "SENDER") {
      navigate("/item-details", { state: { phoneNumber: resolvedPhone, userType: role, from, to, distance } });
    } else {
      navigate("/flight-details", { state: { phoneNumber: resolvedPhone, userType: role, from, to, distance } });
    }
  };

  const canProceed = role && distance && !error;

  return (
    <div className="auto-page">
      <div className="auto-card">
        <StepIndicator current={1} total={2} label="Role & route" />
        <h2 className="auto-title">Get Started ✈️</h2>

        {/* Role selection */}
        <p className="role-section-label">I want to…</p>
        <div className="role-cards">
          <button
            className={`role-card${role === "TRAVELER" ? " selected" : ""}`}
            onClick={() => { setRole("TRAVELER"); setRoleError(false); }}
          >
            <span className="role-icon">✈️</span>
            <span className="role-name">Travel & Earn</span>
            <span className="role-sub">Carry docs, get paid</span>
          </button>
          <button
            className={`role-card${role === "SENDER" ? " selected" : ""}`}
            onClick={() => { setRole("SENDER"); setRoleError(false); }}
          >
            <span className="role-icon">📦</span>
            <span className="role-name">Send Package</span>
            <span className="role-sub">Fast, trusted delivery</span>
          </button>
        </div>
        {roleError && <p className="role-error-msg">Please select a role to continue</p>}

        {/* Operating cities — route visual */}
        <div className="city-route-wrap">
          <p className="city-route-label">We operate between</p>
          <div className="city-route">
            {[
              { name: "Blr" },
              { name: "Mum" },
              { name: "Del" },
              { name: "Pune" },
              { name: "Kol" },
            ].map((city) => (
              <div key={city.name} className="city-stop">
                <div className="city-dot" />
                <span className="city-short">{city.name}</span>
              </div>
            ))}
          </div>
        </div>

        {apiError && (
          <div className="route-error">
            <span className="error-icon">⚠️</span>
            Unable to load address search. Please check your internet connection and refresh the page.
          </div>
        )}

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
              className={`auto-input${fromInput ? " has-value" : ""}`}
              placeholder="From address"
              value={fromInput}
              onChange={(e) => {
                setFromInput(e.target.value);
                setFromAddress(""); setFromCity(null);
                setDistance(null); setError("");
                fetchSuggestions(e.target.value, setFromSuggestions, setShowFromDrop);
              }}
              onFocus={() => fromSuggestions.length > 0 && setShowFromDrop(true)}
              onBlur={() => setTimeout(() => setShowFromDrop(false), 150)}
            />
            {fromInput && (
              <button
                className="addr-clear-btn"
                onMouseDown={(e) => { e.preventDefault(); clearFrom(); }}
                aria-label="Clear from address"
              >
                ×
              </button>
            )}
            {showFromDrop && fromSuggestions.length > 0 && (
              <ul className="autocomplete-dropdown">
                {fromSuggestions.map((p) => (
                  <li key={p.place_id} onMouseDown={() => selectSuggestion(p, "from")}>
                    <span className="suggestion-main">{p.structured_formatting?.main_text}</span>
                    <span className="suggestion-secondary">{p.structured_formatting?.secondary_text}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* TO */}
          <div className="autocomplete-wrapper">
            <input
              className={`auto-input${toInput ? " has-value" : ""}`}
              placeholder="To address"
              value={toInput}
              onChange={(e) => {
                setToInput(e.target.value);
                setToAddress(""); setToCity(null);
                setDistance(null); setError("");
                fetchSuggestions(e.target.value, setToSuggestions, setShowToDrop);
              }}
              onFocus={() => toSuggestions.length > 0 && setShowToDrop(true)}
              onBlur={() => setTimeout(() => setShowToDrop(false), 150)}
            />
            {toInput && (
              <button
                className="addr-clear-btn"
                onMouseDown={(e) => { e.preventDefault(); clearTo(); }}
                aria-label="Clear to address"
              >
                ×
              </button>
            )}
            {showToDrop && toSuggestions.length > 0 && (
              <ul className="autocomplete-dropdown">
                {toSuggestions.map((p) => (
                  <li key={p.place_id} onMouseDown={() => selectSuggestion(p, "to")}>
                    <span className="suggestion-main">{p.structured_formatting?.main_text}</span>
                    <span className="suggestion-secondary">{p.structured_formatting?.secondary_text}</span>
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

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            className="next-btn active"
            style={{ background: "#f2f2f2", color: "#555", flex: 1 }}
            onClick={() => navigate("/login")}
          >
            Back
          </button>
          <button
            className={`next-btn${canProceed ? " active" : ""}`}
            style={{ flex: 2 }}
            disabled={!canProceed}
            onClick={handleNext}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
