#!/bin/bash
set -e

# Configuration
DEFAULT_BRANCH=$(git branch --show-current)

# Prompt for commit message
echo "Enter commit message:"
read -r COMMIT_MSG

if [ -z "$COMMIT_MSG" ]; then
  echo "Error: Commit message cannot be empty."
  exit 1
fi

# Prompt for branch (default to current)
echo "Enter branch to push to (default: $DEFAULT_BRANCH):"
read -r BRANCH
BRANCH=${BRANCH:-$DEFAULT_BRANCH}

# Execution
echo "Adding all changes..."
git add .

echo "Committing with message: '$COMMIT_MSG'..."
git commit -m "$COMMIT_MSG"

echo "Pushing to origin/$BRANCH..."
git push origin "$BRANCH"

echo "Success! Changes pushed to $BRANCH."
