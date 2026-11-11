const {
  SlashCommandBuilder,
  ChannelType,
  PermissionFlagsBits
} = require("discord.js");

const commands = [
  new SlashCommandBuilder()
    .setName("setchannel")
    .setDescription("Choose where AccessHub announcements are posted")
    .addChannelOption(option =>
      option.setName("channel").setDescription("Announcement channel").addChannelTypes(ChannelType.GuildText).setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  new SlashCommandBuilder()
    .setName("setassets")
    .setDescription("Upload AccessHub announcement branding")
    .addStringOption(option =>
      option.setName("type").setDescription("Which asset are you uploading?")
        .setRequired(true)
        .addChoices(
          { name: "Bot avatar shown in announcements", value: "avatar" },
          { name: "Announcement banner", value: "banner" },
          { name: "Server watermark", value: "watermark" }
        ))
    .addAttachmentOption(option =>
      option.setName("image").setDescription("PNG, JPG or WEBP image (max 8 MB)").setRequired(true))
    .addNumberOption(option =>
      option.setName("opacity").setDescription("Watermark opacity from 0.05 to 1 (watermark only)")
        .setMinValue(0.05).setMaxValue(1))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  new SlashCommandBuilder()
    .setName("announce")
    .setDescription("Create an AccessHub product announcement")
    .addStringOption(option =>
      option.setName("type").setDescription("Announcement type").setRequired(true)
        .addChoices(
          { name: "Product restock", value: "restock" },
          { name: "New product", value: "new" },
          { name: "Discount offer", value: "discount" },
          { name: "Server update", value: "update" }
        ))
    .addStringOption(option => option.setName("title").setDescription("Announcement headline").setRequired(true).setMaxLength(100))
    .addStringOption(option => option.setName("product").setDescription("Product name").setMaxLength(100))
    .addStringOption(option => option.setName("price").setDescription("Price, e.g. $9.99").setMaxLength(40))
    .addStringOption(option => option.setName("stock").setDescription("Stock status, e.g. Available").setMaxLength(60))
    .addStringOption(option => option.setName("delivery").setDescription("Delivery details").setMaxLength(60))
    .addStringOption(option => option.setName("description").setDescription("Short description").setMaxLength(500))
    .addAttachmentOption(option => option.setName("product_image").setDescription("Optional product image"))
    .addStringOption(option => option.setName("buy_url").setDescription("Purchase link").setMaxLength(500))
    .addStringOption(option => option.setName("products_url").setDescription("View all products link").setMaxLength(500))
    .addStringOption(option => option.setName("support_url").setDescription("Support link").setMaxLength(500))
    .addBooleanOption(option => option.setName("preview").setDescription("Show privately instead of publishing"))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
];

module.exports = commands.map(command => command.toJSON());