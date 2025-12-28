import React, { useEffect, useState } from "react";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import "./SenderProfile.css";

const STORAGE_PHONE_KEY = "PHONE_NUMBER";

export default function SenderProfile() {
  const navigate = useNavigate();

  // ---------------- STATE ----------------
  const [phoneNumber, setPhoneNumber] = useState(null);
  const [loading, setLoading] = useState(true);

  const [sender, setSender] = useState(null);
  const [traveler, setTraveler] = useState(null);

  const [activeTab, setActiveTab] = useState("status");

  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);

  const [addressForm, setAddressForm] = useState({});
  const [itemForm, setItemForm] = useState({});

  // ---------------- LOAD PHONE ----------------
  useEffect(() => {
    const pn =
      sessionStorage.getItem(STORAGE_PHONE_KEY) ||
      localStorage.getItem(STORAGE_PHONE_KEY);

    setPhoneNumber(pn || null);
  }, []);

  // ---------------- LOAD SENDER + TRAVELER ----------------
  useEffect(() => {
    if (!phoneNumber) {
      setLoading(false);
      return;
    }

    const loadAll = async () => {
      try {
        // -------- SENDER --------
        const senderRef = doc(db, "users", phoneNumber, "Sender", "details");
        const senderSnap = await getDoc(senderRef);

        if (!senderSnap.exists()) {
          setLoading(false);
          return;
        }

        const senderData = senderSnap.data();
        setSender(senderData);

        // -------- TRAVELER (MATCH BY uniqueKey) --------
        if (senderData.uniqueKey) {
          const usersSnap = await getDocs(collection(db, "users"));

          for (const userDoc of usersSnap.docs) {
            const travelerRef = doc(
              db,
              "users",
              userDoc.id,
              "Traveler",
              "details"
            );
            const tSnap = await getDoc(travelerRef);

            if (
              tSnap.exists() &&
              tSnap.data().uniqueKey === senderData.uniqueKey
            ) {
              setTraveler({
                phoneNumber: userDoc.id,
                ...tSnap.data(),
              });
              break;
            }
          }
        }
      } catch (e) {
        console.error("SenderProfile load error:", e);
      } finally {
        setLoading(false);
      }
    };

    loadAll();
  }, [phoneNumber]);

  // ---------------- HELPERS ----------------
  const formatAddress = (a) =>
    a
      ? [
          a.houseNumber,
          a.street,
          a.area,
          a.city,
          a.state,
          a.postalCode,
        ]
          .filter(Boolean)
          .join(", ")
      : "N/A";

  const saveAddress = async () => {
    const ref = doc(db, "users", phoneNumber, "Sender", "details");
    await updateDoc(ref, { from: addressForm });
    setSender({ ...sender, from: addressForm });
    setShowAddressModal(false);
  };

  const saveItem = async () => {
    const ref = doc(db, "users", phoneNumber, "Sender", "details");
    await updateDoc(ref, { itemDetails: itemForm });
    setSender({ ...sender, itemDetails: itemForm });
    setShowItemModal(false);
  };

  // ---------------- UI STATES ----------------
  if (loading) {
    return <div className="loader">Loading…</div>;
  }

  if (!phoneNumber) {
    return (
      <div className="session-expired">
        <h3>Session expired</h3>
        <button onClick={() => navigate("/")}>Go to Login</button>
      </div>
    );
  }

  // ---------------- UI ----------------
  return (
    <div className="sender-page">
      <h2>Sender Profile</h2>
      <p className="phone">Phone: {phoneNumber}</p>

      {/* FLIGHT STATUS */}
      <div className="card">
        <h4>✈️ Flight Status</h4>
        <p>Airline: {traveler?.flightDetails?.airline || "N/A"}</p>
        <p>Status: {traveler?.status || "WAITING"}</p>
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
            <p>First Mile: {traveler?.FirstMileStatus || "Not Started"}</p>
            <p>Second Mile: {traveler?.SecondMileStatus || "Not Started"}</p>
            <p>Last Mile: {traveler?.LastMileStatus || "Not Started"}</p>
          </div>

          <div className="card">
            <h4>🏠 Sender Address</h4>
            <p>{formatAddress(sender?.from)}</p>
            <button
              onClick={() => {
                setAddressForm(sender?.from || {});
                setShowAddressModal(true);
              }}
            >
              Edit Address
            </button>
          </div>

          <div className="card">
            <h4>📦 Item Details</h4>
            <p>Item: {sender?.itemDetails?.itemName || "N/A"}</p>
            <p>
              Weight: {sender?.itemDetails?.totalWeight || "N/A"}
            </p>
            <p>Price: ₹{sender?.itemDetails?.price || "N/A"}</p>
            <button
              onClick={() => {
                setItemForm(sender?.itemDetails || {});
                setShowItemModal(true);
              }}
            >
              Edit Item
            </button>
          </div>
        </>
      )}

      {/* TRAVELER TAB */}
      {activeTab === "traveler" && (
        <>
          {traveler?.status === "Request Accepted By Traveler" ? (
            <div className="card">
              <h4>🧑 Traveler Details</h4>
              <p>
                Name: {traveler?.flightDetails?.firstName || "N/A"}
              </p>
              <p>Phone: {traveler?.phoneNumber}</p>
              <p>Destination: {traveler?.to?.city || "N/A"}</p>
            </div>
          ) : (
            <div className="card muted">
              Traveler details visible after acceptance
            </div>
          )}
        </>
      )}

      {/* ADDRESS MODAL */}
      {showAddressModal && (
        <div className="modal">
          <div className="modal-card">
            <input
              placeholder="House No"
              value={addressForm.houseNumber || ""}
              onChange={(e) =>
                setAddressForm({
                  ...addressForm,
                  houseNumber: e.target.value,
                })
              }
            />
            <input
              placeholder="Street"
              value={addressForm.street || ""}
              onChange={(e) =>
                setAddressForm({
                  ...addressForm,
                  street: e.target.value,
                })
              }
            />
            <input
              placeholder="City"
              value={addressForm.city || ""}
              onChange={(e) =>
                setAddressForm({
                  ...addressForm,
                  city: e.target.value,
                })
              }
            />
            <button onClick={saveAddress}>Save</button>
            <button onClick={() => setShowAddressModal(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ITEM MODAL */}
      {showItemModal && (
        <div className="modal">
          <div className="modal-card">
            <input
              placeholder="Item Name"
              value={itemForm.itemName || ""}
              onChange={(e) =>
                setItemForm({
                  ...itemForm,
                  itemName: e.target.value,
                })
              }
            />
            <input
              placeholder="Total Weight"
              value={itemForm.totalWeight || ""}
              onChange={(e) =>
                setItemForm({
                  ...itemForm,
                  totalWeight: e.target.value,
                })
              }
            />
            <input
              placeholder="Price"
              value={itemForm.price || ""}
              onChange={(e) =>
                setItemForm({
                  ...itemForm,
                  price: e.target.value,
                })
              }
            />
            <button onClick={saveItem}>Save</button>
            <button onClick={() => setShowItemModal(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
