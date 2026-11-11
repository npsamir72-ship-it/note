# AccessHub Announcer

A Discord announcement bot built with Node.js, Discord.js v14, Express health checks, and Sharp image processing. Designed for GitHub + Render.

## Features

- Product restock, new product, discount, and server update announcements
- Custom avatar shown in announcement embeds
- Custom announcement banner
- Server watermark overlaid on the banner
- Adjustable watermark opacity
- Buy Now, View Products, and Support URL buttons
- Selectable announcement channel
- Private preview mode
- Admin-only slash commands

> Note: `/setassets type:avatar` sets the avatar displayed in announcement embeds. It does not change the actual Discord bot account profile picture. Change the actual bot profile picture in the Discord Developer Portal.

## 1. Create your Discord application

1. Open https://discord.com/developers/applications
2. Create an application named **AccessHub Announcer**.
3. Open **Bot** and create/reset the bot token. Keep it private.
4. Copy the **Application ID** from General Information.
5. Invite the bot using OAuth2 URL Generator:
   - Scopes: `bot`, `applications.commands`
   - Bot permissions: View Channels, Send Messages, Embed Links, Attach Files, Read Message History
6. Invite it to your server.

## 2. Configure locally

1. Install Node.js 20 or newer.
2. Copy `.env.example` to `.env`.
3. Fill in `DISCORD_TOKEN`, `CLIENT_ID`, and `GUILD_ID`.
4. Install packages:

```bash
npm install
```

5. Register slash commands in your server:

```bash
npm run register
```

6. Start the bot:

```bash
npm start
```

## 3. Upload to GitHub

Create a new GitHub repository, then upload all project files. Do not upload `.env` or your bot token.

## 4. Deploy on Render

1. Open https://render.com and choose **New > Web Service**.
2. Connect your GitHub repository.
3. Render should detect `render.yaml`. If configuring manually:
   - Runtime: Node
   - Build command: `npm install`
   - Start command: `npm start`
   - Health check path: `/health`
4. Add environment variables:
   - `DISCORD_TOKEN`: your bot token
   - `CLIENT_ID`: your Discord application ID
   - `GUILD_ID`: your Discord server ID
   - `DATA_DIR`: `/var/data`
5. Add a persistent disk mounted at `/var/data` if you need uploaded avatar/banner/watermark files and configuration to survive redeploys.
6. Deploy.

The bot logs in to Discord when the Render service starts. The small Express server provides Render's `/health` check.

## 5. Use the bot in Discord

First configure the announcement channel:

```text
/setchannel channel:#announcements
```

Upload your announcement branding:

```text
/setassets type:avatar image:<upload your avatar>
/setassets type:banner image:<upload your banner>
/setassets type:watermark image:<upload your transparent watermark> opacity:0.22
```

Create a private preview:

```text
/announce type:restock title:"Back in stock" product:"Spotify Premium" price:"$9.99" stock:"Available" delivery:"Instant" preview:true
```

Publish an announcement:

```text
/announce type:restock title:"Back in stock" product:"Spotify Premium" price:"$9.99" stock:"Available" delivery:"Instant" buy_url:"https://example.com/buy" products_url:"https://example.com" support_url:"https://example.com/support"
```

The `buy_url`, `products_url`, and `support_url` options must be valid HTTP or HTTPS links. Buttons are only displayed for links you provide.

## Important notes

- Render's free web services may spin down after inactivity. A persistent disk may require a paid Render plan; check your current Render plan and pricing.
- Without a persistent disk, uploaded assets and local JSON configuration can be lost on redeploy/restart.
- Slash commands are registered to the `GUILD_ID` server using `npm run register`. Run this again if you change command definitions.
- Only give the bot permissions it needs. Never share your bot token or commit `.env` to GitHub.
- This starter uses a single server configuration file. For multiple Discord servers, expand the config and authorization model before public distribution.
