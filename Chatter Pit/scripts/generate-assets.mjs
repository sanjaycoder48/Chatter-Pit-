// Generates PWA PNG icons (into public/) and the source images that
// @capacitor/assets needs (into assets/) from the Chatter Pit logo.
// Run with: node scripts/generate-assets.mjs
import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = join(root, "public");
const assetsDir = join(root, "assets");
mkdirSync(assetsDir, { recursive: true });

const BG = "#0a0a0a";

// The logo glyph (chat bubble + lines + presence check), 512 viewBox.
const glyph = `
  <path d="M120 148c0-34 28-62 62-62h148c34 0 62 28 62 62v118c0 34-28 62-62 62h-82l-72 72c-14 14-38 4-38-16v-60c-12-6-18-20-18-36V148Z" fill="#2563eb"/>
  <path d="M172 180h168M172 230h120" stroke="#f8fafc" stroke-width="34" stroke-linecap="round"/>
  <circle cx="344" cy="336" r="56" fill="#22c55e"/>
  <path d="m322 336 16 16 30-34" fill="none" stroke="#052e16" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/>
`;

// Full app icon: rounded dark tile + glyph.
const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="112" fill="${BG}"/>
  ${glyph}
</svg>`;

// Adaptive-icon foreground: glyph only, on transparent, inside the safe zone.
const foregroundSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <g transform="translate(192,192) scale(1.25)">${glyph}</g>
</svg>`;

const backgroundSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024"><rect width="1024" height="1024" fill="${BG}"/></svg>`;

// Splash: centered logo on a dark canvas.
const splashSvg = (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="${BG}"/>
  <g transform="translate(${(size - 640) / 2},${(size - 640) / 2}) scale(${640 / 512})">${glyph}</g>
</svg>`;

const png = (svg) => sharp(Buffer.from(svg)).png();

const tasks = [
  // PWA icons referenced by the web manifest.
  [iconSvg, [64], join(publicDir, "pwa-64x64.png")],
  [iconSvg, [192], join(publicDir, "pwa-192x192.png")],
  [iconSvg, [512], join(publicDir, "pwa-512x512.png")],
  [foregroundSvg, [512], join(publicDir, "maskable-icon-512x512.png")],
  [iconSvg, [180], join(publicDir, "apple-touch-icon-180x180.png")],
  [iconSvg, [512], join(publicDir, "favicon.png")],
  // Source images consumed by @capacitor/assets for native Android resources.
  [iconSvg, [1024], join(assetsDir, "icon-only.png")],
  [foregroundSvg, [1024], join(assetsDir, "icon-foreground.png")],
  [backgroundSvg, [1024], join(assetsDir, "icon-background.png")],
  [splashSvg(2732), [2732], join(assetsDir, "splash.png")],
  [splashSvg(2732), [2732], join(assetsDir, "splash-dark.png")],
];

await Promise.all(
  tasks.map(([svg, [size], out]) =>
    png(svg).resize(size, size).toFile(out).then(() => console.log("wrote", out)),
  ),
);

console.log("Asset generation complete.");
