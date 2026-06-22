# Chatter Pit — PWA & Android (Capacitor) Guide

This document covers running Chatter Pit as an installable PWA and as a native
Android app, plus exact build, signing, and deployment commands. All commands run
from the `Chatter Pit/` directory unless stated otherwise.

---

## 1. Prerequisites

| Tool | Version | Needed for |
|------|---------|-----------|
| Node.js | 18+ (tested on 24) | Web build, Capacitor CLI |
| JDK | 17 | Android Gradle build |
| Android SDK | Platform 35 + Build-Tools | Compiling the APK/AAB |
| Android Studio | latest | Easiest SDK install + device/emulator |

> **The only thing this repo does not include is the Android SDK.** Install
> Android Studio (which bundles the SDK) and set `ANDROID_HOME`
> (e.g. `C:\Users\<you>\AppData\Local\Android\Sdk`). Gradle then auto-writes
> `android/local.properties`. Without the SDK, `gradlew assembleRelease` fails with
> `SDK location not found` — that is the expected and only build blocker here.

Install JS dependencies once:

```bash
npm install
```

---

## 2. PWA (installable web app)

The PWA is configured with `vite-plugin-pwa` (Workbox `generateSW`).

- Manifest + icons: generated into `dist/manifest.webmanifest` from
  [vite.config.js](vite.config.js).
- Service worker: `dist/sw.js` (auto-update). Realtime (`/socket.io`) and `/health`
  are excluded from caching so they always hit the network.
- Registration: [src/registerServiceWorker.js](src/registerServiceWorker.js) — skipped
  inside the native app, active on the web.
- Icons/splash are produced by `npm run assets` (see [scripts/generate-assets.mjs](scripts/generate-assets.mjs)).

Build and serve:

```bash
npm run build      # outputs dist/ with manifest + service worker
npm run serve      # build + start the realtime/static server on :3001
```

Install on a phone: open the **HTTPS** site in Chrome (Android) or Safari (iOS) →
**Add to Home screen / Install app**. Camera, mic, and notifications require HTTPS;
`localhost` also counts as secure for desktop testing.

---

## 3. Android app (Capacitor)

The native project lives in `android/` and was created with `npx cap add android`.
`webDir` is `dist`, and the WebView is served from `https://localhost`
(`server.androidScheme: "https"` in [capacitor.config.ts](capacitor.config.ts)) so
the page is a **secure context** — mandatory for `getUserMedia`/WebRTC.

### Permissions (already declared in `android/app/src/main/AndroidManifest.xml`)

| Permission | Why |
|-----------|-----|
| `INTERNET` | Socket.IO signaling + WebRTC |
| `ACCESS_NETWORK_STATE`, `ACCESS_WIFI_STATE` | Reconnect handling |
| `CAMERA` | Video calls |
| `RECORD_AUDIO`, `MODIFY_AUDIO_SETTINGS` | Voice/video audio |
| `POST_NOTIFICATIONS`, `VIBRATE` | Call/message alerts (Android 13+) |
| `READ_MEDIA_IMAGES` / `READ_EXTERNAL_STORAGE` (≤32) | Picking images |
| `FOREGROUND_SERVICE`, `WAKE_LOCK` | Keep a call alive in foreground |

> Capacitor's `BridgeWebChromeClient.onPermissionRequest` automatically shows the
> native camera/mic runtime prompt the first time `getUserMedia` runs, and grants the
> WebView once the user accepts. The manifest entries above are what make that work —
> no custom Java is required.

### Everyday workflow

```bash
# Rebuild the web app and copy it into the native project
npm run cap:sync

# (Re)generate native launcher icons + splash from assets/
npm run cap:assets

# Open in Android Studio (Run ▶ to a device/emulator)
npm run android:open

# Or build & launch directly to a connected device
npm run android:run
```

### Build an APK

```bash
# Debug (installable immediately, debug-signed)
npm run android:apk:debug
# -> android/app/build/outputs/apk/debug/app-debug.apk

# Release (uses keystore.properties if present — see signing below)
npm run android:apk:release
# -> android/app/build/outputs/apk/release/app-release.apk
```

### Build an Android App Bundle (AAB, for Play Store)

```bash
npm run android:bundle:release
# -> android/app/build/outputs/bundle/release/app-release.aab
```

---

## 4. Release signing (required for a real APK/AAB)

1. Generate a keystore (once, keep it safe — losing it means you can't update the app):

   ```bash
   keytool -genkey -v -keystore chatterpit-release.keystore \
     -alias chatterpit -keyalg RSA -keysize 2048 -validity 10000
   ```

2. Create `android/keystore.properties` from the template
   ([android/keystore.properties.example](android/keystore.properties.example)):

   ```properties
   storeFile=../../chatterpit-release.keystore
   storePassword=your-store-password
   keyAlias=chatterpit
   keyPassword=your-key-password
   ```

   `android/app/build.gradle` reads this file and wires up the release `signingConfig`
   automatically. `keystore.properties` and `*.keystore` are git-ignored.

3. Build the signed artifact:

   ```bash
   npm run android:bundle:release   # signed AAB for Play Store
   # or
   npm run android:apk:release      # signed APK for direct install
   ```

4. (Optional) Verify the signature:

   ```bash
   "%ANDROID_HOME%\build-tools\35.0.0\apksigner" verify --print-certs \
     android/app/build/outputs/apk/release/app-release.apk
   ```

> **Play Store note:** upload the **AAB**. Enroll in Play App Signing; Google
> re-signs for distribution, so your upload key just needs to be consistent.

---

## 5. Pointing the app at your server (long-distance)

The native app and PWA both connect to a realtime server. For two phones on different
networks you need one **public HTTPS** server (deployment or tunnel). Choose one:

- Bake it in at build time (recommended for the shipped app):

  ```bash
  # PowerShell
  $env:VITE_SOCKET_URL="https://your-server.example.com"; npm run cap:sync
  ```

- Or set it per-device in the app: **Account → Realtime server URL → Save**.

Optional TURN (needed on strict mobile/corporate NATs):
`VITE_TURN_URL`, `VITE_TURN_USERNAME`, `VITE_TURN_CREDENTIAL` at build time.

> The WebView runs on `https://localhost`, so the server URL **must be `https://`**;
> a plaintext `http://` server is blocked as mixed content.

---

## 6. Production verification checklist

Run through this on two physical phones (different networks) against your public server:

- [ ] Text messages deliver both directions in real time.
- [ ] Image send shows the "Sending image…" spinner, then a thumbnail; tap opens the
      full-screen viewer; back button / X closes it.
- [ ] Voice call: ring screen appears on callee, Accept connects two-way audio, timer
      runs, mute works, hang-up ends on both sides.
- [ ] Video call: remote + local (PiP) video render, camera toggle works.
- [ ] Decline shows "Call was declined"; not answering within 35s shows "No answer"
      (caller) and "Missed call from …" (callee).
- [ ] Turn off Wi-Fi mid-session: "No internet connection" banner + "Reconnecting…";
      restoring network auto-reconnects and re-joins the chat.
- [ ] Background the app during a chat, reopen: socket reconnects automatically.
- [ ] Android hardware back: ends an active call / closes viewer / exits at root.

---

## 7. Known blockers & gotchas for voice/video on Android

1. **No Android SDK in this environment** — install it (Android Studio) and set
   `ANDROID_HOME`; otherwise Gradle can't build. This is the only setup blocker.
2. **HTTP signaling server** — `getUserMedia` needs a secure context and the WebView is
   `https://localhost`, so your server **must** be HTTPS. Use a deployment or an HTTPS
   tunnel (`ngrok http 3001`, `cloudflared`).
3. **Symmetric/CGNAT mobile networks** — STUN alone often fails carrier-to-carrier.
   Configure a **TURN** server or calls will ring but never connect.
4. **First-call permission prompt** — the OS camera/mic dialog appears on the first
   call. If the user taps "Deny", calls fail until permissions are re-enabled in
   Android Settings → Apps → Chatter Pit → Permissions.
5. **Backgrounded calls** — Android may suspend the WebView in the background, freezing
   media. For always-on background calls you'd add a foreground service + CallStyle
   notification (out of scope here; `FOREGROUND_SERVICE`/`WAKE_LOCK` are pre-declared
   for that next step).
6. **Battery optimization** — aggressive OEM battery savers can kill the socket in the
   background; whitelist the app for reliable incoming-call delivery.
