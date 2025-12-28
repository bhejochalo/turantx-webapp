import React, { useEffect, useState } from "react";
import { doc, getDoc, updateDoc, collection, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import "./SenderProfile.css";

const STORAGE_PHONE_KEY = "PHONE_NUMBER";

export default function SenderProfile() {
  const navigate = useNavigate();

  const [phoneNumber, setPhoneNumber] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sender, setSender] = useState(null);
  const [traveler, setTraveler] = useState(null);
  const [activeTab, setActiveTab] = useState("status");

  const [editType, setEditType] = useState(null); // from | to | item
  const [editForm, setEditForm] = useState({});

  /* ---------- LOAD PHONE ---------- */
  useEffect(() => {
    const pn =
      sessionStorage.getItem(STORAGE_PHONE_KEY) ||
      localStorage.getItem(STORAGE_PHONE_KEY);
    setPhoneNumber(pn);
  }, []);

  /* ---------- LOAD DATA ---------- */
  useEffect(() => {
    if (!phoneNumber) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        const senderRef = doc(db, "users", phoneNumber, "Sender", "details");
        const sSnap = await getDoc(senderRef);
        if (!sSnap.exists()) return;

        const senderData = sSnap.data();
        setSender(senderData);

        if (senderData.uniqueKey) {
          const usersSnap = await getDocs(collection(db, "users"));
          for (const u of usersSnap.docs) {
            const tRef = doc(db, "users", u.id, "Traveler", "details");
            const tSnap = await getDoc(tRef);
            if (
              tSnap.exists() &&
              tSnap.data().uniqueKey === senderData.uniqueKey
            ) {
              setTraveler({ phoneNumber: u.id, ...tSnap.data() });
              break;
            }
          }
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [phoneNumber]);

  /* ---------- HELPERS ---------- */
  const formatAddress = (a) =>
    a
      ? [a.houseNumber, a.street, a.area, a.city, a.state, a.postalCode]
          .filter(Boolean)
          .join(", ")
      : "N/A";

  const openEdit = (type, data) => {
    setEditType(type);
    setEditForm(data || {});
  };

  const saveEdit = async () => {
    const ref = doc(db, "users", phoneNumber, "Sender", "details");

    if (editType === "from") await updateDoc(ref, { from: editForm });
    if (editType === "to") await updateDoc(ref, { to: editForm });
    if (editType === "item") await updateDoc(ref, { itemDetails: editForm });

    setSender({
      ...sender,
      ...(editType === "from" && { from: editForm }),
      ...(editType === "to" && { to: editForm }),
      ...(editType === "item" && { itemDetails: editForm }),
    });

    setEditType(null);
  };

  /* ---------- UI STATES ---------- */
  if (loading) return <div className="loader">Loading…</div>;

  if (!phoneNumber)
    return (
      <div className="session-expired">
        <h3>Session expired</h3>
        <button onClick={() => navigate("/")}>Go to Login</button>
      </div>
    );

  return (
    <>
      <div className="sender-wrapper">
        <h2 className="title">Sender Profile</h2>
        <p className="phone">Phone: {phoneNumber}</p>

        {/* FLIGHT CARD */}
        <div className="card">
          <div className="row between">
            <div>
              <span className="label">From</span>
              <p>{traveler?.from?.city || "N/A"}</p>
            </div>
            <span className="edit" />
          </div>

          <div className="row between">
            <div>
              <span className="label">To</span>
              <p>{traveler?.to?.city || "N/A"}</p>
            </div>
            <span className="edit" />
          </div>

          <p className="flight-line">
            Airline: {traveler?.flightDetails?.airline || "N/A"} | Flight:{" "}
            {traveler?.flightDetails?.flightNumber || "N/A"}
          </p>
        </div>

        {/* TABS */}
        <div className="tabs">
          <button
            className={activeTab === "status" ? "active" : ""}
            onClick={() => setActiveTab("status")}
          >
            Status
          </button>
          <button
            className={activeTab === "traveler" ? "active" : ""}
            onClick={() => setActiveTab("traveler")}
          >
            Traveler
          </button>
        </div>

        {/* STATUS TAB */}
        {activeTab === "status" && (
          <>
            <div className="card">
              <h4>🚚 Delivery Status</h4>
              <p>1️⃣ First Mile: {traveler?.FirstMileStatus || "Not Started"}</p>
              <p>2️⃣ Second Mile: {traveler?.SecondMileStatus || "Not Started"}</p>
              <p>3️⃣ Last Mile: {traveler?.LastMileStatus || "Not Started"}</p>
            </div>

            <div className="card">
              <h4>📍 Sender From Address</h4>
              <p>{formatAddress(sender?.from)}</p>
              <button onClick={() => openEdit("from", sender?.from)}>Edit</button>
            </div>

            <div className="card">
              <h4>📍 Sender To Address</h4>
              <p>{formatAddress(sender?.to)}</p>
              <button onClick={() => openEdit("to", sender?.to)}>Edit</button>
            </div>

            <div className="card">
              <h4>📦 Item Details</h4>
              <p>Item: {sender?.itemDetails?.itemName}</p>
              <p>Weight: {sender?.itemDetails?.totalWeight}</p>
              <p>Instructions: {sender?.itemDetails?.instructions}</p>
              <button onClick={() => openEdit("item", sender?.itemDetails)}>
                Edit
              </button>
            </div>
          </>
        )}

        {/* TRAVELER TAB */}
        {activeTab === "traveler" && (
          <>
            {traveler?.status === "Request Accepted By Traveler" ? (
              <div className="card">
                <p>Name: {traveler?.flightDetails?.firstName}</p>
                <p>Phone: {traveler?.phoneNumber}</p>
                <p>
                  Accepting upto: {traveler?.flightDetails?.baggageSpace} kg
                </p>
              </div>
            ) : (
              <div className="card muted">
                Traveler details visible after acceptance
              </div>
            )}
          </>
        )}
      </div>

      {/* POPUP */}
      {editType && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h4>Edit Details</h4>

            {Object.keys(editForm || {}).map((k) => (
              <input
                key={k}
                value={editForm[k] || ""}
                onChange={(e) =>
                  setEditForm({ ...editForm, [k]: e.target.value })
                }
                placeholder={k}
              />
            ))}

            <div className="modal-actions">
              <button onClick={saveEdit}>Save</button>
              <button className="secondary" onClick={() => setEditType(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
