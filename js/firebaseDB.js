import { currentUser } from "./auth.js";
import { db } from "./firebaseConfig.js";
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

// Add an article URL to the database
export async function addNewsToFirebase(news) {
  try {
    if (!currentUser) {
      throw new Error("User is not authenticated!");
    }
    const userId = currentUser.uid;
    console.log("User ID: ", userId);
    const userRef = doc(db, "users", userId);
    await setDoc(userRef, { email: currentUser.email }, { merge: true });

    const newsRef = collection(userRef, "news");
    const docRef = await addDoc(newsRef, news);
    return { id: docRef.id, ...news };
  } catch (error) {
    console.error("Error adding news ", error);
  }
}

// Get articles from the database
export async function getNewsFromFirebase() {
  const news = [];
  try {
    if (!currentUser) {
      throw new Error("User is not authenticated!");
    }
    const userId = currentUser.uid;
    const newsRef = collection(doc(db, "users", userId), "news");
    const querySnapshot = await getDocs(newsRef);
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
    if (!currentUser) {
      throw new Error("User is not authenticated!");
    }
    const userId = currentUser.uid;
    const docRef = doc(db, "users", userId, "news", id);
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
    if (!currentUser) {
      throw new Error("User is not authenticated!");
    }
    const userId = currentUser.uid;
    await deleteDoc(doc(db, "users", userId, "news", id));
  } catch (error) {
    console.error("Error deleting news: ", error);
  }
}

// Update or add comments in the database
export async function updateCommentsToFirebase(id, updatedData) {
  try {
    if (!currentUser) {
      throw new Error("User is not authenticated!");
    }
    const userId = currentUser.uid;
    const newsRef = doc(db, "users", userId, "news", id);
    await updateDoc(newsRef, updatedData);
  } catch (error) {
    console.error("Error updating comments: ", error);
  }
}