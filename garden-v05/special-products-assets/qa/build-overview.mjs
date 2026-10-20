import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const sharp = require(process.env.SHARP_MODULE || "sharp");

const qaDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(qaDir, "..");
const manifestPath = path.join(root, "manifest.json");
const outputPath = path.join(qaDir, "collection-overview.png");

const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
const items = manifest.items;
if (items.length !== 30) {
  throw new Error("Expected 30 manifest items, got " + items.length);
}

const columns = 5;
const cardWidth = 480;
const cardHeight = 540;
const headerHeight = 120;
const canvasWidth = columns * cardWidth;
const canvasHeight = headerHeight + Math.ceil(items.length / columns) * cardHeight;
const background = "#231F2E";
const cardFill = "#2D293B";
const cardFillAlt = "#302A3D";
const outline = "#5A4659";
const warm = "#F5D69A";
const warmMuted = "#C7A878";
const coolMuted = "#B3A4B8";
const accent = "#8B4A3F";

function esc(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function wrapLabel(value, maxChars = 27) {
  const words = String(value).trim().split(/\s+/);
  const lines = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? current + " " + word : word;
    if (current && candidate.length > maxChars) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  if (lines.length <= 2) return lines;
  const last = lines.splice(1).join(" ");
  return [lines[0], last];
}

const cardSvgParts = [
  `<svg xmlns="http://www.w3.org/2000/svg" width="${canvasWidth}" height="${canvasHeight}" viewBox="0 0 ${canvasWidth} ${canvasHeight}">
  <rect width="100%" height="100%" fill="${background}"/>
  <text x="52" y="48" fill="${warm}" font-family="Arial, Helvetica, sans-serif" font-size="40" font-weight="700" letter-spacing="1.4">DẤU ẤN HARRY POTTER</text>
  <text x="54" y="82" fill="${warmMuted}" font-family="Arial, Helvetica, sans-serif" font-size="21" font-weight="500">30 sản phẩm đặc biệt</text>
  <path d="M52 99H${canvasWidth - 52}" stroke="${accent}" stroke-width="3" opacity="0.8"/>
  <circle cx="${canvasWidth - 65}" cy="46" r="6" fill="${warm}" opacity="0.9"/>
  <circle cx="${canvasWidth - 42}" cy="46" r="3" fill="${warmMuted}" opacity="0.85"/>`
];

for (let index = 0; index < items.length; index += 1) {
  const item = items[index];
  const col = index % columns;
  const row = Math.floor(index / columns);
  const x = col * cardWidth;
  const y = headerHeight + row * cardHeight;
  const inset = 10;
  const fill = row % 2 === 0 ? cardFill : cardFillAlt;
  const lines = wrapLabel(item.label);
  const labelY = lines.length === 1 ? y + 487 : y + 469;
  const metaY = y + 523;
  const meta = `Tập ${item.bookReference.book} · Chương ${item.bookReference.chapter}`;

  cardSvgParts.push(
    `<rect x="${x + inset}" y="${y + inset}" width="${cardWidth - inset * 2}" height="${cardHeight - inset * 2}" rx="14" fill="${fill}" stroke="${outline}" stroke-width="2"/>
    <path d="M${x + 35} ${y + 39}H${x + cardWidth - 35}" stroke="${outline}" stroke-width="1" opacity="0.35"/>
    <circle cx="${x + 38}" cy="${y + 32}" r="3" fill="${warmMuted}" opacity="0.7"/>
    <text x="${x + cardWidth / 2}" y="${labelY}" fill="${warm}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="600" letter-spacing="0.1">${esc(lines[0])}</text>`
  );
  if (lines.length === 2) {
    cardSvgParts.push(
      `<text x="${x + cardWidth / 2}" y="${labelY + 25}" fill="${warm}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="600" letter-spacing="0.1">${esc(lines[1])}</text>`
    );
  }
  cardSvgParts.push(
    `<text x="${x + cardWidth / 2}" y="${metaY}" fill="${coolMuted}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="17" font-weight="500">${esc(meta)}</text>
    <path d="M${x + 170} ${y + 532}H${x + cardWidth - 170}" stroke="${accent}" stroke-width="2" opacity="0.65"/>`
  );
}

cardSvgParts.push("</svg>");
const cardSvg = Buffer.from(cardSvgParts.join(""));

const spriteLayers = [];
for (let index = 0; index < items.length; index += 1) {
  const item = items[index];
  const sourcePath = path.join(root, item.defaultFile);
  const source = await fs.readFile(sourcePath);
  const image = sharp(source);
  const metadata = await image.metadata();
  const expectedWidth = item.width;
  const expectedHeight = item.height;
  if (metadata.width !== expectedWidth || metadata.height !== expectedHeight) {
    throw new Error(`${item.id}: manifest ${expectedWidth}x${expectedHeight}, source ${metadata.width}x${metadata.height}`);
  }
  const scaledWidth = expectedWidth * 2;
  const scaledHeight = expectedHeight * 2;
  const col = index % columns;
  const row = Math.floor(index / columns);
  const cardX = col * cardWidth;
  const cardY = headerHeight + row * cardHeight;
  const baselineY = cardY + 458;
  const left = cardX + Math.round((cardWidth - scaledWidth) / 2);
  const top = baselineY - scaledHeight;
  spriteLayers.push({
    input: await image.resize(scaledWidth, scaledHeight, { kernel: sharp.kernel.nearest }).png().toBuffer(),
    left,
    top
  });
}

await sharp(cardSvg)
  .composite(spriteLayers)
  .png({ compressionLevel: 9, adaptiveFiltering: false })
  .toFile(outputPath);

const outputMetadata = await sharp(outputPath).metadata();
console.log(JSON.stringify({
  output: outputPath,
  width: outputMetadata.width,
  height: outputMetadata.height,
  itemCount: items.length,
  scale: "2x nearest",
  grid: `${columns} columns × ${Math.ceil(items.length / columns)} rows`,
  card: `${cardWidth}×${cardHeight}`
}, null, 2));
