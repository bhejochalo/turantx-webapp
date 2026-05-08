/***********************
 * IMPORTS
 ***********************/
 const functions = require("firebase-functions/v2"); // HTTPS (v2)
 const { onDocumentCreated } = require("firebase-functions/v2/firestore"); // Firestore trigger (v2)
 const admin = require("firebase-admin");
 const cors = require("cors")({ origin: true });
 const sgMail = require("@sendgrid/mail");

/***********************
 * INIT (ONLY ONCE)
 ***********************/
admin.initializeApp();

const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true });

// SendGrid API key — set lazily to avoid startup crash if secret not yet injected
const getSgMail = () => {
  if (process.env.SENDGRID_API_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  }
  return sgMail;
};


/***********************
 * HELPERS
 ***********************/
const generateOtp = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const generateKey = () =>
  Math.random().toString(36).substring(2, 10).toUpperCase();

/***********************
 * HTTPS FUNCTION: saveUserData (v2)
 ***********************/
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
        uniqueKey,
      } = req.body;

      if (!phoneNumber || !userType) {
        return res.status(400).json({ error: "Missing phoneNumber or userType" });
      }

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

      // TRAVELER schema
      if (userType === "TRAVELER") {
        data.uniqueKey = generateKey();
        data.status = "SEARCHING";
        data.FirstMileOTP = generateOtp();
        data.LastMileOTP = generateOtp();
      }

      // SENDER schema
      if (userType === "SENDER") {
        data.uniqueKey = uniqueKey || generateKey();
        data.isVerified = false;
        data.status = "SEARCHING";
        data.opsReviewed = false;
        data.trustStatus = {};
      }

      // ── NEW: Write to per-request subcollection ──
      // SenderRequests/{uniqueKey} or TravelerRequests/{uniqueKey}
      // Each request is its own document — full history is preserved.
      const requestsCollection = userType === "SENDER" ? "SenderRequests" : "TravelerRequests";

      await db
        .collection("users")
        .doc(phoneNumber)
        .collection(requestsCollection)
        .doc(data.uniqueKey)
        .set(data, { merge: true });

      // ── Update root user document with current role ──
      // Ensures users/{phone} always reflects the latest booking type.
      await db
        .collection("users")
        .doc(phoneNumber)
        .set(
          {
            role: userType === "SENDER" ? "Sender" : "Traveler",
            requestType: userType === "SENDER" ? "SenderRequest" : "TravelerRequest",
            latestRequestKey: data.uniqueKey,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );

      return res.json({
        success: true,
        message: `${userType} saved successfully`,
        data,
      });
    } catch (err) {
      console.error("saveUserData error:", err);
      return res.status(500).json({ error: err.message });
    }
  });
});

/***********************
 * HTTPS FUNCTION: initUser (v2)
 ***********************/
exports.initUser = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      if (req.method !== "POST") {
        return res.status(405).json({ error: "Only POST allowed" });
      }

      const { phoneNumber } = req.body;
      if (!phoneNumber) {
        return res.status(400).json({ error: "phoneNumber required" });
      }

      const userRef = db.collection("users").doc(phoneNumber);
      const snap = await userRef.get();

      if (snap.exists) {
        await userRef.set(
          { lastLoginAt: new Date().toISOString() },
          { merge: true }
        );
      } else {
        await userRef.set({
          phoneNumber,
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
          authCompleted: true,
        });
      }

      return res.json({ success: true });
    } catch (err) {
      console.error("initUser error:", err);
      return res.status(500).json({ error: err.message });
    }
  });
});

/***********************
 * FIRESTORE TRIGGER: EMAIL on new SenderRequest
 ***********************/
exports.sendMailOnSenderRequest = onDocumentCreated(
  {
    document: "users/{userId}/SenderRequests/{requestId}",
    secrets: ["SENDGRID_API_KEY"],
  },
  async (event) => {
    try {
      const snap = event.data;
      if (!snap.exists) return;

      const data = snap.data();
      const { userId, requestId } = event.params;

      // ── Admin notification: increment new sender count ──
      try {
        await db.collection("meta").doc("adminAlerts").set(
          { newSenders: admin.firestore.FieldValue.increment(1), lastOrderAt: new Date().toISOString(), lastOrderType: "sender" },
          { merge: true }
        );
      } catch (alertErr) { console.error("Admin alert update failed:", alertErr); }

      let rows = "";
      Object.keys(data || {}).forEach((key) => {
        rows += `
          <tr>
            <td style="border:1px solid #ddd;padding:6px"><b>${key}</b></td>
            <td style="border:1px solid #ddd;padding:6px">
              ${JSON.stringify(data[key])}
            </td>
          </tr>
        `;
      });

      await getSgMail().send({
        to: "turantxsolutions@gmail.com",
        from: "support@turantx.com",
        subject: `New Sender Request — ${requestId}`,
        html: `
          <h3>New Sender Request</h3>
          <p><b>User ID:</b> ${userId}</p>
          <p><b>Request ID:</b> ${requestId}</p>
          <table style="border-collapse:collapse">${rows}</table>
        `,
      });

      console.log(`✅ Sender request mail sent for ${userId} / ${requestId}`);
    } catch (err) {
      console.error("❌ Sender email failed:", err);
    }
  }
);

/***********************
 * FIRESTORE TRIGGER: EMAIL on new TravelerRequest
 ***********************/
exports.sendMailOnTravelerRequest = onDocumentCreated(
  {
    document: "users/{userId}/TravelerRequests/{requestId}",
    secrets: ["SENDGRID_API_KEY"],
  },
  async (event) => {
    try {
      const snap = event.data;
      if (!snap.exists) return;

      const data = snap.data();
      const { userId, requestId } = event.params;

      // ── Admin notification: increment new traveler count ──
      try {
        await db.collection("meta").doc("adminAlerts").set(
          { newTravelers: admin.firestore.FieldValue.increment(1), lastOrderAt: new Date().toISOString(), lastOrderType: "traveler" },
          { merge: true }
        );
      } catch (alertErr) { console.error("Admin alert update failed:", alertErr); }

      let rows = "";
      Object.keys(data || {}).forEach((key) => {
        rows += `
          <tr>
            <td style="border:1px solid #ddd;padding:6px"><b>${key}</b></td>
            <td style="border:1px solid #ddd;padding:6px">
              ${JSON.stringify(data[key])}
            </td>
          </tr>
        `;
      });

      await getSgMail().send({
        to: "turantxsolutions@gmail.com",
        from: "support@turantx.com",
        subject: `New Traveler Request — ${requestId}`,
        html: `
          <h3>New Traveler Request</h3>
          <p><b>User ID:</b> ${userId}</p>
          <p><b>Request ID:</b> ${requestId}</p>
          <table style="border-collapse:collapse">${rows}</table>
        `,
      });

      console.log(`✅ Traveler request mail sent for ${userId} / ${requestId}`);
    } catch (err) {
      console.error("❌ Traveler email failed:", err);
    }
  }
);
