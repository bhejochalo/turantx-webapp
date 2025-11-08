import React, { useEffect, useState } from "react";
import "./TravelerList.css";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase"; // ✅ Ensure firebase.js exports initialized Firestore
import Loader from "./Loader";

export default function TravelerList() {
  const [travelers, setTravelers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTraveler, setSelectedTraveler] = useState(null);
  const [accepted, setAccepted] = useState(false);

  // ✅ Load all travelers
  useEffect(() => {
    const fetchTravelers = async () => {
      try {
        const usersRef = collection(db, "users");
        const userDocs = await getDocs(usersRef);

        const travelerList = [];

        for (const userDoc of userDocs.docs) {
          const travelerRef = collection(db, "users", userDoc.id, "Traveler");
          const travelerSnap = await getDocs(travelerRef);

          travelerSnap.forEach((doc) => {
            travelerList.push({
              id: doc.id,
              phone: userDoc.id,
              ...doc.data(),
            });
          });
        }

        setTravelers(travelerList);
      } catch (err) {
        console.error("Error fetching travelers:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTravelers();
  }, []);

  const handleBook = (traveler) => {
    if (!accepted) {
      alert("⚠️ Please accept the booking terms before continuing.");
      return;
    }

    alert(`✅ Booking request sent for traveler ${traveler.flightDetails?.firstName || "Traveler"}`);
    setSelectedTraveler(null);
  };

  return (
    <div className="traveler-page">
      {loading && <Loader />}

      <h2 className="traveler-title">Traveler’s List</h2>

      <div className="traveler-list">
        {travelers.map((t, i) => (
          <div key={i} className="traveler-card">
            <div className="traveler-info">
              <h4>{t.flightDetails?.firstName || "Traveler"}</h4>
              <p>Airline: {t.flightDetails?.airline || "Not specified"}</p>
              <p>Leaving Time: {t.flightDetails?.departureTime || "N/A"}</p>
              <p>Weight Upto: {t.flightDetails?.baggageSpace || 0} kg</p>
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
        ))}
      </div>

      {/* ✅ Modal for details */}
      {selectedTraveler && (
        <div className="traveler-modal-overlay" onClick={() => setSelectedTraveler(null)}>
          <div className="traveler-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setSelectedTraveler(null)}>×</button>

            <h3>{selectedTraveler.flightDetails?.firstName || "Traveler"}</h3>
            <p>
              <strong>Airline:</strong> {selectedTraveler.flightDetails?.airline || "N/A"}
            </p>
            <p>
              <strong>Flight:</strong> {selectedTraveler.flightDetails?.departureTime || "N/A"}
            </p>
            <p>
              <strong>Date:</strong> {selectedTraveler.flightDetails?.travelDate || "N/A"}
            </p>
            <p>
              <strong>Available Weight:</strong> {selectedTraveler.flightDetails?.baggageSpace || "0"} kg
            </p>
            <p>
              <strong>Carry Type:</strong> {selectedTraveler.flightDetails?.carryType || "Not specified"}
            </p>
            <p>
              <strong>Remarks:</strong> {selectedTraveler.flightDetails?.remarks || "None"}
            </p>

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
