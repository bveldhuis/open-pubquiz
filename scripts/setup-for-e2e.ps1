# Setup script for E2E testing
# This script sets up the database and starts the application properly

param(
    [switch]$SkipMigrations = $false
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

# Function to run database migrations
function Invoke-Migrations {
    Write-Status "Setting up database migrations..."
    
    # Start MySQL first
    docker-compose up -d mysql
    
    # Wait for MySQL to be ready
    Write-Status "Waiting for MySQL to be ready..."
    $maxAttempts = 30
    $attempt = 1
    
    while ($attempt -le $maxAttempts) {
        try {
            # Use telnet or netcat to check if port 3306 is open
            $tcpClient = New-Object System.Net.Sockets.TcpClient
            $tcpClient.ConnectAsync("localhost", 3306).Wait(5000) | Out-Null
            if ($tcpClient.Connected) {
                $tcpClient.Close()
                Write-Success "MySQL is ready!"
                break
            }
        }
        catch {
            # Continue waiting
        }
        
        Write-Status "Attempt $attempt/$maxAttempts : MySQL not ready yet, waiting..."
        Start-Sleep -Seconds 2
        $attempt++
    }
    
    if ($attempt -gt $maxAttempts) {
        Write-Error "MySQL failed to start within the expected time"
        exit 1
    }
    
    # Run migrations using a temporary container with source files
    Write-Status "Running database migrations..."
    
    # Create a temporary container to run migrations
    docker run --rm `
        --network open-pubquiz_pubquiz-network `
        -v "${PWD}/backend:/app" `
        -w /app `
        -e DB_HOST=mysql `
        -e DB_PORT=3306 `
        -e DB_USERNAME=pubquiz_user `
        -e DB_PASSWORD=pubquiz_password `
        -e DB_DATABASE=pubquiz `
        node:22-alpine `
        sh -c "npm install && npm run migration:run"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Database migrations completed successfully!"
    } else {
        Write-Error "Database migrations failed!"
        exit 1
    }
}

# Function to start the application
function Start-Application {
    Write-Status "Starting the application..."
    
    # Start all services
    docker-compose up -d
    
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

# Main execution
function Main {
    Write-Status "Setting up environment for E2E testing..."
    
    # Check prerequisites
    if (-not (Test-Docker)) {
        exit 1
    }
    
    # Stop any existing containers
    docker-compose down 2>$null
    
    # Run migrations if not skipped
    if (-not $SkipMigrations) {
        Invoke-Migrations
    }
    
    # Start the application
    Start-Application
    
    Write-Success "Environment setup completed! Application is ready for E2E testing."
    Write-Status "Frontend: http://localhost:4200"
    Write-Status "Backend: http://localhost:3000"
    Write-Status "Health Check: http://localhost:3000/health"
}

# Handle script interruption
try {
    # Run main function
    Main
}
catch {
    Write-Error "An error occurred: $($_.Exception.Message)"
    exit 1
}
