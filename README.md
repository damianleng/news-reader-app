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

### Example API Call
The application fetches articles using the following API endpoint:
```javascript
const response = await fetch(`https://newsapi.org/v2/top-headlines?category=${category}&apiKey=${apiKey}`);
