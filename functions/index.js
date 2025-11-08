const functions = require("firebase-functions/v2");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });

admin.initializeApp();
const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true });

// ✅ Unified function: Handles Traveler, Sender, and PAN verification (Sender only)
exports.saveUserData = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      if (req.method !== "POST") {
        return res.status(405).json({ error: "Only POST method allowed" });
      }

      const {
        phoneNumber,
        userType,         // "SENDER" or "TRAVELER"
        from,
        to,
        flightDetails,
        itemDetails,
        panDetails,       // Only for Sender
      } = req.body;

      if (!phoneNumber || !userType) {
        return res
          .status(400)
          .json({ error: "Missing phoneNumber or userType" });
      }

      // ✅ Prepare main data
      const baseData = {
        phoneNumber,
        userType,
        from: from || null,
        to: to || null,
        flightDetails: flightDetails || null,
        itemDetails: itemDetails || null,
        createdAt: new Date().toISOString(),
      };

      // ✅ Choose Firestore subcollection name
      const collectionName = userType === "SENDER" ? "Sender" : "Traveler";
      const userDoc = db.collection("users").doc(phoneNumber);
      const userSubDoc = userDoc.collection(collectionName).doc("details");

      // ✅ For sender: merge PAN verification (if provided)
      if (userType === "SENDER") {
        const senderData = {
          ...baseData,
          panDetails: panDetails || null,
          verified: !!panDetails, // true if PAN details present
          verifiedAt: panDetails ? new Date().toISOString() : null,
        };
        await userSubDoc.set(senderData, { merge: true });
        console.log(`✅ Sender data (with PAN) saved for ${phoneNumber}`);
      }

      // ✅ For traveler: normal data (no PAN)
      else if (userType === "TRAVELER") {
        await userSubDoc.set(baseData, { merge: true });
        console.log(`✅ Traveler data saved for ${phoneNumber}`);
      }

      return res.json({
        success: true,
        message:
          userType === "SENDER"
            ? "Sender details saved successfully (with PAN check)"
            : "Traveler details saved successfully",
      });
    } catch (err) {
      console.error("🔥 Error saving user data:", err);
      return res.status(500).json({ error: err.message });
    }
  });
});
