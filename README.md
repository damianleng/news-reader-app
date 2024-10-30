# News Progressive Web Application

This project is a dynamic News Progressive Web Application (PWA) that fetches and displays news articles from different categories using the [NewsAPI](https://newsapi.org/). Users can view articles based on categories such as General, Health, Science, Sports, Technology, and Entertainment. Each article includes a title, source, author, image, and a link to read the full content.

## Features
- Displays news articles based on categories fetched from NewsAPI.
- Shows a "time ago" status for each news article (e.g., "2 hours ago").
- Users can click on the "Read" button to navigate to a detailed page with more information about the article.
- Handles situations where certain articles are removed, disabling interactions for these entries.
- Responsive design using Materialize CSS.

## Technologies Used
- **HTML**: Structure of the web pages.
- **CSS (Materialize CSS)**: Styling and responsive design.
- **JavaScript (ES6)**: Dynamic content rendering, API fetching, DOM manipulation.
- **NewsAPI**: External API used to fetch news articles and their details.
- **Git**: Version control for tracking changes.

## API Integration
The application utilizes [NewsAPI](https://newsapi.org/) to fetch the latest news articles. The API provides various categories (e.g., General, Health, Science) and details for each article, such as the title, description, source, author, publication date, and image.

### API Key
- The project requires an API key from NewsAPI. You can obtain a free API key by signing up at [NewsAPI](https://newsapi.org/register).
- The API key is used to authenticate requests made to NewsAPI for fetching news articles.
- Open the newsAPI.js file and replace the apiKey variable with your API key.

```javascript
const apiKey = 'YOUR_API_KEY_HERE';
```

### Service Worker
The service worker in this project enables offline functionality by caching essential assets, ensuring users can access previously loaded news articles without a network connection.
- **Install**: During the install event, the service worker caches all specified assets (ASSETS_TO_CACHE). These include HTML pages, CSS, JavaScript files, and other critical resources required for offline access.
- **Activate**: In the activate event, the service worker removes old caches that are no longer needed, ensuring users have the latest assets.
- **Fetch**: The service worker intercepts network requests and serves cached assets if available. If an asset isn't in the cache, it tries to fetch it from the network and stores it in the cache for future requests.

### Caching Strategy
- **Cache First**: If a requested asset is cached, it serves directly from the cache.
- **Network Fallback**: If the asset isn't cached, it fetches from the network and caches it for future use. This strategy ensures fast loading times and allows offline access.

### Manifest File
The manifest.json file is essential for configuring the app’s appearance and behavior on mobile devices when installed. This configuration allows the application to be added to a user's home screen, providing a more app-like experience.

```
{
  "name": "News Reader",
  "short_name": "NR",
  "description": "Read latest fresh news",
  "start_url": "/index.html",
  "display": "standalone",
  "background_color": "#FFEBEE",
  "theme_color": "#263238",
  "lang": "en-US",
  "icons": [
    {
      "src": "/img/icons/icon-512x512.png",
      "type": "image/png",
      "sizes": "512x512"
    },
    ...
  ]
}
```