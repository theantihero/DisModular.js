# DisModular.js Docker Setup

This document describes the Docker setup for DisModular.js with optimal layer caching and PostgreSQL integration.

## Architecture

The application uses a multi-stage Docker build with the following stages:

1. **Base Dependencies**: Installs production dependencies for API and Bot packages
2. **Prisma Generation**: Generates Prisma client from schema
3. **Dashboard Build**: Builds the React dashboard for production
4. **Production**: Final image with all components

## Layer Caching Strategy

The Dockerfile is optimized for layer caching:

- Package.json files are copied first to maximize dependency cache hits
- Prisma schema is cached separately for client generation
- Dashboard build artifacts are cached independently
- Source code is copied last to minimize cache invalidation

## Database Migration

The application has been migrated from SQLite to PostgreSQL with Prisma ORM:

- **Before**: SQLite with `better-sqlite3`
- **After**: PostgreSQL with Prisma Client
- **Schema**: All existing tables preserved with proper relationships
- **Migration**: Automatic via Prisma migrations

## Quick Start

### Development with Docker Compose

1. Copy environment variables:
   ```bash
   cp env.example .env
   ```

2. Update `.env` with your Discord bot credentials and database settings

3. Start the services:
   ```bash
   docker-compose up -d
   ```

4. Run database migrations:
   ```bash
   docker-compose exec app npx prisma migrate dev
   ```

5. Access the application:
   - Dashboard: http://localhost:3002
   - API: http://localhost:3002/api
   - Database: localhost:5432

### Production Build

1. Build the Docker image:
   ```bash
   docker build -t dismodular .
   ```

2. Run with environment variables:
   ```bash
   docker run -d \
     -p 3002:3002 \
     -e DATABASE_URL="postgresql://user:pass@host:5432/db" \
     -e DISCORD_BOT_TOKEN="your_token" \
     -e DISCORD_CLIENT_ID="your_client_id" \
     -e DISCORD_CLIENT_SECRET="your_secret" \
     -e SESSION_SECRET="your_session_secret" \
     dismodular
   ```

## Environment Variables

### Required Variables

- `DATABASE_URL`: PostgreSQL connection string
- `DISCORD_BOT_TOKEN`: Discord bot token
- `DISCORD_CLIENT_ID`: Discord application client ID
- `DISCORD_CLIENT_SECRET`: Discord application client secret
- `SESSION_SECRET`: Random string for session encryption

### Optional Variables

- `API_PORT`: API server port (default: 3002)
- `INITIAL_ADMIN_DISCORD_ID`: Discord ID of initial admin user
- `ENABLE_MESSAGE_CONTENT`: Enable message content intent
- `ENABLE_GUILD_MEMBERS`: Enable guild members intent

## Features

### Bot Invite Button

The dashboard now includes a "Invite Bot to Server" button that generates Discord OAuth2 URLs with appropriate permissions:

- Send Messages
- Embed Links
- Use Slash Commands
- Manage Messages
- Manage Channels
- Manage Roles
- And more...

### Static File Serving

The Express API now serves the built React dashboard as static files, eliminating the need for a separate web server in production.

### Health Checks

Both Docker services include health checks:

- **PostgreSQL**: `pg_isready` check
- **Application**: HTTP health endpoint check

## Database Schema

The Prisma schema includes the following models:

- `User`: Discord user authentication and admin status
- `Plugin`: Plugin definitions with nodes, edges, and compiled code
- `PluginState`: Runtime state storage for plugins
- `BotConfig`: Bot configuration key-value pairs
- `AuditLog`: Audit trail for admin actions

## Troubleshooting

### Database Connection Issues

1. Ensure PostgreSQL is running and accessible
2. Check `DATABASE_URL` format: `postgresql://user:password@host:port/database`
3. Verify database exists and user has proper permissions

### Bot Invite Issues

1. Ensure `DISCORD_CLIENT_ID` is set correctly
2. Check that the Discord application has proper OAuth2 settings
3. Verify bot permissions in Discord Developer Portal

### Build Issues

1. Clear Docker cache: `docker system prune -a`
2. Rebuild without cache: `docker build --no-cache -t dismodular .`
3. Check for missing environment variables

## Performance Optimizations

- Multi-stage build reduces final image size
- Layer caching speeds up rebuilds
- Prisma connection pooling for database efficiency
- Static file serving eliminates additional web server overhead
- Health checks ensure service reliability
