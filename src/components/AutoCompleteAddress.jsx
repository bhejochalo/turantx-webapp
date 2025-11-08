import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Loader from "./Loader";
import logo from "../assets/turantx-logo.png";
import "./AutoCompleteAddress.css";

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
      }, 200);
      return;
    }

    const script = document.createElement("script");
    script.id = GOOGLE_SCRIPT_ID;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google);
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// ✅ Calculate haversine distance
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1);
}

export default function AutoCompleteAddress() {
  const navigate = useNavigate();
  const location = useLocation();
  const phoneNumber = location.state?.phoneNumber || "";

  const [fromAddress, setFromAddress] = useState("");
  const [toAddress, setToAddress] = useState("");
  const [fromCoords, setFromCoords] = useState(null);
  const [toCoords, setToCoords] = useState(null);
  const [distance, setDistance] = useState(null);
  const [loading, setLoading] = useState(false);
  const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

  const fromRef = useRef(null);
  const toRef = useRef(null);
  const geocoder = useRef(null);

  useEffect(() => {
    if (!apiKey) return console.error("Missing Google Maps API key!");

    loadGoogleMaps(apiKey).then((google) => {
      geocoder.current = new google.maps.Geocoder();
      initPlaceElements(google);
      autofillCurrentLocation(google);
    });
  }, []);

  const initPlaceElements = (google) => {
    const fromEl = document.createElement("gmpx-place-autocomplete");
    fromEl.id = "from-autocomplete";
    fromEl.classList.add("gmpx-autocomplete");
    fromEl.placeholder = "From Address";

    const toEl = document.createElement("gmpx-place-autocomplete");
    toEl.id = "to-autocomplete";
    toEl.classList.add("gmpx-autocomplete");
    toEl.placeholder = "To Address";

    fromRef.current.appendChild(fromEl);
    toRef.current.appendChild(toEl);

    // 🧭 FROM
    fromEl.addEventListener("gmpx-placechange", () => {
      const place = fromEl.value;
      if (place) {
        const service = new google.maps.places.PlacesService(
          document.createElement("div")
        );
        service.getDetails({ placeId: place.placeId }, (details, status) => {
          if (status === "OK" && details.geometry) {
            setFromAddress(details.formatted_address);
            setFromCoords({
              lat: details.geometry.location.lat(),
              lng: details.geometry.location.lng(),
            });
          }
        });
      }
    });

    // 🧭 TO
    toEl.addEventListener("gmpx-placechange", () => {
      const place = toEl.value;
      if (place) {
        const service = new google.maps.places.PlacesService(
          document.createElement("div")
        );
        service.getDetails({ placeId: place.placeId }, (details, status) => {
          if (status === "OK" && details.geometry) {
            setToAddress(details.formatted_address);
            setToCoords({
              lat: details.geometry.location.lat(),
              lng: details.geometry.location.lng(),
            });
          }
        });
      }
    });
  };

  // 🔍 Autofill current location
  const autofillCurrentLocation = (google) => {
    if (!navigator.geolocation || !geocoder.current) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latlng = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        geocoder.current.geocode({ location: latlng }, (results, status) => {
          if (status === "OK" && results[0]) {
            setFromAddress(results[0].formatted_address);
            setFromCoords(latlng);
            const fromInput = document.querySelector("#from-autocomplete");
            if (fromInput) fromInput.value = results[0].formatted_address;
          }
        });
      },
      () => console.warn("📍 Location access denied.")
    );
  };

  // 🧮 Auto calculate distance
  useEffect(() => {
    if (fromCoords && toCoords) {
      setDistance(
        calculateDistance(
          fromCoords.lat,
          fromCoords.lng,
          toCoords.lat,
          toCoords.lng
        )
      );
    }
  }, [fromCoords, toCoords]);

  const handleNext = () => {
    if (!fromAddress || !toAddress) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigate("/from-address", {
        state: {
          phoneNumber,
          userType,
          fromPlace: fromPlaceRef.current,
          toPlace: toPlaceRef.current,
          distance,
        },
      });
    }, 1200);
  };

  return (
    <div className="auto-page">
      {loading && <Loader />}
      <div className="auto-card">
        <img src={logo} alt="TurantX" className="auto-logo" />
        <h2 className="auto-title">Enter Destination ✈️</h2>

        <div ref={fromRef}></div>
        <div ref={toRef}></div>

        {distance && (
          <div className="distance-box">
            <span className="plane-icon">🛫</span>
            <h3>{distance} km</h3>
            <p>Approx travel distance</p>
          </div>
        )}

        <button
          className={`next-btn ${fromAddress && toAddress ? "active" : ""}`}
          onClick={handleNext}
        >
          Next
        </button>
      </div>
    </div>
  );
}
