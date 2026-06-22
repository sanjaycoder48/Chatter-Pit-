// Shared media helpers for Chatter Pit: WebRTC ICE configuration, the realtime
// server URL resolver, and client-side image compression for attachments.

const STUN_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

// A TURN server is needed when both peers are behind strict/symmetric NATs
// (common on mobile carriers). Supply one with these env vars or via the
// "chatterpit_turn" localStorage override (JSON: {urls, username, credential}).
export function getIceServers() {
  const iceServers = [...STUN_SERVERS];

  const turnUrl = import.meta.env.VITE_TURN_URL;
  if (turnUrl) {
    iceServers.push({
      urls: turnUrl,
      username: import.meta.env.VITE_TURN_USERNAME,
      credential: import.meta.env.VITE_TURN_CREDENTIAL,
    });
  }

  try {
    const stored = localStorage.getItem("chatterpit_turn");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed?.urls) iceServers.push(parsed);
    }
  } catch {
    // Ignore malformed overrides and fall back to STUN only.
  }

  return iceServers;
}

export function getSocketUrl() {
  const override = localStorage.getItem("chatterpit_server");
  if (override) return override.replace(/\/+$/, "");

  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL;
  }

  // Vite dev server (5173) talks to the realtime server on 3001.
  if (window.location.port === "5173") {
    return `${window.location.protocol}//${window.location.hostname}:3001`;
  }

  // In production the realtime server also serves the built app, so the
  // current origin is the right place to open the socket.
  return window.location.origin;
}

// Downscale and re-encode an image file to a compact JPEG data URL so it can be
// sent over the socket without blowing past the buffer limit.
export function compressImage(file, maxSize = 1280, quality = 0.7) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith("image/")) {
      reject(new Error("Please choose an image file."));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read the image."));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("Could not load the image."));
      image.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
        const width = Math.round(image.width * scale);
        const height = Math.round(image.height * scale);

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext("2d");
        context.drawImage(image, 0, 0, width, height);

        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
