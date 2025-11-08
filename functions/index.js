const functions = require("firebase-functions/v2");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });

admin.initializeApp();
const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true });

// ✅ Save common handler
exports.saveUserData = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      if (req.method !== "POST") {
        return res.status(405).json({ error: "Only POST method allowed" });
      }

      const { phoneNumber, userType, from, to, flightDetails, itemDetails } =
        req.body;

      if (!phoneNumber || !userType) {
        return res.status(400).json({ error: "Missing phoneNumber or userType" });
      }

      // Prepare base data
      const data = {
        phoneNumber,
        userType,
        from: from || null,
        to: to || null,
        flightDetails: flightDetails || null,
        itemDetails: itemDetails || null,
        createdAt: new Date().toISOString(),
      };

      // Firestore path — store under "users" collection
      const userDoc = db.collection("users").doc(phoneNumber);

      // Store inside subcollection based on userType
      const collectionName = userType === "SENDER" ? "Sender" : "Traveler";
      await userDoc.collection(collectionName).doc("details").set(data, { merge: true });

      console.log(`✅ ${userType} data saved for ${phoneNumber}`);
      return res.json({ success: true, message: `${userType} saved successfully` });
    } catch (err) {
      console.error("🔥 Error saving user data:", err);
      return res.status(500).json({ error: err.message });
    }
  });
});
