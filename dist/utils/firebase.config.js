import admin from "firebase-admin";
import fs from "fs";
import path from "path";
let firebaseApp = null;
// INITIALIZE FIREBASE
export const initializeFirebase = () => {
    try {
        if (admin.apps.length > 0) {
            firebaseApp = admin.apps[0];
            return firebaseApp;
        }
        const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
        if (!serviceAccountPath) {
            throw new Error("Firebase service account path missing");
        }
        const fullPath = path.resolve(serviceAccountPath);
        const serviceAccount = JSON.parse(fs.readFileSync(fullPath, "utf-8"));
        // FIX PRIVATE KEY FORMAT
        serviceAccount.private_key =
            serviceAccount.private_key.replace(/\\n/g, "\n");
        firebaseApp = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
        console.log("🔥 Firebase initialized");
        return firebaseApp;
    }
    catch (error) {
        console.error("Firebase init error:", error);
        throw error;
    }
};
// ✅ EXPORT THIS FUNCTION (THIS WAS MISSING)
export const getMessaging = () => {
    if (!firebaseApp) {
        throw new Error("Firebase not initialized");
    }
    return admin.messaging();
};
export default admin;
