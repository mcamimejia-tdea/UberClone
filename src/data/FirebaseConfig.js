// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA00abjCGM7phjPA1At6JsTj6_-H8sDDjs",
  authDomain: "uberclone-e4f20.firebaseapp.com",
  projectId: "uberclone-e4f20",
  storageBucket: "uberclone-e4f20.firebasestorage.app",
  messagingSenderId: "322477604554",
  appId: "1:322477604554:web:f476b889875fea97183e33"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);