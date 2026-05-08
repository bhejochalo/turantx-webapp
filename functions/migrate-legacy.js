/**
 * ONE-TIME: Migrate 2 specific users from legacy path to new path
 * Run: node migrate-legacy.js
 */

const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const PHONES = ["9003193709", "9643446775"];

async function migrate() {
  for (const phone of PHONES) {
    console.log(`\n── Processing ${phone} ──`);

    // Try Sender/details
    const sSnap = await db.doc(`users/${phone}/Sender/details`).get();
    if (sSnap.exists) {
      const data = sSnap.data();
      const key = data.uniqueKey || `MIG-S-${phone}`;
      await db.doc(`users/${phone}/SenderRequests/${key}`).set({
        ...data,
        uniqueKey: key,
        userType: "SENDER",
        status: data.status || data.requestStatus || "SEARCHING",
        migratedAt: new Date().toISOString(),
      });
      console.log(`  ✅ Sender migrated → SenderRequests/${key}`);
    } else {
      console.log(`  — No Sender/details found`);
    }

    // Try Traveler/details
    const tSnap = await db.doc(`users/${phone}/Traveler/details`).get();
    if (tSnap.exists) {
      const data = tSnap.data();
      const key = data.uniqueKey || `MIG-T-${phone}`;
      await db.doc(`users/${phone}/TravelerRequests/${key}`).set({
        ...data,
        uniqueKey: key,
        userType: "TRAVELER",
        status: data.status || data.requestStatus || "SEARCHING",
        migratedAt: new Date().toISOString(),
      });
      console.log(`  ✅ Traveler migrated → TravelerRequests/${key}`);
    } else {
      console.log(`  — No Traveler/details found`);
    }
  }

  console.log("\n✅ Done. Now manually delete legacy docs from Firebase Console.");
}

migrate().catch(console.error);
