import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// FORCE CACHE BREAK - VERSION 2026-08-17-21-35
console.log('WELLNESS MENTAL APP - VERSION 2026-08-17-21-35 - CACHE BREAK FORCED');
console.log('DEPLOYMENT TIMESTAMP:', new Date().toISOString());
console.log('BUILD ID:', Math.random().toString(36).substring(7));

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
