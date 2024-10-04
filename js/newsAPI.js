document.addEventListener("DOMContentLoaded", () => {
  // api key
  // const apiKey = "aae057c0722543fab060697044800783";
  const apiKey = "dc0394e3e50844bcb37ecae471dc56a5"
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
      console.log(data);
      displayNews(data.articles);
    } catch (error) {
      console.error("Error fetching: ", error);
    }
  }

  function displayNews(article) {
    const newsContainer = document.querySelector(".news-container");
    newsContainer.innerHTML = "";

    article.forEach((article) => {

     const isRemoved = !article.title || article.title === "[Removed]" || !article.source.name || article.source.name === "[Removed]"

      const newsCard = `
        <div class="col s12 l4">
            <div class="card large">
              <div class="card-image">
                <img src="${article.urlToImage ? article.urlToImage : 'https://placehold.co/600x400/png'}" alt="" />
              </div>
              <div class="card-content">
                <span class="card-title"><a class="red-text ${isRemoved ? 'disabled-link' : ''} " href="/pages/read.html?title=${encodeURIComponent(article.title)}&author=${encodeURIComponent(article.author)}&description=${encodeURIComponent(article.description)}&source=${encodeURIComponent(article.source.name)}&urlToImage=${encodeURIComponent(article.urlToImage)}&url=${encodeURIComponent(article.url)}">${article.source.name}</a></span>
                <p>${article.title}</p>
              </div>
              <div class="card-action">
                <a href="/pages/read.html?title=${encodeURIComponent(article.title)}&author=${encodeURIComponent(article.author)}&description=${encodeURIComponent(article.description)}&source=${encodeURIComponent(article.source.name)}&urlToImage=${encodeURIComponent(article.urlToImage)}&url=${encodeURIComponent(article.url)}" class="waves-effect waves-red red darken-2 btn-small ${isRemoved ? 'disabled' : ''}">Read</a>
                <a class="waves-effect waves-red red darken-2 btn-small ${isRemoved ? 'disabled' : ''}"><i class="material-icons right">download</i>Download</a>
              </div>
            </div>
          </div>
        `;
      newsContainer.insertAdjacentHTML("beforeend", newsCard);
    });
  }

  // Function to calculate the time difference and return a human-readable string
  function getTimeDifference(publishedAt) {
    const publishedDate = new Date(publishedAt);
    const currentDate = new Date();
    
    const timeDiff = Math.abs(currentDate - publishedDate); // Difference in milliseconds
    const minutes = Math.floor(timeDiff / (1000 * 60)); // Convert milliseconds to minutes
    const hours = Math.floor(timeDiff / (1000 * 60 * 60)); // Convert milliseconds to hours
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24)); // Convert milliseconds to days
  
    if (minutes < 60) {
      return `${minutes} minutes ago`;
    } else if (hours < 24) {
      return `${hours} hours ago`;
    } else {
      return `${days} days ago`;
    }
  }

  fetchNews();
});
