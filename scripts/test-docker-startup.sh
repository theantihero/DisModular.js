#!/bin/bash

/**
 * Docker Compose Startup Test Script
 * Tests the complete Docker Compose startup process with database migrations
 * @author fkndean_
 * @date 2025-01-27
 */

set -e

echo "🚀 Starting DisModular.js Docker Compose Test"
echo "=============================================="

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

# Check if Docker and Docker Compose are installed
print_status "Checking Docker installation..."
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed or not in PATH"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed or not in PATH"
    exit 1
fi

print_success "Docker and Docker Compose are available"

# Check if .env file exists
print_status "Checking environment configuration..."
if [ ! -f .env ]; then
    print_warning ".env file not found, creating from .env.example"
    if [ -f .env.example ]; then
        cp .env.example .env
        print_success "Created .env file from .env.example"
    else
        print_error ".env.example file not found"
        exit 1
    fi
else
    print_success ".env file exists"
fi

# Clean up any existing containers
print_status "Cleaning up existing containers..."
docker-compose down -v --remove-orphans 2>/dev/null || true
print_success "Cleanup completed"

# Build the application
print_status "Building Docker images..."
docker-compose build --no-cache
print_success "Docker images built successfully"

# Start the services
print_status "Starting services..."
docker-compose up -d postgres
print_success "PostgreSQL started"

# Wait for PostgreSQL to be ready
print_status "Waiting for PostgreSQL to be ready..."
timeout=60
counter=0
while ! docker-compose exec -T postgres pg_isready -U dismodular -d dismodular 2>/dev/null; do
    if [ $counter -eq $timeout ]; then
        print_error "PostgreSQL failed to start within $timeout seconds"
        docker-compose logs postgres
        exit 1
    fi
    sleep 2
    counter=$((counter + 2))
    echo -n "."
done
echo ""
print_success "PostgreSQL is ready"

# Start the application
print_status "Starting application..."
docker-compose up -d app
print_success "Application started"

# Wait for application to be ready
print_status "Waiting for application to be ready..."
timeout=120
counter=0
while ! curl -f http://localhost:3002/health 2>/dev/null; do
    if [ $counter -eq $timeout ]; then
        print_error "Application failed to start within $timeout seconds"
        docker-compose logs app
        exit 1
    fi
    sleep 5
    counter=$((counter + 5))
    echo -n "."
done
echo ""
print_success "Application is ready"

# Test database connection
print_status "Testing database connection..."
if docker-compose exec -T app node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.\$queryRaw\`SELECT 1\`.then(() => {
  console.log('Database connection successful');
  process.exit(0);
}).catch((error) => {
  console.error('Database connection failed:', error);
  process.exit(1);
});
"; then
    print_success "Database connection test passed"
else
    print_error "Database connection test failed"
    docker-compose logs app
    exit 1
fi

# Test API endpoints
print_status "Testing API endpoints..."
if curl -f http://localhost:3002/api/auth/me 2>/dev/null; then
    print_success "API endpoints are responding"
else
    print_warning "API endpoints test failed (expected for unauthenticated request)"
fi

# Check migration status
print_status "Checking migration status..."
if docker-compose exec -T app npx prisma migrate status 2>/dev/null; then
    print_success "Migration status check completed"
else
    print_warning "Migration status check failed"
fi

# Display container status
print_status "Container status:"
docker-compose ps

# Display logs
print_status "Recent application logs:"
docker-compose logs --tail=20 app

print_success "Docker Compose startup test completed successfully!"
print_status "Application is running at: http://localhost:3002"
print_status "Health check: http://localhost:3002/health"
print_status "API endpoints: http://localhost:3002/api"

echo ""
echo "To stop the services, run: docker-compose down"
echo "To view logs, run: docker-compose logs -f"
echo "To restart, run: docker-compose restart"
