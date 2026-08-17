// Diagnostic script - run this in browser console to check deployment status
console.log('=== DEPLOYMENT DIAGNOSTIC ===');

// Check service worker status
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    console.log('Service Workers registered:', registrations.length);
    registrations.forEach(reg => {
      console.log('SW Scope:', reg.scope);
      console.log('SW Script URL:', reg.active?.scriptURL);
      console.log('SW State:', reg.active?.state);
    });
  });
} else {
  console.log('Service Workers not supported');
}

// Check cache status
if ('caches' in window) {
  caches.keys().then(function(cacheNames) {
    console.log('Caches found:', cacheNames.length);
    cacheNames.forEach(cacheName => {
      console.log('Cache:', cacheName);
    });
  });
}

// Check current page URL and timestamp
console.log('Current URL:', window.location.href);
console.log('Page loaded at:', new Date().toISOString());

// Check localStorage and sessionStorage
console.log('localStorage keys:', Object.keys(localStorage));
console.log('sessionStorage keys:', Object.keys(sessionStorage));

// Check if our emergency script ran
console.log('Cache cleared flag:', sessionStorage.getItem('cacheCleared'));

// Try to detect app version
console.log('Build timestamp:', document.querySelector('meta[name="build-timestamp"]')?.content || 'Not found');

console.log('=== END DIAGNOSTIC ===');