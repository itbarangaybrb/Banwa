/**
 * Registers a service worker if supported by the browser.
 * @param {string} swPath Path to the service worker file.
 */
export function registerServiceWorker(swPath = '/sw.js') {
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker.register(swPath)
        .then(() => {
            // Registration successful, silently succeed in production
        })
        .catch(err => {
            console.error('Service Worker registration failed', err);
        });
}
