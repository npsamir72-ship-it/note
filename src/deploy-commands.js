require("dotenv").config();
const { REST, Routes } = require("discord.js");
const commands = require("./commands");

const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID } = process.env;
if (!DISCORD_TOKEN || !CLIENT_ID || !GUILD_ID) {
  console.error("Missing DISCORD_TOKEN, CLIENT_ID or GUILD_ID in environment.");
  process.exit(1);
}

const rest = new REST({ version: "10" }).setToken(DISCORD_TOKEN);

(async () => {
  try {
    console.log("Registering AccessHub slash commands...");
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
    console.log("Commands registered. They should appear in your server shortly.");
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();