#!/bin/bash

# RealtyChain Local Setup Script
echo "🏠 Setting up RealtyChain locally..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  Creating .env file template..."
    cat > .env << EOL
# Database Connection - REPLACE YOUR_ACTUAL_PASSWORD with your real Supabase password
DATABASE_URL=postgresql://postgres:YOUR_ACTUAL_PASSWORD@db.urmcnyuydwnxpufkayrb.supabase.co:5432/postgres

# Supabase Configuration (Optional - for real-time features)
SUPABASE_URL=https://urmcnyuydwnxpufkayrb.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVybWNueXV5ZHdueXJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2MDI4MTQsImV4cCI6MjA2NzE3ODgxNH0.fnAhM_8Lyk4Ne6ycp63XbBeQUSgWygeUCfXVcSdqau4
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_if_needed
EOL
    echo "📝 .env file created. Please edit it with your Supabase credentials."
    echo ""
    echo "To get your Supabase credentials:"
    echo "1. Go to https://supabase.com/dashboard"
    echo "2. Select your project"
    echo "3. Go to Settings > API for URL and keys"
    echo "4. Go to Settings > Database for connection string"
    echo ""
else
    echo "✅ .env file already exists"
fi

# Try to push database schema
echo "🗄️  Setting up database..."
npm run db:push

if [ $? -eq 0 ]; then
    echo "✅ Database schema pushed successfully"
    
    # Try to seed database
    echo "🌱 Seeding database with sample data..."
    npm run db:seed
    
    if [ $? -eq 0 ]; then
        echo "✅ Database seeded successfully"
    else
        echo "⚠️  Database seeding failed. You can try again later with: npm run db:seed"
    fi
else
    echo "⚠️  Database setup failed. Please check your .env configuration."
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "To start the development server:"
echo "  npm run dev"
echo ""
echo "The application will be available at:"
echo "  http://localhost:5000"
echo ""
echo "Happy coding! 🚀"