#!/bin/bash

# Setup Vercel Environment Variables
# This script helps you configure DATABASE_URL and TELEGRAM_BOT_TOKEN in Vercel

echo "🔧 Vercel Environment Setup"
echo "============================="
echo ""

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Please install it first:"
    echo "   npm install -g vercel"
    exit 1
fi

# Telegram bot token (already known)
TELEGRAM_BOT_TOKEN="8277125543:AAH1BvEsW6B4Fl5tgBuGQYuLlEmD45_QXIQ"

echo "📝 I need the Railway DATABASE_URL (public TCP proxy URL)"
echo "   Get this from Railway dashboard > PostgreSQL > Connect tab"
echo "   It should look like: postgresql://postgres:PASSWORD@HOST.proxy.rlwy.net:PORT/railway"
echo ""
read -p "Enter DATABASE_URL: " DATABASE_URL

if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL cannot be empty"
    exit 1
fi

echo ""
echo "Adding environment variables to all environments (production, preview, development)..."
echo ""

# Add DATABASE_URL
echo "📦 Adding DATABASE_URL..."
echo "$DATABASE_URL" | vercel env add DATABASE_URL production preview development

# Add TELEGRAM_BOT_TOKEN
echo "📦 Adding TELEGRAM_BOT_TOKEN..."
echo "$TELEGRAM_BOT_TOKEN" | vercel env add TELEGRAM_BOT_TOKEN production preview development

echo ""
echo "✅ Environment variables added!"
echo ""
echo "🚀 Now deploying to production..."
vercel --prod

echo ""
echo "✨ Done! Your bot should now work."
echo "   Test it by sending /start to @Pepetidebot on Telegram"
