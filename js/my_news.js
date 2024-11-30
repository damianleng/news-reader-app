import { loadNews } from "./ui.js";

document.addEventListener("DOMContentLoaded", async function () {
  // Load the news article
  document.addEventListener("userReady", async () => {
    console.log("User is ready, loading news...");
    await loadNews();
  });
});
