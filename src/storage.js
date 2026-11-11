const fs = require("node:fs");
const path = require("node:path");

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
const ASSET_DIR = path.join(DATA_DIR, "assets");
const CONFIG_FILE = path.join(DATA_DIR, "config.json");

function ensureStorage() {
  fs.mkdirSync(ASSET_DIR, { recursive: true });
  if (!fs.existsSync(CONFIG_FILE)) {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify({ channels: {}, assets: {}, watermarkOpacity: 0.22 }, null, 2));
  }
}

function readConfig() {
  ensureStorage();
  try {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8"));
  } catch {
    return { channels: {}, assets: {}, watermarkOpacity: 0.22 };
  }
}

function writeConfig(config) {
  ensureStorage();
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

module.exports = { DATA_DIR, ASSET_DIR, ensureStorage, readConfig, writeConfig };