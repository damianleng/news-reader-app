import { loadNews } from "./ui.js";

document.addEventListener("DOMContentLoaded", async function () {
  // Load the news article
  await loadNews();
});
