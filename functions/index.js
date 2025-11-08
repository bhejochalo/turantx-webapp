const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true }); // ✅ Enable CORS
admin.initializeApp();
admin.firestore().settings({ ignoreUndefinedProperties: true });
const db = admin.firestore();

exports.saveTraveler = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      if (req.method !== "POST") {
        return res.status(405).send("Only POST requests allowed");
      }

      const { phoneNumber, from, to, meta = {} } = req.body;

      if (!phoneNumber || !from || !to) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const travelerData = {
        phoneNumber,
        from,
        to,
        meta,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      await db.collection("travelers").add(travelerData);

      res.status(200).json({
        success: true,
        message: "Traveler saved successfully",
        distanceKm: meta?.distance || null,
      });
    } catch (err) {
      console.error("🔥 Error saving traveler:", err);
      res.status(500).json({ error: err.message });
    }
  });
});
