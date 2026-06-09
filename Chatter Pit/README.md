# Chatter Pit

Chatter Pit is a privacy-first chat prototype built with React, Vite, Tailwind CSS, Radix UI, ChatScope, and QR code sharing.

## Use Case

The app lets a user create a local Chatter Pit identity without entering personal information. The generated ID and pass key are stored in the browser with `localStorage`, and the profile page renders a QR/link that another user can open at `/u/{id}` to begin a chat.

This is currently a client-side demo. Messages are kept in React state and a simulated reply is returned after each send. There is no backend, authentication server, database, or real-time transport yet.

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

Run the local development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Run lint checks:

```bash
npm run lint
```

## Notes

- User IDs and pass keys are local browser values only.
- QR codes encode the current origin plus `/u/{id}`.
- To make this a production chat app, add a backend for accounts, encrypted message storage, and a real-time channel such as WebSocket or WebRTC.
