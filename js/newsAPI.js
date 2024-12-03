import { displayNews } from "./ui.js";

document.addEventListener("DOMContentLoaded", () => {
  // api key
  // const apiKey = "aae057c0722543fab060697044800783";
  const apiKey = "cc510dc310abc296d7c66e19f91ce701";
  const category = document.body.getAttribute("data-category");

  // asynchronous function to fetch the news data
  async function fetchNews() {
    try {
      const response = await fetch(
        `https://gnews.io/api/v4/top-headlines?token=${apiKey}&topic=${category}&lang=en`
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
