import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Loader from "./Loader";
import "./Address.css";

export default function ToAddress() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const phoneNumber = state?.phoneNumber;
  const from = state?.from;

  const toAutoRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [distance, setDistance] = useState(null);
  const [to, setTo] = useState({
    houseNumber: "",
    street: "",
    area: "",
    postalCode: "",
    city: "",
    state: "",
    latitude: null,
    longitude: null,
  });

  useEffect(() => {
    if (!window.customElements.get("gmpx-place-autocomplete")) return;

    const autocompleteEl = document.createElement("gmpx-place-autocomplete");
    autocompleteEl.placeholder = "Search To Address";
    autocompleteEl.style.width = "100%";
    toAutoRef.current.appendChild(autocompleteEl);

    autocompleteEl.addEventListener("gmpx-placechange", () => {
      const place = autocompleteEl.value;
      const service = new window.google.maps.places.PlacesService(
        document.createElement("div")
      );

      service.getDetails({ placeId: place.placeId }, (details, status) => {
        if (status === "OK" && details.geometry) {
          const comps = details.address_components || [];
          const get = (type) =>
            comps.find((c) => c.types.includes(type))?.long_name || "";

          setTo({
            street: get("route") || details.name || "",
            area:
              get("sublocality_level_1") ||
              get("locality") ||
              get("administrative_area_level_2"),
            postalCode: get("postal_code"),
            city: get("locality") || get("administrative_area_level_2"),
            state: get("administrative_area_level_1"),
            latitude: details.geometry.location.lat(),
            longitude: details.geometry.location.lng(),
          });
        }
      });
    });
  }, []);

  // ✅ Auto calculate distance
  useEffect(() => {
    if (from?.latitude && to?.latitude) {
      const R = 6371;
      const dLat = ((to.latitude - from.latitude) * Math.PI) / 180;
      const dLon = ((to.longitude - from.longitude) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((from.latitude * Math.PI) / 180) *
          Math.cos((to.latitude * Math.PI) / 180) *
          Math.sin(dLon / 2) ** 2;
      setDistance((R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1));
    }
  }, [from, to]);

  const handleSubmit = async () => {
    setLoading(true);
    const payload = {
      phoneNumber,
      from,
      to,
      meta: { source: "web", distance },
    };

    try {
      const res = await fetch(
        "https://us-central1-bhejochalo-3d292.cloudfunctions.net/saveTraveler",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save traveler");

      alert(`Traveler saved successfully! Distance: ${distance} km`);
      navigate("/pnr-check", { state: { phoneNumber } });
    } catch (err) {
      console.error("Error:", err);
      alert("Error saving traveler.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="addr-container">
      {loading && <Loader />}
      <div className="addr-card">
        <h3 className="addr-title">To Address</h3>

        <div ref={toAutoRef}></div>

        {["houseNumber", "street", "area", "postalCode", "city", "state"].map(
          (f) => (
            <input
              key={f}
              name={f}
              value={to[f] || ""}
              onChange={(e) => setTo({ ...to, [f]: e.target.value })}
              placeholder={f.replace(/([A-Z])/g, " $1")}
            />
          )
        )}

        {distance && (
          <div className="distance-bubble">
            <strong>Approx Distance:</strong>{" "}
            <span className="distance">{distance} km</span>
          </div>
        )}

        <button className="addr-next" onClick={handleSubmit}>
          Save & Continue
        </button>
      </div>
    </div>
  );
}
