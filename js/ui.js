import { openDB } from "https://unpkg.com/idb?module";
import {
  addNewsToFirebase,
  deleteNewsFromFirebase,
  getNewsFromFirebase,
  getNewsFromFirebaseById,
  updateCommentsToFirebase,
} from "./firebaseDB.js";

// Variable to store the URL of the current article
let currentArticleId = "";

// --- Initialization and Event Listeners ---
document.addEventListener("DOMContentLoaded", function () {
  const menus = document.querySelector(".sidenav");
  M.Sidenav.init(menus, { edge: "right" });

  const forms = document.querySelector(".side-form");
  M.Sidenav.init(forms, { edge: "left" });

  const modals = document.querySelectorAll(".modal");
  M.Modal.init(modals);

  // Check initial connection status and show a message
  if (navigator.onLine) {
    M.toast({ html: "You are online!", classes: "green darken-1" });
  } else {
    M.toast({
      html: "You are offline. Some features may not be available.",
      classes: "red darken-1",
    });
  }

  // Listen for online status changes
  window.addEventListener("online", function () {
    M.toast({ html: "You are back online!", classes: "green darken-1" });
  });

  // Listen for offline status changes
  window.addEventListener("offline", function () {
    M.toast({
      html: "You have lost connection. You are now offline.",
      classes: "red darken-1",
    });
  });

  // Add event listener for the "Save" button of the modal
  document
    .querySelector(".modal-footer .modal-close")
    .addEventListener("click", () => {
      // Get the text from the textarea
      const commentContent = document.getElementById("note-content").value;

      if (currentArticleId) {
        // Save the comment to IndexedDB
        updateComments(currentArticleId, commentContent);
        // Clear the textarea after saving
        document.getElementById("note-content").value = "";
      } else {
        console.error("No article URL found!");
      }
    });

  // Check storage usage
  checkStorageUsage();

  // Request persistent storage
  requestPersistentStorage();
});

// Register Service Worker
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/serviceworker.js")
    .then((req) => console.log("Service Worker Registered!", req))
    .catch((err) => console.log("Service Worker registration failed", err));
}

export async function displayNews(articles) {
  const db = await createDB();
  const newsContainer = document.querySelector(".news-container");
  newsContainer.innerHTML = "";

  for (const article of articles) {
    const isRemoved =
      !article.title ||
      article.title === "[Removed]" ||
      !article.source.name ||
      article.source.name === "[Removed]";

    let existingArticleInDB = null;
    let existingArticleInFirebase = null;

    if (article.id) {
      // Check if the article URL exists in the database
      const tx = db.transaction("news", "readonly");
      const store = tx.objectStore("news");

      try {
        existingArticleInDB = await store.get(article.id);
      } catch (error) {
        console.error("Error accessing IndexedDB: ", error);
      }
    }

    if (navigator.onLine && article.id) {
      // Check if article.id is valid
      try {
        existingArticleInFirebase = await getNewsFromFirebaseById(article.id);
      } catch (error) {
        console.error("Error checking article in Firebase: ", error);
      }
    } else {
      console.warn("Invalid article ID: ", article.id);
    }

    const existingArticle = existingArticleInDB || existingArticleInFirebase;
    // const existingArticle = false;

    const newsCard = `
      <div class="col s12 l4">
        <div class="card large">
          <div class="card-image">
            <img src="${
              article.urlToImage
                ? article.urlToImage
                : "https://placehold.co/600x400/png"
            }" alt="" />
          </div>
          <div class="card-content">
            <span class="card-title"><a class="red-text ${
              isRemoved ? "disabled-link" : ""
            }" href="/pages/read.html?title=${encodeURIComponent(
      article.title
    )}&author=${encodeURIComponent(
      article.author
    )}&description=${encodeURIComponent(
      article.description
    )}&source=${encodeURIComponent(
      article.source.name
    )}&urlToImage=${encodeURIComponent(
      article.urlToImage
    )}&url=${encodeURIComponent(article.url)}">${article.source.name}</a></span>
            <p>${article.title}</p>
          </div>
          <div class="card-action">
            <a href="/pages/read.html?title=${encodeURIComponent(
              article.title
            )}&author=${encodeURIComponent(
      article.author
    )}&description=${encodeURIComponent(
      article.description
    )}&source=${encodeURIComponent(
      article.source.name
    )}&urlToImage=${encodeURIComponent(
      article.urlToImage
    )}&url=${encodeURIComponent(
      article.url
    )}" class="waves-effect waves-red red btn-small ${
      isRemoved ? "disabled" : ""
    }">Read</a>
            <a class="waves-effect waves-red red btn-small ${
              isRemoved || existingArticle ? "disabled" : ""
            } download-btn" style="margin-left: 5px;" data-id="${article.id}" ${
      existingArticle ? "disabled" : ""
    }>
              <i class="material-icons">download</i>
            </a>
            <a class="waves-effect waves-red red btn-small delete-btn" style="margin-left: 5px; display: ${
              existingArticle ? "inline-block" : "none"
            };" data-id="${article.id}">
              <i class="material-icons">delete</i>
            </a>
            <a class="waves-effect waves-light blue btn-small note-btn" style="margin-left: 5px;">
              <i class="material-icons">edit_note</i>
            </a>
          </div>
        </div>
      </div>
    `;

    newsContainer.insertAdjacentHTML("beforeend", newsCard);
  }

  // Add event listeners to the "Download" buttons
  document.querySelectorAll(".download-btn").forEach((button, index) => {
    if (!button.classList.contains("disabled")) {
      button.addEventListener("click", async () => {
        // Add news to Firebase and IndexedDB
        const savedNews = await addNews(articles[index]);

        // Use the ID returned from Firebase
        if (savedNews && savedNews.id) {
          button.setAttribute("data-id", savedNews.id); // Assign the correct ID

          // Disable the button after adding news
          button.classList.add("disabled");
          button.setAttribute("disabled", "true");

          // Unhide the corresponding "Delete" button
          const deleteButton = button
            .closest(".card")
            .querySelector(".delete-btn");
          if (deleteButton) {
            deleteButton.style.display = "inline-block";
            deleteButton.setAttribute("data-id", savedNews.id); // Update the delete button's ID as well
          }
        } else {
          console.error("Failed to get a valid ID from saved news");
        }
      });
    }
  });

  // Add event listeners to the "Delete" buttons
  document.querySelectorAll(".delete-btn").forEach((button) => {
    button.addEventListener("click", function () {
      const newsId = button.dataset.id; // Get the URL from the data attribute
      console.log(newsId);
      deleteNews(newsId); // Call the function to delete the news from IndexedDB and UI

      // Hide the "Delete" button after deletion
      button.style.display = "none";
    });
  });

  document.querySelectorAll(".note-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      currentArticleId = button
        .closest(".card-action")
        .querySelector(".download-btn")
        .getAttribute("data-id");
      console.log("Current Article URL:", currentArticleId);

      try {
        // Fetch existing comments from Firebase

        let commentContent = "";

        if (navigator.onLine) {
          const articleFromFirebase = await getNewsFromFirebaseById(
            currentArticleId
          );
          console.log(
            "Comments from FirebaseDB: ",
            articleFromFirebase.comments
          );
          commentContent = articleFromFirebase.comments;
        } else {
          const db = await createDB();
          const tx = db.transaction("news", "readonly");
          const store = tx.objectStore("news");
          const articleFromDB = await store.get(currentArticleId);

          if (articleFromDB && articleFromDB.comments) {
            console.log("Comments from IndexedDB: ", articleFromDB.comments);
            commentContent = articleFromDB.comments;
          } else {
            console.warn("Comments not found in IndexedDB for this article.");
          }
        }

        // Display the comments here
        document.getElementById("note-content").value = commentContent;

        const modal = document.querySelector("#note-modal");
        const instance = M.Modal.getInstance(modal);
        instance.open();
      } catch (error) {
        console.error("Error retrieving comments from Firebase: ", error);
      }
    });
  });
}

// create indexDB database
async function createDB() {
  const db = await openDB("news-reader", 1, {
    upgrade(db) {
      const store = db.createObjectStore("news", {
        keyPath: "id",
        autoIncrement: true,
      });
      // store.createIndex("comments", "comments", { unique: false });
    },
  });
  return db;
}

// Add News to indexDB
// Add News to IndexedDB
async function addNews(news) {
  const db = await createDB();
  let newsId;

  // Add an empty comments field to the news object
  news.comments = "";

  if (navigator.onLine) {
    // If online, start syncing and send to Firebase
    const saveNews = await addNewsToFirebase(news);
    newsId = saveNews.id; // Use the ID generated by Firebase

    // Store the news item in IndexedDB with the Firebase ID
    const tx = db.transaction("news", "readwrite");
    const store = tx.objectStore("news");
    await store.put({ ...news, id: newsId, synced: true });
    await tx.done;
  } else {
    // Generate a temporary ID if offline
    newsId = `temp-${Date.now()}`;

    // Store the news item in IndexedDB with the temporary ID
    const newsToStore = { ...news, id: newsId, synced: false };
    const tx = db.transaction("news", "readwrite");
    const store = tx.objectStore("news");
    await store.put(newsToStore);
    await tx.done;
  }

  // Update storage usage
  checkStorageUsage();
  return { ...news, id: newsId };
}

// Sync IndexedDB data with Firebase
async function syncNews() {
  if (!navigator.onLine) return; // Exit if the device is offline

  const db = await createDB();

  // Load all news from IndexedDB
  const tx = db.transaction("news", "readonly");
  const store = tx.objectStore("news");
  const indexedDBNews = await store.getAll();
  await tx.done;

  // Load all news from Firebase
  const firebaseNews = await getNewsFromFirebase();

  // Create maps for easier comparison
  const indexedDBNewsMap = new Map(indexedDBNews.map(item => [item.id, item]));
  const firebaseNewsMap = new Map(firebaseNews.map(item => [item.id, item]));

  // Sync additions and updates from IndexedDB to Firebase
  for (const [id, newsItem] of indexedDBNewsMap) {
    if (!firebaseNewsMap.has(id)) {
      // News item exists in IndexedDB but not in Firebase, add it
      await addNewsToFirebase(newsItem);
    } else {
      // News item exists in both, update Firebase if necessary
      const firebaseItem = firebaseNewsMap.get(id);
      if (newsItem.comments !== firebaseItem.comments) {
        await updateCommentsToFirebase(id, { comments: newsItem.comments });
      }
    }
  }

  // Sync deletions from Firebase
  for (const id of firebaseNewsMap.keys()) {
    if (!indexedDBNewsMap.has(id)) {
      // News item exists in Firebase but not in IndexedDB, delete it
      await deleteNewsFromFirebase(id);
    }
  }

  console.log("Sync complete: IndexedDB is now in sync with Firebase.");
}


// Sync task from indexDB to firebase
// async function syncNews() {
//   const db = await createDB();
//   const tx = db.transaction("news", "readonly");
//   const store = tx.objectStore("news");

//   // Fetch all unsynced articles from IndexedDB
//   const articles = await store.getAll();
//   await tx.done;

//   for (const article of articles) {
//     // Check if the article is unsynced and the device is online
//     if (navigator.onLine) {
//       try {
//         // Prepare the article data for syncing (excluding the local `id`)
//         const articleToSync = {
//           title: article.title,
//           url: article.url,
//           comments: article.comments,
//           source: article.source,
//           // Add any other relevant fields from the article
//         };

//         let savedArticle;

//         // Check if the article already exists in Firebase
//         const existingArticle = await getNewsFromFirebaseById(article.id);

//         if (existingArticle) {
//           // If the article exists in Firebase, update it
//           await updateCommentsToFirebase(article.id, {
//             comments: article.comments,
//           });
//           savedArticle = { id: article.id }; // Use the existing Firebase ID
//         } else {
//           // If the article does not exist, add it to Firebase
//           savedArticle = await addNewsToFirebase(articleToSync);
//         }

//         // Mark the article as synced and update the ID with the Firebase ID
//         const txUpdate = db.transaction("news", "readwrite");
//         const storeUpdate = txUpdate.objectStore("news");

//         // Delete the old article with the local ID
//         await storeUpdate.delete(article.id);

//         // Add the article back with the Firebase ID and synced status
//         await storeUpdate.put({
//           ...article,
//           id: savedArticle.id,
//           synced: true,
//         });
//         await txUpdate.done;
//       } catch (error) {
//         console.error("Error syncing news:", error);
//       }
//     }
//   }
// }

// Delete news from indexDB
async function deleteNews(id) {
  if (!id) {
    console.error("Invalid id to deleteNews");
    return;
  }

  const db = await createDB();

  if (navigator.onLine) {
    await deleteNewsFromFirebase(id);
  }

  // start transaction
  const tx = db.transaction("news", "readwrite");
  const store = tx.objectStore("news");

  try {
    // Delete task by url
    await store.delete(id);
  } catch (error) {
    console.error("error deleting news from indexedDB: ", error);
  }

  // complete transaction
  await tx.done;

  // Remove news from UI
  const newsCard = document.querySelector(`[data-id="${id}"]`);
  if (newsCard) {
    newsCard.closest(".card").remove();
  }

  // update storage usage
  checkStorageUsage();
}

// Load news with Transaction
export async function loadNews() {
  const db = await createDB();

  const newsContainer = document.querySelector(".news-container");
  newsContainer.innerHTML = ""; // clear the container

  if (navigator.onLine) {
    const firebaseNews = await getNewsFromFirebase();

    if (firebaseNews.length === 0) {
      newsContainer.innerHTML = `
      <p class="card-panel red lighten-4 red-text text-darken-4">
        <i class="material-icons left">error</i>
        No saved news yet. Start adding your favorite articles!
      </p>`;
      return;
    }

    // Start a transaction to read and write from IndexedDB
    const tx = db.transaction("news", "readwrite");
    const store = tx.objectStore("news");

    // Fetch all news from IndexedDB
    const existingNews = await store.getAll();

    // Create a map to track existing news in IndexedDB
    const existingNewsMap = new Map();
    for (const news of existingNews) {
      existingNewsMap.set(news.id, news);
    }

    // Merge Firebase data with IndexedDB data
    for (const article of firebaseNews) {
      if (existingNewsMap.has(article.id)) {
        // If the article exists in IndexedDB, preserve its comments and sync status
        const existingArticle = existingNewsMap.get(article.id);
        article.comments = existingArticle.comments || "";
        article.synced = true;
      } else {
        // If the article is new, mark it as synced
        article.synced = true;
      }

      // Store or update the article in IndexedDB
      await store.put(article);
    }

    // complete the transaction
    await tx.done;

    // display the news to the UI
    displayNews(firebaseNews);
  } else {
    // Offline: Load news from IndexedDB
    const tx = db.transaction("news", "readonly");
    const store = tx.objectStore("news");

    // Get all news from IndexedDB
    const news = await store.getAll();

    // Complete the transaction
    await tx.done;

    if (news.length === 0) {
      newsContainer.innerHTML = `
      <p class="card-panel red lighten-4 red-text text-darken-4">
        <i class="material-icons left">error</i>
        No saved news yet. Start adding your favorite articles!
      </p>`;
    } else {
      displayNews(news);
    }
  }
}

// Function to update comments of a news article
async function updateComments(id, newComment) {
  try {
    const db = await createDB();

    // start a transaction
    const tx = db.transaction("news", "readwrite");
    const store = tx.objectStore("news");

    // get the existing news item
    const newsItem = await store.get(id);

    if (newsItem) {
      newsItem.comments = newComment;

      await store.put(newsItem);
      console.log("Comment updated successfully in IndexedDB!");

      if (navigator.onLine) {
        try {
          const updatedData = { comments: newsItem.comments };

          await updateCommentsToFirebase(newsItem.id, updatedData);
          console.log("Comment updated successfully in Firebase!");
        } catch (error) {
          console.error("Error updating comment in Firebase: ", error);
        }
      } else {
        console.log(
          "Offline: Comment update will be synced to Firebase when online."
        );
      }
    } else {
      console.error("News item not found in IndexedDB!");
    }
    await tx.done;
  } catch (error) {
    console.error("Error adding or updating comment: ", error);
  }
}

// Function to check storage usage
async function checkStorageUsage() {
  if (navigator.storage && navigator.storage.estimate) {
    const { usage, quota } = await navigator.storage.estimate();
    const usageInMB = (usage / (1024 * 1024)).toFixed(2); // Convert to MB
    const quotaInMB = (quota / (1024 * 1024)).toFixed(2); // Convert to MB

    console.log(`Storage used: ${usageInMB} MB of ${quotaInMB} MB`);

    // Update the UI with storage info
    const storageInfo = document.querySelector("#storage-info");
    if (storageInfo) {
      storageInfo.textContent = `Storage used: ${usageInMB} MB of ${quotaInMB} MB`;
    }

    // Warn the user if storage usage exceeds 80%
    if (usage / quota > 0.8) {
      const storageWarning = document.querySelector("#storage-warning");
      if (storageWarning) {
        storageWarning.textContent =
          "Warning: You are running low on storage space. Please delete old tasks to free up space.";
        storageWarning.style.display = "block";
      }
    } else {
      const storageWarning = document.querySelector("#storage-warning");
      if (storageWarning) {
        storageWarning.textContent = "";
        storageWarning.style.display = "none";
      }
    }
  }
}

// Function to request persistent storage
async function requestPersistentStorage() {
  if (navigator.storage && navigator.storage.persist) {
    const isPersistent = await navigator.storage.persist();
    console.log(`Persistent storage granted: ${isPersistent}`);

    // Update the UI with a message
    const storageMessage = document.querySelector("#persistent-storage-info");
    if (storageMessage) {
      if (isPersistent) {
        storageMessage.textContent =
          "Persistent storage granted. Your data is safe!";
        storageMessage.classList.remove("red-text");
        storageMessage.classList.add("green-text");
      } else {
        storageMessage.textContent =
          "Persistent storage not granted. Data might be cleared under storage pressure.";
        storageMessage.classList.remove("green-text");
        storageMessage.classList.add("red-text");
      }
    }
  }
}

window.addEventListener("online", () => {
  console.log("Device is online, attempting to sync news...");
  syncNews();
});

window.addEventListener("online", loadNews);
