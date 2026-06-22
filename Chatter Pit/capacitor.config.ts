import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "dev.rightangle.chatterpit",
  appName: "Chatter Pit",
  // Vite builds the web app into dist/; Capacitor copies it into the app.
  webDir: "dist",
  // Serving the WebView from https://localhost gives the page a secure context,
  // which is REQUIRED for getUserMedia (camera/mic) and WebRTC to work.
  server: {
    androidScheme: "https",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: "#0a0a0a",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    Keyboard: {
      resizeOnFullScreen: true,
    },
  },
};

export default config;
