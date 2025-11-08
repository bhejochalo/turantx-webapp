const functions = require("firebase-functions/v2");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });

// ✅ Initialize admin app only once
admin.initializeApp();

const db = admin.firestore();

exports.saveTraveler = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).send("Method Not Allowed");
    }

    try {
      const { phoneNumber, from, to } = req.body;
      if (!phoneNumber || !from || !to) {
        return res.status(400).json({ error: "Missing fields" });
      }

      const distanceKm = calculateDistance(
        from.latitude,
        from.longitude,
        to.latitude,
        to.longitude
      );

      // ✅ Firestore write
      await db.collection("travelers").doc(phoneNumber).set({
        phoneNumber,
        from,
        to,
        distanceKm,
        createdAt: new Date().toISOString(),
      });

      console.log("Traveler saved successfully!");
      res.status(200).json({ success: true, distanceKm });
    } catch (err) {
      console.error("Error in saveTraveler:", err);
      res.status(500).json({ error: err.message });
    }
  });
});

// ✅ Helper function
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return +(R * c).toFixed(1);
}
