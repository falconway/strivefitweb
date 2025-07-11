#!/bin/bash

# Railway startup script
echo "🚀 Starting Strive & Fit Medical Document Management System"

# Create storage directories if they don't exist
mkdir -p storage/uploads
mkdir -p storage/processed

# Initialize accounts.json if it doesn't exist
if [ ! -f storage/accounts.json ]; then
    echo "{}" > storage/accounts.json
    echo "✅ Created initial accounts.json"
fi

# Set permissions
chmod -R 755 storage/

echo "📁 Storage initialized at: $PWD/storage"
echo "🔄 Starting Node.js server..."

# Start the server
node server.js