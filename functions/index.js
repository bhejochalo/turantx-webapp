const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });

admin.initializeApp();
admin.firestore().settings({ ignoreUndefinedProperties: true });
const db = admin.firestore();

exports.saveTraveler = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      const { phoneNumber, from, to, flightDetails } = req.body;

      if (!phoneNumber)
        return res.status(400).json({ error: "Phone number missing" });

      await db.collection("users").doc(phoneNumber).set(
        {
          from,
          to,
          flightDetails,
          createdAt: new Date().toISOString(),
        },
        { merge: true }
      );

      return res.json({
        success: true,
        message: "Traveler saved successfully",
      });
    } catch (err) {
      console.error("Error saving traveler:", err);
      return res.status(500).json({ error: err.message });
    }
  });
});
