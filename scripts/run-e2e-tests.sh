#!/bin/bash

# E2E Test Runner Script for Open Pub Quiz
# This script sets up the environment and runs end-to-end tests

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
    print_success "Docker is running"
}

# Function to check if required ports are available
check_ports() {
    local ports=("3000" "4200" "3306")
    
    for port in "${ports[@]}"; do
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            print_warning "Port $port is already in use. This might cause conflicts."
        fi
    done
}

# Function to start the application
start_application() {
    print_status "Starting application with Docker Compose..."
    
    # Stop any existing containers
    docker-compose down > /dev/null 2>&1 || true
    
    # Start the application
    docker-compose up -d
    
    # Wait for the application to be ready
    print_status "Waiting for application to be ready..."
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f http://localhost:4200 > /dev/null 2>&1; then
            print_success "Application is ready!"
            break
        fi
        
        print_status "Attempt $attempt/$max_attempts: Application not ready yet, waiting..."
        sleep 5
        attempt=$((attempt + 1))
    done
    
    if [ $attempt -gt $max_attempts ]; then
        print_error "Application failed to start within the expected time"
        exit 1
    fi
}

# Function to install E2E dependencies
install_e2e_deps() {
    print_status "Installing E2E dependencies..."
    
    if [ ! -d "e2e" ]; then
        print_error "E2E directory not found. Please run this script from the project root."
        exit 1
    fi
    
    cd e2e
    
    # Install npm dependencies
    if [ ! -d "node_modules" ]; then
        npm install
    fi
    
    # Install Playwright browsers
    npx playwright install --with-deps
    
    cd ..
}

# Function to run E2E tests
run_e2e_tests() {
    print_status "Running E2E tests..."
    
    cd e2e
    
    # Run tests based on arguments
    case "${1:-local}" in
        "local")
            npm run test:local
            ;;
        "headed")
            npm run test:headed
            ;;
        "ui")
            npm run test:ui
            ;;
        "debug")
            npm run test:debug
            ;;
        "ci")
            npm run test:ci
            ;;
        *)
            print_error "Invalid test mode: $1"
            print_status "Available modes: local, headed, ui, debug, ci"
            exit 1
            ;;
    esac
    
    cd ..
}

# Function to show test results
show_results() {
    print_status "Test execution completed!"
    
    if [ -d "e2e/playwright-report" ]; then
        print_success "HTML report generated at: e2e/playwright-report/index.html"
        print_status "You can view the report by opening the HTML file in your browser"
    fi
    
    if [ -d "e2e/test-results" ]; then
        print_status "Test artifacts available in: e2e/test-results/"
    fi
}

# Function to cleanup
cleanup() {
    print_status "Cleaning up..."
    
    # Stop Docker containers
    docker-compose down > /dev/null 2>&1 || true
    
    print_success "Cleanup completed"
}

# Main execution
main() {
    print_status "Starting E2E test runner..."
    
    # Parse command line arguments
    TEST_MODE="${1:-local}"
    
    # Check prerequisites
    check_docker
    check_ports
    
    # Install dependencies
    install_e2e_deps
    
    # Start application
    start_application
    
    # Run tests
    run_e2e_tests "$TEST_MODE"
    
    # Show results
    show_results
    
    # Ask if user wants to keep the application running
    echo
    read -p "Do you want to keep the application running? (y/N): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        cleanup
    else
        print_status "Application is still running. Use 'docker-compose down' to stop it."
    fi
    
    print_success "E2E test runner completed!"
}

# Handle script interruption
trap cleanup EXIT

# Run main function
main "$@"
