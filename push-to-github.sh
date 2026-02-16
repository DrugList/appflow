#!/bin/bash

# AppFlow GitHub Push Script
# ========================================

echo "🚀 Pushing AppFlow to GitHub"
echo ""
echo "Please enter your GitHub repository URL"
echo "Example: https://github.com/yourusername/appflow.git"
echo ""
read -p "GitHub Repo URL: " REPO_URL

if [ -z "$REPO_URL" ]; then
    echo "❌ No URL provided. Exiting."
    exit 1
fi

echo ""
echo "Adding remote..."
git remote add origin "$REPO_URL" 2>/dev/null || git remote set-url origin "$REPO_URL"

echo "Pushing to GitHub..."
git branch -M main
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Successfully pushed to GitHub!"
    echo "🎉 Your AppFlow PWA Builder is now on GitHub!"
else
    echo ""
    echo "❌ Push failed. Make sure you:"
    echo "   1. Created the repository on GitHub first"
    echo "   2. Are authenticated with GitHub (git config --global credential.helper manager)"
    echo "   3. Have the correct repository URL"
fi
