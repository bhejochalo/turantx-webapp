import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Loader from "./Loader";
import "./Address.css";

export default function FromAddress() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const phoneNumber = state?.phoneNumber;
  const userType = state?.userType;

  const fromAutoRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [from, setFrom] = useState({
    houseNumber: "",
    street: "",
    area: "",
    postalCode: "",
    city: "",
    state: "",
    latitude: null,
    longitude: null,
  });

  // ✅ Initialize new Google PlaceAutocompleteElement
  useEffect(() => {
    if (!window.customElements.get("gmpx-place-autocomplete")) return;

    const autocompleteEl = document.createElement("gmpx-place-autocomplete");
    autocompleteEl.placeholder = "Search From Address";
    autocompleteEl.style.width = "100%";
    fromAutoRef.current.appendChild(autocompleteEl);

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

          setFrom({
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

  const handleNext = () => {
    if (!from.city || !from.postalCode) {
      alert("Please select a valid address");
      return;
    }
    navigate("/to-address", { state: { phoneNumber, userType, from } });
  };

  return (
    <div className="addr-container">
      {loading && <Loader />}
      <div className="addr-card">
        <h3 className="addr-title">From Address</h3>

        <div ref={fromAutoRef}></div>

        {["houseNumber", "street", "area", "postalCode", "city", "state"].map(
          (f) => (
            <input
              key={f}
              name={f}
              value={from[f] || ""}
              onChange={(e) => setFrom({ ...from, [f]: e.target.value })}
              placeholder={f.replace(/([A-Z])/g, " $1")}
            />
          )
        )}

        <button className="addr-next" onClick={handleNext}>
          Next
        </button>
      </div>
    </div>
  );
}
