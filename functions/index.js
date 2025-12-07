const functions = require("firebase-functions/v2");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });

admin.initializeApp();
const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true });

// 🔑 helper to generate random 6-digit OTP
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

// 🔑 helper to generate uniqueKey (same for traveler + sender)
const generateKey = () => Math.random().toString(36).substring(2, 10).toUpperCase();

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

      // normalize lat/lng
      const normalize = (obj) =>
        obj
          ? {
              ...obj,
              latitude: obj.latitude ?? null,
              longitude: obj.longitude ?? null,
            }
          : null;

      // 🔥 CREATE BASE DATA
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

      // ---------------------------
      // 🔥 ADD TRAVELER SPECIAL SCHEMA
      // ---------------------------
      if (userType === "TRAVELER") {
        const uniqueKey = generateKey();
        const firstOtp = generateOtp();
        const lastOtp = generateOtp();

        data.uniqueKey = uniqueKey;
        data.status = "WAITING";

        data.FirstMileStatus = "Not Started";
        data.SecondMileStatus = "Not Started";
        data.LastMileStatus = "Not Started";

        data.FirstMileOTP = firstOtp;
        data.LastMileOTP = lastOtp;

        console.log("Generated uniqueKey:", uniqueKey);
        console.log("Generated OTPs:", firstOtp, lastOtp);
      }

      // ---------------------------
      // 🔥 ADD SENDER SCHEMA
      // ---------------------------
      if (userType === "SENDER") {
        // SENDER should always have uniqueKey same as TRAVELER
        const uniqueKey = req.body.uniqueKey || generateKey();
        data.uniqueKey = uniqueKey;
        data.isVerified = false;
      }

      // Write document
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
