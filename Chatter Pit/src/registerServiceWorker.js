import { Capacitor } from "@capacitor/core";

// In the browser PWA we register the generated service worker for offline
// shell + install support. Inside the native Capacitor app the WebView already
// serves local files, so a service worker is unnecessary and we skip it.
if (!Capacitor.isNativePlatform()) {
  import("virtual:pwa-register")
    .then(({ registerSW }) => {
      registerSW({ immediate: true });
    })
    .catch(() => {
      // The app still works without offline shell caching.
    });
}
