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
    script.onload = () => {
      if (window.google && window.google.maps) resolve(window.google);
      else reject(new Error("Google Maps failed to load"));
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

export default function AutoCompleteAddress() {
  const navigate = useNavigate();
  const location = useLocation();
  const phoneNumber = location.state?.phoneNumber || "";

  const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
  const fromRef = useRef(null);
  const toRef = useRef(null);
  const [fromAddress, setFromAddress] = useState("");
  const [toAddress, setToAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const geocoder = useRef(null);

  // load google script
  useEffect(() => {
    if (!apiKey) {
      console.error("❌ Missing REACT_APP_GOOGLE_MAPS_API_KEY in .env");
      return;
    }
    loadGoogleMaps(apiKey).then((google) => {
      geocoder.current = new google.maps.Geocoder();
      initAutocomplete(google);
      autofillCurrentLocation(google);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initAutocomplete = (google) => {
    if (!fromRef.current || !toRef.current) return;

    const fromAutocomplete = new google.maps.places.Autocomplete(fromRef.current, {
      componentRestrictions: { country: "IN" },
      fields: ["formatted_address", "geometry"],
    });

    const toAutocomplete = new google.maps.places.Autocomplete(toRef.current, {
      componentRestrictions: { country: "IN" },
      fields: ["formatted_address", "geometry"],
    });

    fromAutocomplete.addListener("place_changed", () => {
      const place = fromAutocomplete.getPlace();
      setFromAddress(place.formatted_address || "");
    });

    toAutocomplete.addListener("place_changed", () => {
      const place = toAutocomplete.getPlace();
      setToAddress(place.formatted_address || "");
    });
  };

  const autofillCurrentLocation = (google) => {
    if (!navigator.geolocation || !geocoder.current) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latlng = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        geocoder.current.geocode({ location: latlng }, (results, status) => {
          if (status === "OK" && results[0]) {
            setFromAddress(results[0].formatted_address);
            fromRef.current.value = results[0].formatted_address;
          }
        });
      },
      () => console.warn("Location permission denied or unavailable")
    );
  };

  const handleNext = () => {
    if (!fromAddress || !toAddress) return;
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      navigate("/from-address", {
        state: {
          phoneNumber,
          fromAddress,
          toAddress,
        },
      });
    }, 1000);
  };

  return (
    <div className="auto-page">
      {loading && <Loader />}

      <div className="auto-card">
        <img src={logo} alt="TurantX Logo" className="auto-logo" />

        <h2 className="auto-title">
          Enter Destination <span className="plane">✈️</span>
        </h2>

        <div className="auto-fields">
          <input
            ref={fromRef}
            type="text"
            placeholder="From Address"
            value={fromAddress}
            onChange={(e) => setFromAddress(e.target.value)}
            className="field-input"
          />
          <input
            ref={toRef}
            type="text"
            placeholder="To Address"
            value={toAddress}
            onChange={(e) => setToAddress(e.target.value)}
            className="field-input"
          />
        </div>

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
