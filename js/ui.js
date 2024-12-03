import { openDB } from "https://unpkg.com/idb?module";
import {
  addNewsToFirebase,
  deleteNewsFromFirebase,
  getNewsFromFirebase,
  getNewsFromFirebaseById,
  updateCommentsToFirebase,
} from "./firebaseDB.js";
import { currentUser } from "./auth.js";

// Variable to store the URL of the current article
let currentArticleId = "";

// --- Initialization and Event Listeners ---
document.addEventListener("DOMContentLoaded", function () {
  const menus = document.querySelector(".sidenav");
  M.Sidenav.init(menus, { edge: "right" });

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
              article.image
                ? article.image
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
    )}&image=${encodeURIComponent(
      article.image
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
    )}&image=${encodeURIComponent(
      article.image
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
            <a class="waves-effect waves-light blue btn-small note-btn" style="margin-left: 5px; display: ${
              existingArticle ? "inline-block" : "none"
            };">
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
      store.createIndex("userId", "userId", { unique: false }); // Add userId index
    },
  });
  return db;
}

export async function clearUserData() {
  const db = await createDB();
  const tx = db.transaction("news", "readwrite");
  const store = tx.objectStore("news");
  await store.clear();
  await tx.done;
  console.log("User data cleared from IndexedDB.");
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

export async function syncNews() {
  if(!currentUser) {
    console.error("No authenticated user. Sync aborted.");
    return;
  }

  const db = await createDB();
  const userId = currentUser.uid;

  const tx = db.transaction("news", "readonly");
  const store = tx.objectStore("news");
  const news = await store.getAll();
  await tx.done;

  for (const article of news) {
    console.log(article.comments);
    if (!article.synced && navigator.onLine) {
      try {
        const newsToSync = {
          author: article.author,
          comments: article.comments,
          content: article.content,
          description: article.description,
          publishedAt: article.publishedAt,
          source: article.source,
          title: article.title,
          url: article.url,
          image: article.image,
        };

        let savedNews;
        if (article.id && !article.id.startsWith("temp-")) {
          await updateCommentsToFirebase(article.id, {
            comments: article.comments,
          });
          savedNews = { id: article.id };
        } else {
          savedNews = await addNewsToFirebase(newsToSync);
        }

        // const savedNews = await addNewsToFirebase(newsToSync);
        const txUpdate = db.transaction("news", "readwrite");
        const storeUpdate = txUpdate.objectStore("news");
        await storeUpdate.delete(article.id);
        await storeUpdate.put({ ...article, id: savedNews.id, synced: true, userId });
        await txUpdate.done;
      } catch (error) {
        console.error("Error syncing news:", error);
      }
    }
  }
}

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
    const tx = db.transaction("news", "readwrite");
    const store = tx.objectStore("news");

    if (firebaseNews.length === 0) {
      newsContainer.innerHTML = `
      <p class="card-panel red lighten-4 red-text text-darken-4">
        <i class="material-icons left">error</i>
        No saved news yet. Start adding your favorite articles!
      </p>`;
      return;
    }

    for (const article of firebaseNews) {
      await store.put({ ...article, synced: true });
    }
    displayNews(firebaseNews);
    await tx.done;
  } else {
    console.log("Offline");
    // Offline: Load news from IndexedDB
    const tx = db.transaction("news", "readonly");
    const store = tx.objectStore("news");

    // Get all news from IndexedDB
    const news = await store.getAll();
    console.log(news);

    // Complete the transaction
    displayNews(news);
    await tx.done;

    // if (news.length === 0) {
    //   newsContainer.innerHTML = `
    //   <p class="card-panel red lighten-4 red-text text-darken-4">
    //     <i class="material-icons left">error</i>
    //     No saved news yet. Start adding your favorite articles!
    //   </p>`;
    // } else {
    //   displayNews(news);
    // }
  }
}

// Function to update comments of a news article
async function updateComments(id, newComment) {
  if (!id) {
    console.error("Invalid ID passed to updateComments.");
    return;
  }

  const db = await createDB();
  const updatedData = { comments: newComment };

  if (navigator.onLine) {
    try {
      // Update comments in Firebase
      await updateCommentsToFirebase(id, updatedData);

      // Update in IndexedDB as well
      const tx = db.transaction("news", "readwrite");
      const store = tx.objectStore("news");

      const newsItem = await store.get(id); // Retrieve the existing article
      if (newsItem) {
        newsItem.comments = newComment;
        newsItem.id = id;
        newsItem.synced = true; // Mark as synced
        await store.put(newsItem); // Update the entry in IndexedDB
      } else {
        console.warn(`News article with ID ${id} not found in IndexedDB.`);
      }

      await tx.done;

      console.log(`Comment updated successfully for article ID: ${id}`);
    } catch (error) {
      console.error("Error updating comment in Firebase:", error);
    }
  } else {
    // If offline, update only in IndexedDB
    const tx = db.transaction("news", "readwrite");
    const store = tx.objectStore("news");

    const newsItem = await store.get(id); // Retrieve the existing article
    if (newsItem) {
      newsItem.comments = newComment;
      newsItem.id = id;
      newsItem.synced = false; // Mark as not synced
      await store.put(newsItem); // Update the entry in IndexedDB
    } else {
      console.warn(`News article with ID ${id} not found in IndexedDB.`);
    }

    await tx.done;

    console.log(`Comment saved offline for article ID: ${id}`);
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
          "Warning: You are running low on storage space. Please delete old news to free up space.";
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
