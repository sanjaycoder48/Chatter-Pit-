# Chatter Pit

Chatter Pit is a privacy-first chat prototype built with React, Vite, Tailwind CSS, Radix UI, ChatScope, QR code sharing, Socket.IO realtime messaging, and a mobile-installable PWA shell.

## Use Case

The app lets a user create a local Chatter Pit identity without entering personal information. The generated ID and pass key are stored in the browser with `localStorage`, and the profile page renders a QR/link that another user can open at `/u/{id}` to begin a chat.

Messages are sent through a local Socket.IO server. Chat history is currently kept in server memory, so it resets when the server restarts.

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

## Notes

- User IDs and pass keys are local browser values only.
- QR codes encode the current origin plus `/u/{id}`.
- The PWA shell can be installed, but live chat still needs the realtime server to be reachable.
- This is not production-secure yet. To make it production-ready, add real account validation, encrypted message storage, and persistent delivery.
