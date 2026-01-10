#!/usr/bin/env node

/**
 * Script to set up Telegram webhook for PEPEtide bot
 *
 * Usage:
 *   node scripts/setup-telegram-webhook.js <bot-token> <webhook-url>
 *
 * Example:
 *   node scripts/setup-telegram-webhook.js 123456:ABC-DEF https://your-app.vercel.app/api/telegram/webhook
 */

const BOT_TOKEN = process.argv[2];
const WEBHOOK_URL = process.argv[3];

if (!BOT_TOKEN || !WEBHOOK_URL) {
    console.error('❌ Error: Missing required arguments\n');
    console.log('Usage: node scripts/setup-telegram-webhook.js <bot-token> <webhook-url>\n');
    console.log('Example:');
    console.log('  node scripts/setup-telegram-webhook.js 123456:ABC-DEF https://pepetide.vercel.app/api/telegram/webhook\n');
    process.exit(1);
}

async function setupWebhook() {
    console.log('🔧 Setting up Telegram webhook...\n');
    console.log(`Bot Token: ${BOT_TOKEN.substring(0, 10)}...`);
    console.log(`Webhook URL: ${WEBHOOK_URL}\n`);

    try {
        // First, delete any existing webhook
        console.log('🗑️  Deleting existing webhook...');
        const deleteResponse = await fetch(
            `https://api.telegram.org/bot${BOT_TOKEN}/deleteWebhook`,
            { method: 'POST' }
        );
        const deleteResult = await deleteResponse.json();
        console.log(deleteResult.ok ? '✅ Deleted' : '⚠️  No webhook to delete');

        // Set the new webhook
        console.log('\n📡 Setting new webhook...');
        const setResponse = await fetch(
            `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: WEBHOOK_URL,
                    allowed_updates: ['message']
                })
            }
        );
        const setResult = await setResponse.json();

        if (setResult.ok) {
            console.log('✅ Webhook set successfully!\n');
        } else {
            console.error('❌ Failed to set webhook:', setResult);
            process.exit(1);
        }

        // Get webhook info to verify
        console.log('📋 Verifying webhook info...');
        const infoResponse = await fetch(
            `https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`
        );
        const info = await infoResponse.json();

        if (info.ok) {
            console.log('\n✅ Webhook Information:');
            console.log(`   URL: ${info.result.url}`);
            console.log(`   Pending updates: ${info.result.pending_update_count}`);
            console.log(`   Last error: ${info.result.last_error_message || 'None'}\n`);
        }

        // Get bot info
        console.log('🤖 Getting bot info...');
        const botResponse = await fetch(
            `https://api.telegram.org/bot${BOT_TOKEN}/getMe`
        );
        const botInfo = await botResponse.json();

        if (botInfo.ok) {
            console.log('\n✅ Bot Information:');
            console.log(`   Name: ${botInfo.result.first_name}`);
            console.log(`   Username: @${botInfo.result.username}`);
            console.log(`   Bot ID: ${botInfo.result.id}\n`);
            console.log(`🎉 Setup complete! Your bot is ready at: https://t.me/${botInfo.result.username}\n`);
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

setupWebhook();
