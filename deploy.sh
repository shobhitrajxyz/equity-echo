#!/bin/bash

echo "🚀 Deploying Equity Echo to Global Public Access..."

# Check if logged into gh CLI
if ! gh auth status >/dev/null 2>&1; then
    echo "🔑 Logging into GitHub CLI..."
    gh auth login
fi

echo "📦 Creating public GitHub repository 'equity-echo'..."
gh repo create equity-echo --public --source=. --remote=origin --push

echo "✅ Code successfully pushed to GitHub!"
echo "🌐 Next steps to go live:"
echo "1. Render (Backend): https://render.com -> Blueprint -> Connect 'equity-echo'"
echo "2. Vercel (Frontend): https://vercel.com -> Import 'equity-echo' -> Set VITE_API_URL"
