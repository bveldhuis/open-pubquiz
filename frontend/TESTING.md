# Frontend Testing Guide

This document provides information about running tests for the Open Pub Quiz frontend application.

## Available Test Scripts

### Development Testing
```bash
# Run tests in watch mode (for development)
npm test

# Run tests with specific browser
npm test -- --browsers=Chrome
```

### CI/Production Testing
```bash
# Run tests once with headless Chrome (CI-friendly)
npm run test:ci

# Alternative headless test command
npm run test:headless
```

## Browser Configuration

The project uses Karma with Chrome for testing. For CI environments like GitHub Actions, Docker, or other containerized environments, we use a special `ChromeHeadlessNoSandbox` configuration that disables Chrome's sandbox.

### Chrome Flags Used for CI

- `--no-sandbox`: Disables Chrome's sandbox (required for most CI environments)
- `--disable-setuid-sandbox`: Additional sandbox disabling
- `--disable-dev-shm-usage`: Prevents shared memory issues in containers
- `--disable-extensions`: Disables Chrome extensions
- `--disable-gpu`: Disables GPU acceleration
- `--disable-web-security`: Disables web security for testing
- `--disable-features=VizDisplayCompositor`: Disables compositor features
- `--headless`: Runs Chrome in headless mode
- `--remote-debugging-port=9222`: Enables remote debugging

## Troubleshooting

### Chrome Sandbox Issues

If you encounter sandbox errors like:
```
No usable sandbox! If you are running on Ubuntu 23.10+ or another Linux distro that has disabled unprivileged user namespaces...
```

Use the CI test script:
```bash
npm run test:ci
```

### Container/Docker Testing

For Docker or containerized environments, always use the CI configuration:
```bash
npm run test:ci
```

### GitHub Actions

The project includes a GitHub Actions workflow (`.github/workflows/ci.yml`) that automatically runs tests with the correct configuration.

## Test Coverage

The test suite includes:

- **Component Tests**: 214 total tests covering all Angular components
- **Service Tests**: Unit tests for all Angular services
- **Integration Tests**: Tests for component interactions
- **Mock Tests**: Tests with mocked dependencies

### Current Test Status
✅ All 214 tests passing  
✅ Chrome headless support  
✅ CI/CD ready  
✅ Cross-platform compatible  

## Running Specific Tests

```bash
# Run tests for a specific component
npm test -- --include="**/home.component.spec.ts"

# Run tests matching a pattern
npm test -- --grep="should create"

# Run tests with coverage
npm test -- --code-coverage
```

## Environment Variables

- `CI=true`: Automatically detected in most CI environments
- `CHROME_BIN`: Set automatically by karma.conf.js using Puppeteer

## Dependencies

The testing setup requires:
- `@angular/core` and Angular testing utilities
- `karma` and `jasmine` for test framework
- `puppeteer` for Chrome binary
- `karma-chrome-launcher` for Chrome integration

All dependencies are automatically installed with `npm install`.