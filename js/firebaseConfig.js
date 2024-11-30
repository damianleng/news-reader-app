import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";

export const firebaseConfig = {
  apiKey: "AIzaSyCLR1zWD2lTHT2pKAi7TpN_dNAx1CSQKr0",
  authDomain: "news-reader-675c7.firebaseapp.com",
  projectId: "news-reader-675c7",
  storageBucket: "news-reader-675c7.firebasestorage.app",
  messagingSenderId: "117130706996",
  appId: "1:117130706996:web:fa4145a2e81f23a6a18a61",
  measurementId: "G-TMW9V3K1C2",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };