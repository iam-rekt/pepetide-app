# Notification System Status

## Current Implementation

### Browser Notifications
**Status:** ✅ Implemented & Improved
**Trigger:** Client-side checker runs every 5 minutes
**Condition:** Shows notification for doses that are:
- Status: `pending`
- Scheduled time is in the past (< now)
- **No time window restriction** - shows ALL overdue doses

**Limitations:**
1. Only works when app is open in browser
2. Requires notification permission granted
3. May show multiple notifications if many doses are overdue

### Telegram Notifications
**Status:** ✅ Implemented & Improved
**Trigger:** Sent along with browser notifications
**Condition:** Same as browser - ALL overdue pending doses
**Format:** MarkdownV2 with emojis

**Limitations:**
1. Only works if app is open
2. User must be connected to Telegram bot
3. May send multiple messages if many doses are overdue

## Remaining Issues

### 1. Notifications Only Work When App is Open
- Browser notifications require the tab/PWA to be active
- No Service Worker push notification implementation
- Telegram notifications also only sent when app is open

### 2. ~~15-Minute Window Too Restrictive~~ ✅ FIXED
**Previous logic:**
```typescript
scheduledDate < now && scheduledDate > fifteenMinutesAgo
```

**New logic:**
```typescript
scheduledDate < now  // Shows ALL overdue doses
```

Now whenever you open the app, you'll get notified about ALL missed doses, regardless of when they were scheduled.

### 3. No True Background Notifications
- No Service Worker implementation
- No background sync
- Telegram bot only sends when app is open

## Recommendations for Further Improvement

### ~~Option 1: Extend the Window~~ ✅ DONE
~~Change from 15 minutes to several hours~~

### ~~Option 2: Show All Missed Doses~~ ✅ IMPLEMENTED
This is now the default behavior. All overdue pending doses are shown.

### Option 1: Add Service Worker
Implement proper PWA push notifications that work even when app is closed.

### Option 2: Telegram-Only Background
User sets up Telegram bot, we send scheduled reminders via cron (but Vercel Hobby has 20 cron limit).

### Option 3: Smart Notification Deduplication
To avoid spamming users with multiple notifications when they have many overdue doses, implement:
- Only show notification once per dose (track which have been notified)
- Group multiple missed doses into a single summary notification
- Add "snooze" functionality

## Testing Notifications

### To Test Browser Notifications:
1. Add a protocol with a dose scheduled in the past (any time, no longer limited to 15 min)
2. Keep app open
3. Wait for next 5-minute check cycle
4. Should see browser notification for ALL overdue doses

### To Test Telegram:
1. Connect Telegram bot in Settings
2. Add protocol with past dose (can be any time in the past)
3. Keep app open
4. Should receive Telegram message for ALL overdue doses

### Current Behavior:
- ✅ Checker runs every 5 minutes
- ✅ Browser permission requested in Settings
- ✅ Telegram integration works
- ✅ Shows ALL overdue doses (no time window restriction)
- ❌ Requires app to be open (inherent limitation without Service Worker)
