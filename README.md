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

## IndexedDB Setup
The project uses IndexedDB to store news articles locally, providing offline access and ensuring a seamless user experience even when there is no network connection.

### How IndexedDB Works
- Creating the Database: The createDB() function initializes an IndexedDB named "news-reader" and creates an object store called "news".
- Storing Data: News articles fetched from NewsAPI are stored in IndexedDB. The articles are marked as either synced or unsynced, depending on the network status.
- Fetching Data: Articles are fetched from IndexedDB when the app is offline and displayed to the user.
- Updating Data: Comments on news articles can be updated in IndexedDB and then synced to Firebase when the device goes online.


## Firebase Setup
The project integrates with Firebase for real-time data storage. Firebase is used to store and update news articles and comments.

### Setting up Firebase
- Create a Firebase Project: Visit the Firebase Console and create a new project.
- Configure Firebase: Add your Firebase configuration details in firebaseDB.js.
- Enable Database: Make sure the real-time database is enabled in your Firebase project settings.

### Firebase Integration
- Adding News: News articles are added to Firebase when the device is online.
- Updating Comments: Comments on articles are updated in Firebase, ensuring real-time data synchronization.
- Deleting News: Articles deleted from IndexedDB are also removed from Firebase when the device goes online.

## Data Synchronization
The app includes a robust synchronization mechanism to keep IndexedDB and Firebase in sync.

### Syncing IndexedDB and Firebase
- When the Device is Online: The syncNews() function checks for unsynced articles in IndexedDB and syncs them with Firebase.
- When the Device is Offline: Articles and comments are stored in IndexedDB and marked as unsynced. They are synced when the device goes online.
- Handling Deletions: Deleted articles in IndexedDB are also deleted from Firebase when the device reconnects.

## Data Authentication and User Data
This project ensures robust security and privacy through user authentication and proper handling of user-specific data. Each user's data is securely isolated, ensuring only authorized access to personal articles and comments.

### User Authentication
The application uses Firebase Authentication to securely identify users and protect their data. The following features ensure secure access:
- Email and Password Authentication: Users sign up or log in with their email and password, which is securely handled by Firebase.
- Auth State Management: The app listens for authentication state changes using Firebase’s onAuthStateChanged to dynamically adjust the UI and fetch user-specific data.
- Persistent Sessions: Firebase Authentication maintains user sessions, so users remain logged in across page reloads.

### User-Specific Data Management
The app securely manages user data by associating all stored articles, comments, and notes with a unique user ID (uid), ensuring data separation between accounts.

### Data Flow
- Saving Data: Articles and comments saved by the user are stored in Firebase Firestore under a path scoped to the user's uid (/users/{uid}/news).
- Data is also stored locally in IndexedDB to enable offline access, with each entry tagged with the user's uid.
- On login, the app fetches only the data associated with the authenticated user from Firebase and IndexedDB.
- Offline Mode: Articles and comments are stored locally in IndexedDB and marked as unsynced.
- Online Mode: Unsynced data is uploaded to Firebase when the device reconnects, ensuring the database remains up to date.
- Articles deleted by the user are removed from both Firebase and IndexedDB.

## Firebase Security Rules

Firebase’s security rules are configured to ensure that users can only access their own data:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      match /news/{newsId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

## Key Features of Security Rules:
- Authentication Required: Only authenticated users can read or write data.
- User Data Isolation: Users can access only their own data (request.auth.uid == userId).

## User Experience
With these features, the NewsReader app provides:
- Secure Access: Each user has exclusive access to their saved articles and notes.
- Persistent Data: Data is safely stored and synced across devices.
- Offline Functionality: Articles and notes remain accessible even without an internet connection, enhancing usability.

## Live Website Deployment using Firebase Hosting
The application has been deployed using Firebase Hosting for live access.

### Live URL
Production Development: https://news-reader-675c7.web.app/