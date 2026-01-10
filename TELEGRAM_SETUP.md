# Telegram Bot Setup Guide

This guide will help you set up Telegram notifications for PEPEtide.

## Prerequisites

- A Telegram account
- Your deployed app URL (Vercel or Railway)
- Access to your deployment environment variables

## Step 1: Create a Telegram Bot

1. Open Telegram and search for **@BotFather**
2. Start a chat and send `/newbot`
3. Follow the prompts:
   - Enter a name for your bot (e.g., "PEPEtide Reminder")
   - Enter a username (must end in 'bot', e.g., "PeptideTrackBot")
4. BotFather will give you a **bot token** like: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`
5. **Save this token** - you'll need it for the next steps

## Step 2: Add Bot Token to Environment Variables

### For Vercel:
1. Go to your Vercel dashboard
2. Select your PEPEtide project
3. Go to **Settings** → **Environment Variables**
4. Add a new variable:
   - **Name:** `TELEGRAM_BOT_TOKEN`
   - **Value:** Your bot token from Step 1
   - **Environment:** Production, Preview, Development
5. Click **Save**
6. Redeploy your app (Vercel will do this automatically)

### For Railway:
1. Go to your Railway dashboard
2. Select your PEPEtide project
3. Go to **Variables** tab
4. Add a new variable:
   - **Name:** `TELEGRAM_BOT_TOKEN`
   - **Value:** Your bot token from Step 1
5. Click **Add**
6. Railway will automatically redeploy

## Step 3: Set Up Webhook

After your app redeploys with the bot token, you need to tell Telegram where to send updates.

### Option A: Using the Setup Script (Recommended)

```bash
# From your project directory
node scripts/setup-telegram-webhook.js YOUR_BOT_TOKEN https://your-app.vercel.app/api/telegram/webhook
```

Replace:
- `YOUR_BOT_TOKEN` with your actual bot token
- `your-app.vercel.app` with your deployment URL

### Option B: Manual Setup via cURL

```bash
curl -X POST "https://api.telegram.org/botYOUR_BOT_TOKEN/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://your-app.vercel.app/api/telegram/webhook"}'
```

### Verify Webhook Setup

Check if the webhook is set correctly:

```bash
curl "https://api.telegram.org/botYOUR_BOT_TOKEN/getWebhookInfo"
```

You should see your webhook URL in the response.

## Step 4: Test the Connection

1. Open your deployed PEPEtide app
2. Navigate to **Settings** page
3. Click **Connect** under "Telegram Bot"
4. You'll see a connection code and a link to your bot
5. Click the link or search for your bot in Telegram (e.g., `@PeptideTrackBot`)
6. Click **Start** in Telegram
7. The bot should send you a confirmation message
8. Return to the app - it should show "Connected"

## Troubleshooting

### "Connect" button does nothing
- **Check browser console** for errors (F12 → Console tab)
- **Verify DATABASE_URL** is set in environment variables
- **Check deployment logs** for database migration errors

### Bot doesn't respond to /start
- **Verify webhook** is set correctly using `getWebhookInfo`
- **Check deployment logs** for webhook errors
- **Ensure TELEGRAM_BOT_TOKEN** is correctly set in environment variables

### Connection code doesn't work
- **Make sure database migrations ran** - Check Railway/Vercel logs for "Database migrations applied"
- **Verify the bot token** matches between environment variable and BotFather
- **Check webhook URL** is correct and accessible

### Webhook errors in logs
- **SSL certificate required** - Make sure you're using HTTPS (Vercel/Railway provide this automatically)
- **Webhook URL must be public** - localhost won't work
- **Check Railway/Vercel logs** for specific error messages

## Environment Variables Summary

Required environment variables:

```env
# Database (Railway provides this automatically)
DATABASE_URL=postgresql://...

# Telegram Bot
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
```

## Testing Notifications

Once connected:

1. Create a protocol with a scheduled dose
2. Wait for the scheduled time to pass (or manually mark it as missed)
3. Open the app - you should see a browser notification
4. If Telegram is connected, you'll also receive a message on Telegram

## Debugging

Enable detailed logging by checking:

1. **Browser Console** (F12 → Console)
   - Should show "Settings component mounted"
   - Any API errors will appear here

2. **Network Tab** (F12 → Network)
   - Check `/api/user/create` - should return a userId
   - Check `/api/user/[id]/status` - should return connection status

3. **Railway/Vercel Logs**
   - Look for webhook POST requests
   - Check for Prisma errors
   - Verify migrations ran successfully

## Need Help?

If you're still having issues:

1. Check the deployment logs
2. Verify all environment variables are set
3. Test the webhook manually with cURL
4. Check if the database tables exist (users, synced_protocols, synced_logs)
