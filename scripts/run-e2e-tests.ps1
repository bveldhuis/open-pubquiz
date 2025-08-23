# E2E Test Runner Script for Open Pub Quiz (Windows)
# This script sets up the environment and runs end-to-end tests

param(
    [string]$TestMode = "local"
)

# Function to print colored output
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Function to check if Docker is running
function Test-Docker {
    try {
        docker info | Out-Null
        Write-Success "Docker is running"
        return $true
    }
    catch {
        Write-Error "Docker is not running. Please start Docker Desktop and try again."
        return $false
    }
}

# Function to check if required ports are available
function Test-Ports {
    $ports = @(3000, 4200, 3306)
    
    foreach ($port in $ports) {
        $connection = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
        if ($connection) {
            Write-Warning "Port $port is already in use. This might cause conflicts."
        }
    }
}

# Function to start the application
function Start-Application {
    Write-Status "Starting application with Docker Compose..."
    
    # Stop any existing containers
    docker-compose down 2>$null
    
    # Start the application with E2E configuration
    docker-compose -f docker-compose.yml -f docker-compose.e2e.yml up -d
    
    # Wait for the application to be ready
    Write-Status "Waiting for application to be ready..."
    $maxAttempts = 30
    $attempt = 1
    
    while ($attempt -le $maxAttempts) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:4200" -UseBasicParsing -TimeoutSec 5
            if ($response.StatusCode -eq 200) {
                Write-Success "Application is ready!"
                break
            }
        }
        catch {
            # Continue waiting
        }
        
        Write-Status "Attempt $attempt/$maxAttempts : Application not ready yet, waiting..."
        Start-Sleep -Seconds 5
        $attempt++
    }
    
    if ($attempt -gt $maxAttempts) {
        Write-Error "Application failed to start within the expected time"
        exit 1
    }
}

# Function to install E2E dependencies
function Install-E2EDependencies {
    Write-Status "Installing E2E dependencies..."
    
    if (-not (Test-Path "e2e")) {
        Write-Error "E2E directory not found. Please run this script from the project root."
        exit 1
    }
    
    Set-Location e2e
    
    # Install npm dependencies
    if (-not (Test-Path "node_modules")) {
        npm install
    }
    
    # Install Playwright browsers
    npx playwright install --with-deps
    
    Set-Location ..
}

# Function to run E2E tests
function Invoke-E2ETests {
    param([string]$Mode)
    
    Write-Status "Running E2E tests..."
    
    Set-Location e2e
    
    # Run tests based on arguments
    switch ($Mode) {
        "local" { npm run test:local }
        "headed" { npm run test:headed }
        "ui" { npm run test:ui }
        "debug" { npm run test:debug }
        "ci" { npm run test:ci }
        default {
            Write-Error "Invalid test mode: $Mode"
            Write-Status "Available modes: local, headed, ui, debug, ci"
            exit 1
        }
    }
    
    Set-Location ..
}

# Function to show test results
function Show-Results {
    Write-Status "Test execution completed!"
    
    if (Test-Path "e2e/playwright-report") {
        Write-Success "HTML report generated at: e2e/playwright-report/index.html"
        Write-Status "You can view the report by opening the HTML file in your browser"
    }
    
    if (Test-Path "e2e/test-results") {
        Write-Status "Test artifacts available in: e2e/test-results/"
    }
}

# Function to cleanup
function Invoke-Cleanup {
    Write-Status "Cleaning up..."
    
    # Stop Docker containers
    docker-compose down 2>$null
    
    Write-Success "Cleanup completed"
}

# Main execution
function Main {
    param([string]$Mode)
    
    Write-Status "Starting E2E test runner..."
    
    # Check prerequisites
    if (-not (Test-Docker)) {
        exit 1
    }
    Test-Ports
    
    # Install dependencies
    Install-E2EDependencies
    
    # Start application
    Start-Application
    
    # Run tests
    Invoke-E2ETests -Mode $Mode
    
    # Show results
    Show-Results
    
    # Ask if user wants to keep the application running
    Write-Host ""
    $keepRunning = Read-Host "Do you want to keep the application running? (y/N)"
    
    if ($keepRunning -notmatch "^[Yy]$") {
        Invoke-Cleanup
    }
    else {
        Write-Status "Application is still running. Use 'docker-compose down' to stop it."
    }
    
    Write-Success "E2E test runner completed!"
}

# Handle script interruption
try {
    # Run main function
    Main -Mode $TestMode
}
catch {
    Write-Error "An error occurred: $($_.Exception.Message)"
    Invoke-Cleanup
    exit 1
}
