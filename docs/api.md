# API Documentation

The DisModular.js API provides a RESTful interface for managing plugins, bot configuration, and user authentication.

## Base URL

```
http://localhost:3002/api
```

## Authentication

All API endpoints require authentication via Discord OAuth. Include the session cookie in your requests.

### Authentication Endpoints

#### `GET /api/auth/discord`
Start Discord OAuth flow.

**Response:**
```json
{
  "redirectUrl": "https://discord.com/oauth2/authorize?..."
}
```

#### `GET /api/auth/discord/callback`
OAuth callback handler.

**Query Parameters:**
- `code` - Authorization code from Discord
- `state` - State parameter for security

#### `GET /api/auth/me`
Get current user information.

**Response:**
```json
{
  "id": "123456789012345678",
  "username": "username",
  "discriminator": "0001",
  "avatar": "avatar_hash",
  "isAdmin": true
}
```

#### `POST /api/auth/logout`
Logout current user.

**Response:**
```json
{
  "success": true
}
```

## Plugin Management

### `GET /api/plugins`
Get all plugins.

**Response:**
```json
[
  {
    "id": "plugin-id",
    "name": "Plugin Name",
    "description": "Plugin description",
    "version": "1.0.0",
    "author": "Author Name",
    "enabled": true,
    "type": "slash",
    "command": "command-name",
    "createdAt": "2025-10-15T00:00:00.000Z",
    "updatedAt": "2025-10-15T00:00:00.000Z"
  }
]
```

### `GET /api/plugins/:id`
Get plugin by ID.

**Parameters:**
- `id` - Plugin ID

**Response:**
```json
{
  "id": "plugin-id",
  "name": "Plugin Name",
  "description": "Plugin description",
  "version": "1.0.0",
  "author": "Author Name",
  "enabled": true,
  "type": "slash",
  "command": "command-name",
  "nodes": [...],
  "edges": [...],
  "compiled": "// Generated code",
  "createdAt": "2025-10-15T00:00:00.000Z",
  "updatedAt": "2025-10-15T00:00:00.000Z"
}
```

### `POST /api/plugins`
Create new plugin.

**Request Body:**
```json
{
  "name": "Plugin Name",
  "description": "Plugin description",
  "type": "slash",
  "command": "command-name",
  "nodes": [...],
  "edges": [...]
}
```

**Response:**
```json
{
  "id": "generated-plugin-id",
  "success": true
}
```

### `PUT /api/plugins/:id`
Update existing plugin.

**Parameters:**
- `id` - Plugin ID

**Request Body:**
```json
{
  "name": "Updated Plugin Name",
  "description": "Updated description",
  "nodes": [...],
  "edges": [...]
}
```

### `DELETE /api/plugins/:id`
Delete plugin.

**Parameters:**
- `id` - Plugin ID

**Response:**
```json
{
  "success": true
}
```

### `POST /api/plugins/compile`
Compile node graph to executable code.

**Request Body:**
```json
{
  "nodes": [...],
  "edges": [...]
}
```

**Response:**
```json
{
  "compiled": "// Generated JavaScript code",
  "success": true
}
```

## Bot Management

### `GET /api/bot/status`
Get bot status and statistics.

**Response:**
```json
{
  "online": true,
  "uptime": 3600000,
  "guilds": 5,
  "users": 150,
  "commands": 25,
  "memoryUsage": {
    "rss": 50000000,
    "heapTotal": 20000000,
    "heapUsed": 15000000
  }
}
```

### `GET /api/bot/config`
Get bot configuration.

**Response:**
```json
{
  "prefix": "!",
  "cooldown": 3000,
  "maxPlugins": 100,
  "logging": {
    "level": "info",
    "file": "bot.log"
  }
}
```

### `PUT /api/bot/config`
Update bot configuration.

**Request Body:**
```json
{
  "prefix": "!",
  "cooldown": 5000,
  "maxPlugins": 150
}
```

### `GET /api/bot/audit`
Get audit logs.

**Query Parameters:**
- `limit` - Number of logs to return (default: 50)
- `offset` - Number of logs to skip (default: 0)

**Response:**
```json
[
  {
    "id": "log-id",
    "action": "plugin_created",
    "user": "username",
    "details": "Created plugin 'Hello World'",
    "timestamp": "2025-10-15T00:00:00.000Z"
  }
]
```

## Error Responses

All endpoints may return error responses in the following format:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": "Additional error details"
}
```

### Common Error Codes

- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `VALIDATION_ERROR` - Invalid request data
- `INTERNAL_ERROR` - Server error

## Rate Limiting

API requests are rate limited to prevent abuse:

- **Authentication endpoints**: 10 requests per minute
- **Plugin management**: 100 requests per minute
- **Bot management**: 50 requests per minute

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```
