#!/bin/bash

# 🚀 Pre-commit checks - Quick validation before committing
# Usage: ./scripts/pre-commit.sh

set -e

echo "🔍 Running pre-commit checks..."

# Quick quality checks (no build or smoke test)
echo "⚡ ESLint..."
pnpm run lint

echo "⚡ TypeScript..."
pnpm run type-check

echo "⚡ Prettier..."
pnpm run format:check

echo "✅ Pre-commit checks passed! Ready to commit."
