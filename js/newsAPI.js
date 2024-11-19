import { displayNews } from "./ui.js";

document.addEventListener("DOMContentLoaded", () => {
  // api key
  // const apiKey = "aae057c0722543fab060697044800783";
  const apiKey = "dc0394e3e50844bcb37ecae471dc56a5";
  const category = document.body.getAttribute("data-category");

  // asynchronous function to fetch the news data
  async function fetchNews() {
    try {
      const response = await fetch(
        `https://newsapi.org/v2/top-headlines?category=${category}&apiKey=${apiKey}`
      );
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.statusText}`);
      }
      const data = await response.json();
      displayNews(data.articles);
    } catch (error) {
      console.error("Error fetching: ", error);
    }
  }

  fetchNews();
});
