const fs = require("node:fs");
const path = require("node:path");
const sharp = require("sharp");
const { ASSET_DIR } = require("./storage");

async function downloadImage(url, destination) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Could not download image (HTTP ${response.status}).`);
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.startsWith("image/")) throw new Error("The attachment must be an image.");
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length > 8 * 1024 * 1024) throw new Error("Please use an image smaller than 8 MB.");
  await sharp(buffer).metadata();
  fs.writeFileSync(destination, buffer);
}

async function makeBannerWithWatermark(config) {
  const bannerPath = config.assets?.banner;
  if (!bannerPath || !fs.existsSync(bannerPath)) return null;

  const base = sharp(bannerPath).resize(1600, 500, { fit: "cover" });
  const watermarkPath = config.assets?.watermark;

  if (watermarkPath && fs.existsSync(watermarkPath)) {
    const opacity = Math.max(0, Math.min(1, Number(config.watermarkOpacity ?? 0.22)));
    const watermark = await sharp(watermarkPath)
      .resize({ width: 240, height: 240, fit: "inside" })
      .ensureAlpha(opacity)
      .png()
      .toBuffer();

    return base
      .composite([{ input: watermark, gravity: "southeast", blend: "over" }])
      .png()
      .toBuffer();
  }
  return base.png().toBuffer();
}

module.exports = { downloadImage, makeBannerWithWatermark };