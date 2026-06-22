# Chatter Pit

Chatter Pit is a privacy-first chat prototype built with React, Vite, Tailwind CSS, Radix UI, ChatScope, QR code sharing, Socket.IO realtime messaging, WebRTC voice/video calls, image sharing, and a mobile-installable PWA shell.

## Features

- **Text chat** between two people paired by their Chatter Pit IDs.
- **Image sharing** — tap the attach (paperclip) button to send a photo. Images are downscaled and JPEG-compressed in the browser before sending.
- **Voice & video calls** — the phone/video buttons in the chat header start a WebRTC call. Media flows peer-to-peer; the server only relays the connection setup (signaling).
- **Long-distance ready** — point both devices at the same public realtime server (a deployment or HTTPS tunnel) to chat and call across different networks/cities.

## Use Case

The app lets a user create a local Chatter Pit identity without entering personal information. The generated ID and pass key are stored in the browser with `localStorage`, and the profile page renders a QR/link that another user can open at `/u/{id}` to begin a chat.

Text and image messages are sent through a Socket.IO server. Chat history is kept in server memory (last 100 messages per pair), so it resets when the server restarts. Calls are peer-to-peer over WebRTC and are never stored.

## App Flow

- `/` introduces the product and sends the user to account setup.
- `/Account` generates or displays the user's local ID, pass key, QR code, and share link.
- `/ChatPage` opens the demo chat screen.
- `/u/:peerId` opens the chat screen already connected to the shared ID.

## Setup

Install dependencies:

```bash
npm install
```

Run the local development app and realtime server:

```bash
npm run dev
```

The client runs on Vite, usually at `http://localhost:5173/`.
The realtime server runs at `http://localhost:3001/`.

Run the production app and realtime server from one port:

```bash
npm run serve
```

After the build finishes, open `http://localhost:3001/`.

Build for production:

```bash
npm run build
```

Run lint checks:

```bash
npm run lint
```

## Two-Person Test

1. Start the app with `npm run dev`.
2. Open `http://localhost:5173/` in one browser and create the first user's ID.
3. Open the same URL in a second browser, private window, or another device on the same network. A normal second tab will reuse the same local ID.
4. On either account page, copy or scan the QR/share link.
5. Open that `/u/{id}` link from the other user's browser.
6. Send messages from either side.

## Mobile App Use

For two phones on the same Wi-Fi:

1. Start the app with `npm run dev`.
2. Use the Vite network URL shown in the terminal, such as `http://10.159.165.123:5173/`.
3. Open that URL on both phones.
4. Create one ID per phone. If both phones somehow share a browser profile, use a private window on one phone.
5. Share or scan the QR link from one phone to the other.
6. Start chatting.

To install it like an app:

- Android: open the app URL in Chrome, then use **Add to Home screen** or **Install app**.
- iPhone: open the app URL in Safari, tap Share, then choose **Add to Home Screen**.
- For reliable install prompts outside `localhost`, serve it over HTTPS. A deployment or HTTPS tunnel is recommended for real mobile use beyond same-Wi-Fi testing.

## Long-Distance Use (two phones, different networks)

Same-Wi-Fi works out of the box. To chat and call between two phones on different
networks (different homes, mobile data, different cities) you need **one publicly
reachable realtime server** that both phones connect to.

### 1. Put the server somewhere public

Pick either option:

- **Quick tunnel (fastest test):** run the app locally with `npm run serve`, then
  expose port `3001` over HTTPS with a tunnel, e.g. `ngrok http 3001` or
  `cloudflared tunnel --url http://localhost:3001`. Copy the `https://…` URL it prints.
- **Deploy (more permanent):** deploy the `Chatter Pit` folder to a Node host
  (Render, Railway, Fly.io, a VPS, etc.). The host must run `npm install` then
  `npm run serve` (which builds the client and starts the server). Set the
  `PORT` env var if the platform requires it — the server already reads it.

The server serves the built app **and** the realtime socket on the same origin, so a
single public URL is all you need.

### 2. Point both phones at that URL

If you deployed, just open the public URL on both phones — nothing else to do.

If you used a tunnel (the app is loaded from somewhere else), open **Account** on each
phone and paste the public server URL into **Realtime server URL**, then tap **Save**.
Both phones must use the **same** URL. This is stored locally per device.

You can also bake it in at build time with `VITE_SOCKET_URL=https://your-server …`.

### 3. Calls across strict networks (TURN)

Voice/video uses Google's public STUN servers, which is enough for most home Wi-Fi.
Some mobile-carrier and corporate networks block direct peer connections, and calls
then fail to connect. For those, add a TURN server via build-time env vars
(`VITE_TURN_URL`, `VITE_TURN_USERNAME`, `VITE_TURN_CREDENTIAL`) or a per-device
override in `localStorage` under `chatterpit_turn`
(JSON: `{"urls":"turn:…","username":"…","credential":"…"}`).
You can run your own (coturn) or use a hosted TURN provider.

> Browsers only grant camera/microphone access on `https://` or `localhost`. Use HTTPS
> (a deployment or tunnel) so calls work on phones.

## Notes

- User IDs and pass keys are local browser values only.
- QR codes encode the current origin plus `/u/{id}`.
- The PWA shell can be installed, but live chat still needs the realtime server to be reachable.
- Images are compressed in the browser and relayed as data URLs; they are kept only in the in-memory history (last 100 messages per pair).
- Calls are peer-to-peer (WebRTC). The server sees only the signaling messages, never the audio/video.
- This is not production-secure yet. To make it production-ready, add real account validation, encrypted message storage, persistent delivery, and a managed TURN server.
