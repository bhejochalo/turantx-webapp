import React, { useEffect, useState } from "react";
import "./TravelerList.css";
import { collection, doc, getDocs, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import Loader from "./Loader";

// ✅ Haversine distance calculator (in km)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(1));
};

export default function TravelerList() {
  const [travelers, setTravelers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTraveler, setSelectedTraveler] = useState(null);
  const [accepted, setAccepted] = useState(false);
  const [senderCoords, setSenderCoords] = useState(null);

  // ✅ 1️⃣ Get sender location (from state or Firestore)
  useEffect(() => {
    const storedSender = sessionStorage.getItem("senderCoords");
    if (storedSender) {
      setSenderCoords(JSON.parse(storedSender));
      return;
    }

    // Example fallback for testing (replace with your state/props later)
    setSenderCoords({
      from: { lat: 18.5204, lng: 73.8567 }, // Pune
      to: { lat: 19.076, lng: 72.8777 }, // Mumbai
    });
  }, []);

  // ✅ 2️⃣ Fetch travelers from Firestore
  useEffect(() => {
    const fetchTravelers = async () => {
      setLoading(true);
      try {
        const usersRef = collection(db, "users");
        const userDocs = await getDocs(usersRef);
        const travelerList = [];

        for (const userDoc of userDocs.docs) {
          const travelerRef = collection(db, "users", userDoc.id, "Traveler");
          const travelerSnap = await getDocs(travelerRef);
          travelerSnap.forEach((docSnap) => {
            const data = docSnap.data();
            travelerList.push({
              id: docSnap.id,
              phone: userDoc.id,
              ...data,
            });
          });
        }

        setTravelers(travelerList);
      } catch (err) {
        console.error("❌ Error fetching travelers:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTravelers();
  }, []);

  // ✅ 3️⃣ Calculate distances dynamically
  const getDistancePair = (traveler) => {
    if (!senderCoords) return { from: "–", to: "–" };
    const travelerFrom = traveler?.from?.coords;
    const travelerTo = traveler?.to?.coords;

    const fromDist = travelerFrom
      ? calculateDistance(
          senderCoords.from.lat,
          senderCoords.from.lng,
          travelerFrom.lat,
          travelerFrom.lng
        )
      : null;

    const toDist = travelerTo
      ? calculateDistance(
          senderCoords.to.lat,
          senderCoords.to.lng,
          travelerTo.lat,
          travelerTo.lng
        )
      : null;

    return {
      from: fromDist ? `${fromDist} km` : "–",
      to: toDist ? `${toDist} km` : "–",
    };
  };

  const handleBook = async (traveler) => {
    if (!accepted) {
      alert("⚠️ Please accept the booking terms before continuing.");
      return;
    }
  
    // ✅ Load Razorpay script dynamically
    const loadRazorpay = () => {
      return new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
      });
    };
  
    const res = await loadRazorpay();
    if (!res) {
      alert("Razorpay SDK failed to load. Please check your connection.");
      return;
    }
  
    const amount = 200 * 100; // ₹200 test amount
    const RAZORPAY_KEY = "rzp_test_4HNx49ek9VPhNQ";
  
    const options = {
      key: RAZORPAY_KEY,
      amount: amount.toString(),
      currency: "INR",
      name: "TurantX Booking",
      description: `Booking for ${traveler.flightDetails?.firstName || "Traveler"}`,
      image: "https://i.imgur.com/QzBfZpL.png",
      handler: function (response) {
        console.log("✅ Payment Successful:", response);
        alert("✅ Payment Successful! Your booking is confirmed.");
      },
      prefill: {
        name: "TurantX User",
        email: "user@example.com",
        contact: "9999999999",
      },
      theme: {
        color: "#ff7b29",
      },
    };
  
    const paymentObject = new window.Razorpay(options);
    paymentObject.open();
  };
  

  return (
    <div className="traveler-page">
      {loading && <Loader />}

      {!loading && (
        <>
          <h2 className="traveler-title">Traveler’s List</h2>

          <div className="traveler-list">
            {travelers.length === 0 ? (
              <p className="no-data">No travelers available currently.</p>
            ) : (
              travelers.map((t, i) => {
                const dist = getDistancePair(t);
                return (
                  <div
                    key={i}
                    className="traveler-card fade-in"
                    style={{ animationDelay: `${i * 0.12}s` }}
                  >
                    <div className="traveler-header">
                      <h4>{t.flightDetails?.firstName || "Traveler"}</h4>
                      <div className="distance-tags">
                        <span className="dist from">From: {dist.from}</span>
                        <span className="dist to">To: {dist.to}</span>
                      </div>
                    </div>

                    <div className="traveler-info">
                      <p>Airline: {t.flightDetails?.airline || "Not specified"}</p>
                      <p>PNR: {t.flightDetails?.pnr || "Not specified"}</p>
                      <p>Leaving Time: {t.flightDetails?.departureTime || "N/A"}</p>
                      <p>Weight Upto: {t.flightDetails?.baggageSpace || "0"} kg</p>
                    </div>

                    <div className="traveler-buttons">
                      <button
                        className="details-btn"
                        onClick={() => setSelectedTraveler(t)}
                      >
                        DETAILS
                      </button>
                      <button
                        className="book-btn"
                        onClick={() => setSelectedTraveler(t)}
                      >
                        Book
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {selectedTraveler && (
        <div
          className="traveler-modal-overlay"
          onClick={() => setSelectedTraveler(null)}
        >
          <div className="traveler-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="close-btn"
              onClick={() => setSelectedTraveler(null)}
            >
              ×
            </button>

            <h3>{selectedTraveler.flightDetails?.firstName || "Traveler"}</h3>
            <p><strong>Airline:</strong> {selectedTraveler.flightDetails?.airline || "N/A"}</p>
            <p><strong>Date:</strong> {selectedTraveler.flightDetails?.travelDate || "N/A"}</p>
            <p><strong>Departure:</strong> {selectedTraveler.flightDetails?.departureTime || "N/A"}</p>
            <p><strong>Available Weight:</strong> {selectedTraveler.flightDetails?.baggageSpace || "0"} kg</p>
            <p><strong>Carry Type:</strong> {selectedTraveler.flightDetails?.carryType || "Not specified"}</p>
            <p><strong>Remarks:</strong> {selectedTraveler.flightDetails?.remarks || "None"}</p>

            <label className="terms">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
              />{" "}
              I accept that booking cannot be cancelled
            </label>

            <button
              className={`book-now-btn ${accepted ? "active" : ""}`}
              disabled={!accepted}
              onClick={() => handleBook(selectedTraveler)}
            >
              Book Now
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
