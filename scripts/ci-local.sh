#!/bin/bash

# 🚀 Local CI Script - Run the same checks as GitHub Actions
# Usage: ./scripts/ci-local.sh [--skip-smoke-test]

set -e  # Exit on any error

SKIP_SMOKE_TEST=false
if [[ "$1" == "--skip-smoke-test" ]]; then
  SKIP_SMOKE_TEST=true
fi

echo "🔥 Starting Local CI Pipeline..."
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_step() {
  echo -e "\n${BLUE}🔸 $1${NC}"
}

print_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
  echo -e "${RED}❌ $1${NC}"
}

# Step 1: Quality Checks
print_step "Running Quality Checks"
echo "--------------------------------------"

print_step "ESLint Check"
if pnpm run lint; then
  print_success "ESLint passed"
else
  print_error "ESLint failed"
  echo "💡 Run 'pnpm run lint:fix' to auto-fix issues"
  exit 1
fi

print_step "TypeScript Check"
if pnpm run type-check; then
  print_success "TypeScript check passed"
else
  print_error "TypeScript check failed"
  exit 1
fi

print_step "Prettier Format Check"
if pnpm run format:check; then
  print_success "Formatting is correct"
else
  print_error "Code formatting issues found"
  echo "💡 Run 'pnpm run format' to fix formatting"
  exit 1
fi

print_step "Build Test"
if pnpm run build; then
  print_success "Build successful"
else
  print_error "Build failed"
  exit 1
fi

# Step 2: Smoke Test (optional)
if [[ "$SKIP_SMOKE_TEST" == "false" ]]; then
  print_step "Smoke Test"
  echo "Starting server and testing homepage..."
  
  # Start server in background
  pnpm start &
  SERVER_PID=$!
  
  # Wait for server to start
  sleep 10
  
  # Test homepage
  if curl -f http://localhost:3000 > /dev/null 2>&1; then
    print_success "Smoke test passed - homepage loads correctly"
  else
    print_error "Smoke test failed - homepage not accessible"
    kill $SERVER_PID 2>/dev/null || true
    exit 1
  fi
  
  # Kill server
  kill $SERVER_PID 2>/dev/null || true
  sleep 2
else
  print_warning "Skipping smoke test (use --skip-smoke-test to skip)"
fi

# Step 3: Security Checks
print_step "Security Audit"
echo "--------------------------------------"

if pnpm audit --audit-level=moderate; then
  print_success "Security audit passed"
else
  print_warning "Security vulnerabilities found"
  echo "💡 Run 'pnpm audit --fix' to attempt automatic fixes"
fi

print_step "Dependency Check"
if pnpm outdated; then
  print_warning "Outdated dependencies found"
  echo "💡 Consider updating dependencies"
else
  print_success "All dependencies are up to date"
fi

# Final summary
echo ""
echo "======================================"
echo -e "${GREEN}🎉 Local CI Pipeline Completed Successfully!${NC}"
echo ""
echo "Your code is ready to push! 🚀"
echo ""
echo "Available commands:"
echo "  pnpm run ci:local        - Run full CI pipeline"
echo "  pnpm run ci:quality      - Run only quality checks"
echo "  pnpm run ci:security     - Run only security checks"
echo "  ./scripts/ci-local.sh    - Run this script directly"
echo ""
