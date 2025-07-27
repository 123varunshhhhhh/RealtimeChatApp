// src/main.jsx (UPDATED FOR createRoot WARNING)
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from "react-redux";
import { store } from './redux/store.js';

export const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:8000";

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => registration.unregister());
  });
}

const rootElement = document.getElementById('root');

if (rootElement) {
  console.log("Root element found:", rootElement);

  // Check if a root already exists to prevent re-creating
  // This is a common pattern for handling HMR in development
  let root = rootElement._reactRootContainer; // Vite/React often attach the root instance here

  if (!root) {
    // If no existing root, create a new one
    root = createRoot(rootElement);
    rootElement._reactRootContainer = root; // Store the root instance for future checks
  }

  root.render(
    <StrictMode>
      <BrowserRouter>
        <Provider store={store}>
          <App />
        </Provider>
      </BrowserRouter>
    </StrictMode>
  );
} else {
  console.error("Critical Error: Root element with ID 'root' not found in the document!");
}