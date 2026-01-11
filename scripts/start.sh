#!/bin/sh
# Startup script that runs migrations before starting the app

echo "Running database migrations..."
npx prisma migrate deploy || echo "Warning: Migrations failed or skipped"

echo "Starting Next.js app..."
npm run start:next
