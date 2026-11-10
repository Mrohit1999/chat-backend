import { cert, getApps, initializeApp } from "firebase-admin/app";

import { getFirestore } from "firebase-admin/firestore";
import { env } from "./env";

const firebaseApp =
  getApps()[0] ??
  initializeApp({
    credential: cert({
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });

export const firestore = getFirestore(firebaseApp);

export const connectFirebase = async (): Promise<void> => {
  try {
    await firestore.collection("_health").limit(1).get();

    console.log("Firebase Firestore connected successfully");
  } catch (error) {
    console.error("Firebase connection failed:", error);
    throw error;
  }
};
