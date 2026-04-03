import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
    getAuth,
    signInAnonymously,
    onAuthStateChanged,
    type Auth,
    type User,
} from "firebase/auth";
import {
    getFirestore,
    collection,
    doc,
    setDoc,
    addDoc,
    getDoc,
    getDocs,
    query,
    where,
    orderBy,
    serverTimestamp,
    Timestamp,
    type Firestore,
} from "firebase/firestore";

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
const firebaseEnabled = !!apiKey && apiKey !== "your-firebase-api-key-here";

const firebaseConfig = {
    apiKey,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (firebaseEnabled) {
    try {
        app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
        auth = getAuth(app);
        db = getFirestore(app);
    } catch (err) {
        console.warn("Firebase init failed — running in offline mode.", err);
    }
} else {
    console.info("Firebase not configured. Running in demo/offline mode.");
}

export {
    app,
    auth,
    db,
    signInAnonymously,
    onAuthStateChanged,
    firebaseEnabled,
    collection,
    doc,
    setDoc,
    addDoc,
    getDoc,
    getDocs,
    query,
    where,
    orderBy,
    serverTimestamp,
    Timestamp,
    type User,
};
