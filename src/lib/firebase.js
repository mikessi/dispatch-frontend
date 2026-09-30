import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Set in .env.local (see firebase/README.md). These web config values are public by
// design; the Firestore security rules are what stop strangers from editing.
const config = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

const app = config.apiKey && config.projectId ? initializeApp(config) : null;

export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;

// Rates live in a single Firestore document: settings/rates
export const RATES_DOC = ["settings", "rates"];
