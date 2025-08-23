# End-to-End Tests for Open Pub Quiz

This directory contains comprehensive end-to-end tests for the Open Pub Quiz application using Playwright.

## Prerequisites

- Node.js 20+ 
- Docker and Docker Compose
- The application should be running via `docker-compose up -d`

## Setup

1. Install dependencies:
```bash
cd e2e
npm install
```

2. Install Playwright browsers:
```bash
npm run install-browsers
```

## Running Tests

### Local Development

#### Option 1: Using the provided scripts (Recommended)

**Windows (PowerShell):**
```powershell
# Run all tests
.\scripts\run-e2e-tests.ps1

# Run tests in headed mode (see browser)
.\scripts\run-e2e-tests.ps1 -TestMode headed

# Run tests with UI mode (interactive)
.\scripts\run-e2e-tests.ps1 -TestMode ui

# Run tests in debug mode
.\scripts\run-e2e-tests.ps1 -TestMode debug
```

**Linux/macOS (Bash):**
```bash
# Make script executable first
chmod +x scripts/run-e2e-tests.sh

# Run all tests
./scripts/run-e2e-tests.sh

# Run tests in headed mode (see browser)
./scripts/run-e2e-tests.sh headed

# Run tests with UI mode (interactive)
./scripts/run-e2e-tests.sh ui

# Run tests in debug mode
./scripts/run-e2e-tests.sh debug
```

#### Option 2: Manual setup

1. Start the application:
```bash
# From the root directory
docker-compose up -d
```

2. Run tests locally:
```bash
# Run all tests
npm run test:local

# Run tests with UI mode (interactive)
npm run test:ui

# Run tests in headed mode (see browser)
npm run test:headed

# Run tests in debug mode
npm run test:debug
```
