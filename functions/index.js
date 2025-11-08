const functions = require("firebase-functions/v2");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });

admin.initializeApp();
const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true });

exports.saveUserData = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      if (req.method !== "POST") {
        return res.status(405).json({ error: "Only POST method allowed" });
      }

      const {
        phoneNumber,
        userType,
        from,
        to,
        flightDetails,
        itemDetails,
        panDetails,
        distance,
      } = req.body;

      if (!phoneNumber || !userType) {
        return res.status(400).json({ error: "Missing phoneNumber or userType" });
      }

      // ✅ normalize function to ensure lat/lng always present
      const normalize = (obj) =>
        obj
          ? {
              ...obj,
              latitude: obj.latitude ?? null,
              longitude: obj.longitude ?? null,
            }
          : null;

      const data = {
        phoneNumber,
        userType,
        from: normalize(from),
        to: normalize(to),
        distance: distance || null,
        flightDetails: flightDetails || null,
        itemDetails: itemDetails || null,
        panDetails: panDetails || null,
        createdAt: new Date().toISOString(),
      };

      const collectionName = userType === "SENDER" ? "Sender" : "Traveler";

      await db
        .collection("users")
        .doc(phoneNumber)
        .collection(collectionName)
        .doc("details")
        .set(data, { merge: true });

      console.log(`✅ ${userType} saved:`, phoneNumber);
      return res.json({
        success: true,
        message: `${userType} saved successfully`,
        data,
      });
    } catch (err) {
      console.error("🔥 Error saving user data:", err);
      return res.status(500).json({ error: err.message });
    }
  });
});
