import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import './premium.css';
import './phone.css';

import { applyTheme, getStoredTheme } from './utils/theme';
applyTheme();
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if (getStoredTheme() === 'system') applyTheme();
});
window.addEventListener('storage', event => { if (event.key === 'theme') applyTheme(); });

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
