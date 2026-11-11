require("dotenv").config();

const express = require("express");
const fs = require("node:fs");
const path = require("node:path");
const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  AttachmentBuilder,
  Events,
  PermissionFlagsBits
} = require("discord.js");

const { ensureStorage, readConfig, writeConfig, ASSET_DIR } = require("./storage");
const { downloadImage, makeBannerWithWatermark } = require("./image-tools");

const { DISCORD_TOKEN, PORT = 3000 } = process.env;
if (!DISCORD_TOKEN) {
  console.error("DISCORD_TOKEN is missing. Add it to your Render environment variables.");
  process.exit(1);
}

ensureStorage();

const app = express();
app.get("/", (_req, res) => res.status(200).send("AccessHub Announcer is running."));
app.get("/health", (_req, res) => res.status(200).json({ status: "ok", service: "AccessHub Announcer" }));
app.listen(PORT, "0.0.0.0", () => console.log(`Health server listening on ${PORT}`));

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

function isAdmin(interaction) {
  return interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild);
}

function validHttpUrl(value) {
  if (!value) return null;
  try {
    const parsed = new URL(value);
    return ["http:", "https:"].includes(parsed.protocol) ? parsed.toString() : null;
  } catch {
    return null;
  }
}

function button(label, url, style) {
  const safeUrl = validHttpUrl(url);
  if (!safeUrl) return null;
  return new ButtonBuilder().setLabel(label).setURL(safeUrl).setStyle(style);
}

async function buildAnnouncement(interaction, config) {
  const type = interaction.options.getString("type", true);
  const title = interaction.options.getString("title", true);
  const product = interaction.options.getString("product");
  const price = interaction.options.getString("price");
  const stock = interaction.options.getString("stock");
  const delivery = interaction.options.getString("delivery");
  const description = interaction.options.getString("description");
  const productImage = interaction.options.getAttachment("product_image");
  const buyUrl = interaction.options.getString("buy_url");
  const productsUrl = interaction.options.getString("products_url");
  const supportUrl = interaction.options.getString("support_url");

  const headings = {
    restock: "📦 PRODUCT RESTOCKED!",
    new: "🚀 NEW PRODUCT AVAILABLE!",
    discount: "🔥 SPECIAL OFFER!",
    update: "📢 ACCESSHUB UPDATE"
  };

  const embed = new EmbedBuilder()
    .setColor(0x8B5CF6)
    .setTitle(`${headings[type]} ${title}`)
    .setDescription(description || (product ? `Your favourite product: **${product}**` : "Here's the latest update from AccessHub."))
    .setFooter({ text: "ACCESSHUB • Your Digital Marketplace" })
    .setTimestamp();

  if (product) embed.addFields({ name: "💎 Product", value: product, inline: true });
  if (price) embed.addFields({ name: "💰 Price", value: price, inline: true });
  if (stock) embed.addFields({ name: "📦 Stock", value: stock, inline: true });
  if (delivery) embed.addFields({ name: "⚡ Delivery", value: delivery, inline: true });

  const avatarPath = config.assets?.avatar;
  if (avatarPath && fs.existsSync(avatarPath)) {
    embed.setAuthor({ name: "AccessHub Announcer", iconURL: "attachment://accesshub-avatar.png" });
  } else {
    embed.setAuthor({ name: "AccessHub Announcer" });
  }

  if (productImage?.contentType?.startsWith("image/")) {
    embed.setImage(productImage.url);
  }

  const files = [];
  if (avatarPath && fs.existsSync(avatarPath)) {
    files.push(new AttachmentBuilder(avatarPath, { name: "accesshub-avatar.png" }));
  }

  const bannerBuffer = await makeBannerWithWatermark(config);
  if (bannerBuffer) {
    files.push(new AttachmentBuilder(bannerBuffer, { name: "accesshub-banner.png" }));
    embed.setImage("attachment://accesshub-banner.png");
    if (productImage?.contentType?.startsWith("image/")) {
      embed.addFields({ name: "Product image", value: `[View product image](${productImage.url})` });
    }
  }

  const row = new ActionRowBuilder();
  const buy = button("🛒 Buy Now", buyUrl, ButtonStyle.Link);
  const products = button("🛍️ View Products", productsUrl, ButtonStyle.Link);
  const support = button("🎧 Support", supportUrl, ButtonStyle.Secondary);
  [buy, products, support].filter(Boolean).forEach(item => row.addComponents(item));

  return { embeds: [embed], files, components: row.components.length ? [row] : [] };
}

client.once(Events.ClientReady, readyClient => {
  console.log(`Logged in as ${readyClient.user.tag}`);
  console.log("AccessHub Announcer is ready.");
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  try {
    if (!isAdmin(interaction)) {
      return interaction.reply({ content: "You need the **Manage Server** permission to use this command.", ephemeral: true });
    }

    const config = readConfig();

    if (interaction.commandName === "setchannel") {
      const channel = interaction.options.getChannel("channel", true);
      config.channels[interaction.guildId] = channel.id;
      writeConfig(config);
      return interaction.reply({ content: `✅ Announcement channel set to ${channel}.`, ephemeral: true });
    }

    if (interaction.commandName === "setassets") {
      await interaction.deferReply({ ephemeral: true });
      const type = interaction.options.getString("type", true);
      const attachment = interaction.options.getAttachment("image", true);
      if (!attachment.contentType?.startsWith("image/")) {
        return interaction.editReply("Please upload a valid image file.");
      }

      const extensions = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/gif": "gif" };
      const extension = extensions[attachment.contentType] || "png";
      const destination = path.join(ASSET_DIR, `${type}.${extension}`);
      try {
        await downloadImage(attachment.url, destination);
      } catch (error) {
        return interaction.editReply(`Could not save image: ${error.message}`);
      }

      config.assets[type] = destination;
      if (type === "watermark") {
        const opacity = interaction.options.getNumber("opacity");
        if (opacity !== null) config.watermarkOpacity = opacity;
      }
      writeConfig(config);
      return interaction.editReply(`✅ AccessHub ${type} saved successfully.`);
    }

    if (interaction.commandName === "announce") {
      await interaction.deferReply({ ephemeral: interaction.options.getBoolean("preview") ?? false });
      const payload = await buildAnnouncement(interaction, config);
      const preview = interaction.options.getBoolean("preview") ?? false;

      if (preview) {
        return interaction.editReply({ content: "👀 **Private preview** — only you can see this.", ...payload });
      }

      const channelId = config.channels[interaction.guildId];
      if (!channelId) {
        return interaction.editReply("Set your announcement channel first using `/setchannel`.");
      }

      const channel = await client.channels.fetch(channelId);
      if (!channel || !channel.isTextBased() || !channel.send) {
        return interaction.editReply("The saved announcement channel is unavailable. Run `/setchannel` again.");
      }

      await channel.send(payload);
      return interaction.editReply("✅ Your AccessHub announcement has been published.");
    }
  } catch (error) {
    console.error("Interaction error:", error);
    const message = "Something went wrong. Check the Render logs for details.";
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply({ content: message }).catch(() => {});
    } else {
      await interaction.reply({ content: message, ephemeral: true }).catch(() => {});
    }
  }
});

client.login(DISCORD_TOKEN);