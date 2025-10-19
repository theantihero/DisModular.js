# Docker Compose Setup Guide

This guide ensures that DisModular.js runs correctly with Docker Compose, including proper database migrations and startup procedures.

## Prerequisites

- Docker Desktop (Windows/Mac) or Docker Engine (Linux)
- Docker Compose v2.0+
- Git

## Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd DisModular.js
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your Discord bot credentials
   ```

3. **Start the application**
   ```bash
   docker-compose up -d
   ```

4. **Test the setup**
   ```bash
   # Windows
   scripts\test-docker-startup.bat
   
   # Linux/Mac
   ./scripts/test-docker-startup.sh
   ```

## Environment Configuration

### Required Environment Variables

```env
# Discord Bot Configuration
DISCORD_BOT_TOKEN=your_bot_token_here
DISCORD_CLIENT_ID=your_client_id_here
DISCORD_CLIENT_SECRET=your_client_secret_here

# Database Configuration
POSTGRES_DB=dismodular
POSTGRES_USER=dismodular
POSTGRES_PASSWORD=your_secure_password

# Application Configuration
API_PORT=3002
API_URL=https://your-domain.com
SESSION_SECRET=your_random_session_secret

# Initial Admin (optional)
INITIAL_ADMIN_DISCORD_ID=your_discord_id_here
```

### Optional Environment Variables

```env
# Discord Features
ENABLE_MESSAGE_CONTENT=false
ENABLE_GUILD_MEMBERS=false

# Development
NODE_ENV=production
VITE_API_URL=https://your-domain.com/api
VITE_DISCORD_OAUTH_CALLBACK=https://your-domain.com/api/auth/discord/callback
```

## Docker Compose Services

### PostgreSQL Database
- **Image**: `postgres:16-alpine`
- **Port**: `5432` (internal)
- **Health Check**: `pg_isready`
- **Volume**: `postgres_data` (persistent storage)

### Application
- **Build**: Multi-stage Dockerfile
- **Port**: `3002` (exposed)
- **Health Check**: HTTP `/health` endpoint
- **Dependencies**: PostgreSQL (waits for health check)

## Startup Process

The application follows this startup sequence:

1. **PostgreSQL starts** and becomes healthy
2. **Application container starts** and runs `docker-startup.js`
3. **Database initialization** (`docker-init.js`):
   - Wait for database connection
   - Run Prisma migrations (`prisma migrate deploy`)
   - Generate Prisma client
   - Seed initial data (if needed)
4. **Application services start**:
   - API server (`npm run start:api`)
   - Discord bot (`npm run start:bot`)

## Database Migrations

### Automatic Migration
Migrations run automatically during container startup using:
```bash
npx prisma migrate deploy
```

### Manual Migration
To run migrations manually:
```bash
docker-compose exec app npx prisma migrate deploy
```

### Migration Status
Check migration status:
```bash
docker-compose exec app npx prisma migrate status
```

## Health Checks

### Application Health
- **Endpoint**: `http://localhost:3002/health`
- **Response**: `{"success": true, "status": "healthy", "uptime": <seconds>}`

### Database Health
- **Check**: `docker-compose exec postgres pg_isready -U dismodular -d dismodular`
- **Status**: `accepting connections`

## Troubleshooting

### Common Issues

#### 1. Database Connection Failed
```bash
# Check PostgreSQL logs
docker-compose logs postgres

# Check if PostgreSQL is running
docker-compose ps postgres

# Restart PostgreSQL
docker-compose restart postgres
```

#### 2. Migration Failed
```bash
# Check application logs
docker-compose logs app

# Reset and migrate
docker-compose exec app npx prisma migrate reset --force

# Or restart the application
docker-compose restart app
```

#### 3. Application Won't Start
```bash
# Check all logs
docker-compose logs

# Rebuild containers
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

#### 4. Port Already in Use
```bash
# Check what's using port 3002
netstat -tulpn | grep 3002

# Kill existing processes
scripts/kill-ports.js
```

### Debug Mode

Run in debug mode with logs:
```bash
docker-compose up
```

View real-time logs:
```bash
docker-compose logs -f app
```

## Production Deployment

### Security Considerations

1. **Change default passwords**
2. **Use strong session secrets**
3. **Enable HTTPS/TLS**
4. **Configure firewall rules**
5. **Regular security updates**

### Performance Optimization

1. **Resource limits**:
   ```yaml
   deploy:
     resources:
       limits:
         memory: 1G
         cpus: '0.5'
   ```

2. **Database optimization**:
   - Configure PostgreSQL settings
   - Monitor query performance
   - Regular backups

3. **Caching**:
   - Redis for session storage
   - CDN for static assets

### Monitoring

1. **Health checks**: Built-in health endpoints
2. **Logging**: Structured logging with timestamps
3. **Metrics**: Application performance monitoring
4. **Alerts**: Set up monitoring for critical failures

## Backup and Recovery

### Database Backup
```bash
# Create backup
docker-compose exec postgres pg_dump -U dismodular dismodular > backup.sql

# Restore backup
docker-compose exec -T postgres psql -U dismodular dismodular < backup.sql
```

### Volume Backup
```bash
# Backup volumes
docker run --rm -v dismodular_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup.tar.gz /data
```

## Development

### Local Development with Docker
```bash
# Start only database
docker-compose up -d postgres

# Run application locally
npm run dev
```

### Testing
```bash
# Run tests in container
docker-compose exec app npm test

# Integration tests
docker-compose exec app npm run test:integration
```

## Support

For issues with Docker setup:
1. Check the logs: `docker-compose logs`
2. Run the test script: `scripts/test-docker-startup.bat` (Windows) or `./scripts/test-docker-startup.sh` (Linux/Mac)
3. Verify environment variables
4. Check Docker and Docker Compose versions

## Additional Resources

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Prisma Migration Guide](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [PostgreSQL Docker Image](https://hub.docker.com/_/postgres)
- [Node.js Docker Best Practices](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
