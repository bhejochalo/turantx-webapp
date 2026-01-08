import React, { useEffect, useRef, useState } from "react";
import "./AutoCompleteAddress.css";
import logo from "../assets/turantx-logo.png";
import Loader from "./Loader";
import { useNavigate } from "react-router-dom";

const GOOGLE_SCRIPT_ID = "google-maps-script";

const CITY_MAP = {
  pune: "Pune",
  mumbai: "Mumbai",
  delhi: "Delhi",
  bangalore: "Bangalore",
  bengaluru: "Bangalore",
};

const ALLOWED_ROUTES = [
  ["pune", "mumbai"],
  ["pune", "delhi"],
  ["pune", "bangalore"],
  ["mumbai", "delhi"],
  ["mumbai", "bangalore"],
  ["delhi", "bangalore"],
];

const normalizeCity = (address = "") => {
  const a = address.toLowerCase();
  return Object.keys(CITY_MAP).find((c) => a.includes(c)) || null;
};

const isRouteAllowed = (from, to) =>
  ALLOWED_ROUTES.some(
    ([a, b]) => (a === from && b === to) || (a === to && b === from)
  );

function loadGoogleMaps(apiKey) {
  return new Promise((resolve) => {
    if (window.google?.maps?.places) return resolve(window.google);
    const script = document.createElement("script");
    script.id = GOOGLE_SCRIPT_ID;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.onload = () => resolve(window.google);
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

export default function AutoCompleteAddress() {
  const navigate = useNavigate();
  const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

  const fromRef = useRef(null);
  const toRef = useRef(null);

  const [fromData, setFromData] = useState(null);
  const [toData, setToData] = useState(null);
  const [distance, setDistance] = useState(null);
  const [error, setError] = useState("");
  const [loading] = useState(false);

  useEffect(() => {
    loadGoogleMaps(apiKey).then((google) => {
      const fromAuto = new google.maps.places.Autocomplete(fromRef.current, {
        componentRestrictions: { country: "IN" },
        fields: ["formatted_address", "geometry"],
      });

      const toAuto = new google.maps.places.Autocomplete(toRef.current, {
        componentRestrictions: { country: "IN" },
        fields: ["formatted_address", "geometry"],
      });

      fromAuto.addListener("place_changed", () => {
        handleSelect("from", fromAuto.getPlace());
      });

      toAuto.addListener("place_changed", () => {
        handleSelect("to", toAuto.getPlace());
      });
    });
  }, []);

  const handleSelect = (type, place) => {
    if (!place?.formatted_address || !place?.geometry) return;

    const city = normalizeCity(place.formatted_address);
    if (!city) {
      setError("We operate only in Pune, Mumbai, Delhi & Bangalore.");
      setFromData(null);
      setToData(null);
      setDistance(null);
      return;
    }

    const data = {
      address: place.formatted_address,
      city,
      lat: place.geometry.location.lat(),
      lng: place.geometry.location.lng(),
    };

    if (type === "from") setFromData(data);
    else setToData(data);
  };

  useEffect(() => {
    if (!fromData || !toData) return;

    if (fromData.city === toData.city) {
      setError("Pickup and destination cities must be different.");
      setDistance(null);
      return;
    }

    if (!isRouteAllowed(fromData.city, toData.city)) {
      setError("This route is not supported yet.");
      setDistance(null);
      return;
    }

    setError("");
    setDistance(
      calculateDistance(
        fromData.lat,
        fromData.lng,
        toData.lat,
        toData.lng
      )
    );
  }, [fromData, toData]);

  return (
    <div className="auto-page">
      {loading && <Loader />}

      <div className="auto-card">
        <img src={logo} alt="TurantX" className="auto-logo" />
        <h2 className="auto-title">Enter Your Route ✈️</h2>

        <div className="route-info">
          <span className="route-label">Currently Operating Cities</span>
          <div className="route-cities">
            <span>Pune</span>
            <span>Mumbai</span>
            <span>Delhi</span>
            <span>Bangalore</span>
          </div>
        </div>

        {error && (
          <div className="route-error">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}

        <div className="auto-fields">
          <input
            ref={fromRef}
            className="auto-input"
            placeholder="From (select from suggestions)"
          />
          <input
            ref={toRef}
            className="auto-input"
            placeholder="To (select from suggestions)"
          />
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
          className="next-btn"
          disabled={!distance || !!error}
          onClick={() =>
            navigate("/from-address", {
              state: {
                fromAddress: fromData.address,
                toAddress: toData.address,
                distance,
              },
            })
          }
        >
          Next
        </button>
      </div>
    </div>
  );
}
