document.addEventListener("DOMContentLoaded", () => {
  function getQueryParams() {
    const params = new URLSearchParams(window.location.search);
    return {
      title: params.get("title"),
      author: params.get("author"),
      description: params.get("description"),
      source: params.get("source"),
      urlToImage: params.get("urlToImage"),
      url: params.get("url"),
    };
  }

  const articleData = getQueryParams();

  if (
    articleData.title &&
    articleData.author &&
    articleData.description &&
    articleData.source &&
    articleData.urlToImage && 
    articleData.url
  ) {
    document.querySelector(".header").textContent = articleData.title;
    document.querySelector("title").textContent = articleData.title;
    document.querySelector(".author").textContent = articleData.author;
    document.querySelector(".news").textContent = articleData.source;
    document.querySelector(".materialboxed").src = articleData.urlToImage
      ? decodeURIComponent(articleData.urlToImage)
      : "https://placehold.co/600x400/png";
    document.querySelector(".news-description").textContent = articleData.description;
    document.querySelector(".read-more").setAttribute('href', articleData.url);
    document.querySelector(".read-more").setAttribute('target', '_blank');
  }
});