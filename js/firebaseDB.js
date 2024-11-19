// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  deleteDoc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCLR1zWD2lTHT2pKAi7TpN_dNAx1CSQKr0",
  authDomain: "news-reader-675c7.firebaseapp.com",
  projectId: "news-reader-675c7",
  storageBucket: "news-reader-675c7.firebasestorage.app",
  messagingSenderId: "117130706996",
  appId: "1:117130706996:web:fa4145a2e81f23a6a18a61",
  measurementId: "G-TMW9V3K1C2",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Add an article URL to the database
export async function addNewsToFirebase(news) {
  try {
    const docRef = await addDoc(collection(db, "news"), news);
    return { id: docRef.id, ...news };
  } catch (error) {
    console.error("Error adding news ", error);
  }
}


// Get articles from the database
export async function getNewsFromFirebase() {
  const news = [];
  try {
    const querySnapshot = await getDocs(collection(db, "news"));
    querySnapshot.forEach((doc) => {
      news.push({ id: doc.id, ...doc.data() });
    });
  } catch (error) {
    console.error("Error getting news: ", error);
  }
  return news;
}

// Function to get a single news from Firebase by ID
export async function getNewsFromFirebaseById(id) {
  try {
    const docRef = doc(db, "news", id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      console.error("No such document in Firebase!");
      return null;
    }
  } catch (error) {
    console.error("Error fetching document from Firebase: ", error);
    throw error;
  }
}

// Delete article from the database
export async function deleteNewsFromFirebase(id) {
  try {
    await deleteDoc(doc(db, "news", id));
  } catch (error) {
    console.error("Error deleting news: ", error);
  }
}

// Update or add comments in the database
export async function updateCommentsToFirebase(id, updatedData) {
  try {
    const newsRef = doc(db, "news", id);
    await updateDoc(newsRef, updatedData);
  } catch (error) {
    console.error("Error updating comments: ", error);
  }
}
