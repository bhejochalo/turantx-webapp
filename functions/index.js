const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");

// Initialize Firebase
if (!admin.apps.length) admin.initializeApp();
admin.firestore().settings({ ignoreUndefinedProperties: true });

// Express apps
const travelerApp = express();
const senderApp = express();

travelerApp.use(cors({ origin: true }));
travelerApp.use(express.json());

senderApp.use(cors({ origin: true }));
senderApp.use(express.json());

// ✅ saveTraveler API (POST /)
travelerApp.post("/", async (req, res) => {
  try {
    const { phoneNumber, from, to, flightDetails } = req.body;

    if (!phoneNumber)
      return res.status(400).json({ error: "Missing phone number" });

    const docRef = admin
      .firestore()
      .collection("users")
      .doc(phoneNumber)
      .collection("traveler")
      .doc(); // auto-id

    await docRef.set(
      {
        from,
        to,
        flightDetails,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    res.json({
      success: true,
      message: "Traveler saved successfully",
      docId: docRef.id,
    });
  } catch (err) {
    console.error("Traveler Save Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ saveSender API (POST /)
senderApp.post("/", async (req, res) => {
  try {
    const { phoneNumber, panVerified, from, to, itemDetails } = req.body;

    if (!phoneNumber)
      return res.status(400).json({ error: "Missing phone number" });

    const docRef = admin
      .firestore()
      .collection("users")
      .doc(phoneNumber)
      .collection("sender")
      .doc(); // auto-id

    await docRef.set(
      {
        panVerified: !!panVerified,
        from,
        to,
        itemDetails,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    res.json({
      success: true,
      message: "Sender saved successfully",
      docId: docRef.id,
    });
  } catch (err) {
    console.error("Sender Save Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Exports
exports.saveTraveler = functions.https.onRequest(travelerApp);
exports.saveSender = functions.https.onRequest(senderApp);
