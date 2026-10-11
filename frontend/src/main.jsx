import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Apply persisted theme before first render — default is LIGHT
;(function() {
  const stored = localStorage.getItem('theme');
  // Migrate: if previously defaulted to 'system', clear it so light is used
  if (!stored || stored === 'system') {
    // Keep 'system' only if the user explicitly set it (we can't know, so treat absence/system as light)
    // To see dark, user must go to Settings and choose Dark explicitly.
    localStorage.removeItem('theme');
  }
  const current = localStorage.getItem('theme');
  const isDark = current === 'dark';
  document.documentElement.classList.toggle('dark', isDark);
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
})();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
