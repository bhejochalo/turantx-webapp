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
 
 // SendGrid API key (Firebase env config)
 sgMail.setApiKey(process.env.SENDGRID_API_KEY);

 
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
 
       const collectionName = userType === "SENDER" ? "Sender" : "Traveler";
 
       // TRAVELER schema
       if (userType === "TRAVELER") {
         data.uniqueKey = generateKey();
         data.status = "WAITING";
 
         data.FirstMileStatus = "Not Started";
         data.SecondMileStatus = "Not Started";
         data.LastMileStatus = "Not Started";
 
         data.FirstMileOTP = generateOtp();
         data.LastMileOTP = generateOtp();
       }
 
       // SENDER schema
       if (userType === "SENDER") {
         data.uniqueKey = uniqueKey || generateKey();
         data.isVerified = false;
       }
 
       await db
         .collection("users")
         .doc(phoneNumber)
         .collection(collectionName)
         .doc("details")
         .set(data, { merge: true });
 
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
  * FIRESTORE TRIGGER: EMAIL (v2)
  ***********************/
  exports.sendMailOnUserDetailsInsert = onDocumentCreated(
    {
      document: "users/{userId}/{role}/details",
      secrets: ["SENDGRID_API_KEY"],
    },
    async (event) => {
      try {
        const snap = event.data;
        if (!snap.exists) return;
  
        const data = snap.data();
        const { userId, role } = event.params;
  
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
  
        await sgMail.send({
          to: "turantxsolutions@gmail.com",
          from: "support@turantx.com",
          subject: `New ${role} Details Inserted`,
          html: `
            <h3>${role} Details Created</h3>
            <p><b>User ID:</b> ${userId}</p>
            <p><b>Role:</b> ${role}</p>
            <table style="border-collapse:collapse">${rows}</table>
          `,
        });
  
        console.log(`✅ Insert mail sent for ${role} of user ${userId}`);
      } catch (err) {
        console.error("❌ Email failed:", err);
      }
    }
  );
  