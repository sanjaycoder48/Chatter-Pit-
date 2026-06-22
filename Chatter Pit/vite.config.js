import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

// Base public path. Defaults to "/" (Capacitor app, Node server, custom domain).
// The GitHub Pages deploy sets VITE_BASE=/Chatter-Pit-/ so assets and routes
// resolve under the project subpath.
const base = process.env.VITE_BASE || "/";

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "favicon.png",
        "apple-touch-icon-180x180.png",
        "app-icon.svg",
      ],
      manifest: {
        name: "Chatter Pit",
        short_name: "Chatter Pit",
        description: "Private ID-based realtime chat, calls, and image sharing.",
        id: base,
        start_url: base,
        scope: base,
        display: "standalone",
        orientation: "portrait",
        background_color: "#0a0a0a",
        theme_color: "#111827",
        categories: ["social", "communication"],
        // Relative src/url so they resolve against the manifest's base path
        // (works at "/" and under the "/Chatter-Pit-/" Pages subpath).
        icons: [
          { src: "pwa-64x64.png", sizes: "64x64", type: "image/png" },
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "maskable-icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
        shortcuts: [
          { name: "Open Chats", short_name: "Chats", url: "ChatPage" },
          { name: "My Chatter Pit ID", short_name: "My ID", url: "Account" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico,woff2}"],
        // Never let the service worker intercept realtime traffic or the
        // health check — those must always hit the network.
        navigateFallback: "index.html",
        navigateFallbackDenylist: [/^\/socket\.io/, /^\/health/],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith("/socket.io"),
            handler: "NetworkOnly",
          },
        ],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
});
