@echo off
REM Docker Compose Startup Test Script for Windows
REM Tests the complete Docker Compose startup process with database migrations
REM @author fkndean_
REM @date 2025-01-27

echo 🚀 Starting DisModular.js Docker Compose Test
echo ==============================================

REM Check if Docker and Docker Compose are installed
echo [INFO] Checking Docker installation...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not installed or not in PATH
    exit /b 1
)

docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker Compose is not installed or not in PATH
    exit /b 1
)

echo [SUCCESS] Docker and Docker Compose are available

REM Check if .env file exists
echo [INFO] Checking environment configuration...
if not exist .env (
    echo [WARNING] .env file not found, creating from .env.example
    if exist .env.example (
        copy .env.example .env >nul
        echo [SUCCESS] Created .env file from .env.example
    ) else (
        echo [ERROR] .env.example file not found
        exit /b 1
    )
) else (
    echo [SUCCESS] .env file exists
)

REM Clean up any existing containers
echo [INFO] Cleaning up existing containers...
docker-compose down -v --remove-orphans >nul 2>&1
echo [SUCCESS] Cleanup completed

REM Build the application
echo [INFO] Building Docker images...
docker-compose build --no-cache
if %errorlevel% neq 0 (
    echo [ERROR] Docker build failed
    exit /b 1
)
echo [SUCCESS] Docker images built successfully

REM Start the services
echo [INFO] Starting services...
docker-compose up -d postgres
if %errorlevel% neq 0 (
    echo [ERROR] Failed to start PostgreSQL
    exit /b 1
)
echo [SUCCESS] PostgreSQL started

REM Wait for PostgreSQL to be ready
echo [INFO] Waiting for PostgreSQL to be ready...
set timeout=60
set counter=0
:wait_postgres
docker-compose exec -T postgres pg_isready -U dismodular -d dismodular >nul 2>&1
if %errorlevel% equ 0 goto postgres_ready
if %counter% geq %timeout% (
    echo [ERROR] PostgreSQL failed to start within %timeout% seconds
    docker-compose logs postgres
    exit /b 1
)
timeout /t 2 /nobreak >nul
set /a counter+=2
echo|set /p="."
goto wait_postgres
:postgres_ready
echo.
echo [SUCCESS] PostgreSQL is ready

REM Start the application
echo [INFO] Starting application...
docker-compose up -d app
if %errorlevel% neq 0 (
    echo [ERROR] Failed to start application
    exit /b 1
)
echo [SUCCESS] Application started

REM Wait for application to be ready
echo [INFO] Waiting for application to be ready...
set timeout=120
set counter=0
:wait_app
curl -f http://localhost:3002/health >nul 2>&1
if %errorlevel% equ 0 goto app_ready
if %counter% geq %timeout% (
    echo [ERROR] Application failed to start within %timeout% seconds
    docker-compose logs app
    exit /b 1
)
timeout /t 5 /nobreak >nul
set /a counter+=5
echo|set /p="."
goto wait_app
:app_ready
echo.
echo [SUCCESS] Application is ready

REM Test database connection
echo [INFO] Testing database connection...
docker-compose exec -T app node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.$queryRaw`SELECT 1`.then(() => { console.log('Database connection successful'); process.exit(0); }).catch((error) => { console.error('Database connection failed:', error); process.exit(1); });" >nul 2>&1
if %errorlevel% equ 0 (
    echo [SUCCESS] Database connection test passed
) else (
    echo [ERROR] Database connection test failed
    docker-compose logs app
    exit /b 1
)

REM Test API endpoints
echo [INFO] Testing API endpoints...
curl -f http://localhost:3002/api/auth/me >nul 2>&1
if %errorlevel% equ 0 (
    echo [SUCCESS] API endpoints are responding
) else (
    echo [WARNING] API endpoints test failed (expected for unauthenticated request)
)

REM Check migration status
echo [INFO] Checking migration status...
docker-compose exec -T app npx prisma migrate status >nul 2>&1
if %errorlevel% equ 0 (
    echo [SUCCESS] Migration status check completed
) else (
    echo [WARNING] Migration status check failed
)

REM Display container status
echo [INFO] Container status:
docker-compose ps

REM Display logs
echo [INFO] Recent application logs:
docker-compose logs --tail=20 app

echo [SUCCESS] Docker Compose startup test completed successfully!
echo [INFO] Application is running at: http://localhost:3002
echo [INFO] Health check: http://localhost:3002/health
echo [INFO] API endpoints: http://localhost:3002/api

echo.
echo To stop the services, run: docker-compose down
echo To view logs, run: docker-compose logs -f
echo To restart, run: docker-compose restart

pause
