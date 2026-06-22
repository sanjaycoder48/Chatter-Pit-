// Capacitor native bootstrap. On the web these are all no-ops so the same
// codebase runs as a PWA and as the Android app.
import { Capacitor } from "@capacitor/core";

export const isNative = Capacitor.isNativePlatform();

export async function initNative() {
  if (!isNative) return;

  try {
    const { StatusBar, Style } = await import("@capacitor/status-bar");
    // Dark style = light icons/text, matching the app's dark theme.
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: "#111827" });
  } catch {
    // StatusBar is unavailable on some devices; ignore.
  }

  try {
    const { SplashScreen } = await import("@capacitor/splash-screen");
    // Hide once the web app has painted so users don't stare at the splash.
    setTimeout(() => SplashScreen.hide().catch(() => {}), 300);
  } catch {
    // No splash plugin; nothing to hide.
  }
}
