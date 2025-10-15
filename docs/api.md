# API Documentation

The DisModular.js API provides a comprehensive RESTful interface for managing plugins, bot configuration, user authentication, and real-time monitoring. Built with Express.js and following REST principles, it offers a clean, intuitive API for both web dashboard and external integrations.

## Table of Contents

- [Base URL & Configuration](#base-url)
- [Authentication](#authentication)
- [Plugin Management](#plugin-management)
- [Bot Management](#bot-management)
- [Error Handling](#error-responses)
- [Rate Limiting](#rate-limiting)
- [WebSocket Events](#websocket-events)
- [SDK Examples](#sdk-examples)
- [Testing](#testing)

## Base URL

```
http://localhost:3002/api
```

### Environment Configuration

The API server can be configured via environment variables:

```env
API_PORT=3002
API_URL=http://localhost:3002
SESSION_SECRET=your_random_session_secret_here
CORS_ORIGIN=http://localhost:5173
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Authentication

The API uses Discord OAuth 2.0 for authentication with session-based management. All endpoints (except auth endpoints) require a valid session cookie.

### Authentication Flow

1. **Initiate OAuth**: Client redirects to `/api/auth/discord`
2. **Discord Authorization**: User authorizes the application on Discord
3. **Callback Processing**: Discord redirects to `/api/auth/discord/callback`
4. **Session Creation**: Server creates authenticated session
5. **Dashboard Access**: User is redirected to dashboard with session

### Authentication Endpoints

#### `GET /api/auth/discord`
Start Discord OAuth flow.

**Description:** Initiates the Discord OAuth 2.0 flow using Passport.js. Redirects the user to Discord's authorization server.

**Response:**
- **Success**: Redirects to Discord OAuth authorization page
- **Error**: Returns error response

**Example Usage:**
```javascript
// Frontend implementation - simply redirect to the endpoint
const startAuth = () => {
  window.location.href = '/api/auth/discord';
};
```

#### `GET /api/auth/discord/callback`
OAuth callback handler.

**Description:** Handles the OAuth callback from Discord, exchanges the authorization code for an access token, and creates a user session.

**Query Parameters:**
- `code` (required) - Authorization code from Discord
- `state` (required) - State parameter for security validation

**Response:**
- **Success**: Redirects to dashboard with session cookie
- **Error**: Redirects to error page with error message

**Error Responses:**
```json
{
  "error": "Invalid authorization code",
  "code": "INVALID_CODE"
}
```

#### `GET /api/auth/me`
Get current user information.

**Description:** Returns information about the currently authenticated user.

**Headers:**
- `Cookie: session=<session_id>` (required)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "123456789012345678",
    "username": "username",
    "discriminator": "0001",
    "avatar": "avatar_hash",
    "discord_id": "123456789012345678",
    "is_admin": true
  }
}
```

**Error Responses:**
```json
{
  "success": false,
  "error": "Not authenticated"
}
```

#### `POST /api/auth/logout`
Logout current user.

**Description:** Invalidates the current session and logs out the user.

**Headers:**
- `Cookie: session=<session_id>` (required)

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  }
}
```

**Example Usage:**
```javascript
// Frontend logout implementation
const logout = async () => {
  const response = await fetch('/api/auth/logout', {
    method: 'POST',
    credentials: 'include'
  });
  const data = await response.json();
  if (data.success) {
    window.location.href = '/login';
  }
};
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

API requests are rate limited to prevent abuse and ensure fair usage:

- **Authentication endpoints**: 10 requests per minute
- **Plugin management**: 100 requests per minute
- **Bot management**: 50 requests per minute
- **File uploads**: 20 requests per minute

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
X-RateLimit-Retry-After: 60
```

**Rate Limit Exceeded Response:**
```json
{
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 60,
  "limit": 100,
  "remaining": 0,
  "resetTime": "2025-10-15T11:00:00.000Z"
}
```

## WebSocket Events

The API supports real-time updates via WebSocket connections for live monitoring and updates.

### Connection

```javascript
const ws = new WebSocket('ws://localhost:3002/ws');
ws.onopen = () => {
  console.log('Connected to WebSocket');
};
```

### Event Types

#### Plugin Events
```javascript
// Plugin created
{
  "type": "plugin.created",
  "data": {
    "id": "plugin-id",
    "name": "New Plugin",
    "author": "username"
  }
}

// Plugin updated
{
  "type": "plugin.updated",
  "data": {
    "id": "plugin-id",
    "changes": ["name", "nodes"]
  }
}

// Plugin deleted
{
  "type": "plugin.deleted",
  "data": {
    "id": "plugin-id"
  }
}
```

#### Bot Events
```javascript
// Bot status change
{
  "type": "bot.status",
  "data": {
    "online": true,
    "uptime": 3600000,
    "guilds": 5
  }
}

// Command executed
{
  "type": "command.executed",
  "data": {
    "pluginId": "plugin-id",
    "userId": "123456789",
    "guildId": "987654321",
    "command": "/hello",
    "executionTime": 150
  }
}
```

## SDK Examples

### JavaScript/TypeScript SDK

```typescript
class DisModularAPI {
  private baseUrl: string;
  private sessionId: string;

  constructor(baseUrl: string, sessionId: string) {
    this.baseUrl = baseUrl;
    this.sessionId = sessionId;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `session=${this.sessionId}`,
        ...options.headers
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'API request failed');
    }

    return response.json();
  }

  // Plugin management
  async getPlugins() {
    return this.request('/api/plugins');
  }

  async createPlugin(pluginData: PluginData) {
    return this.request('/api/plugins', {
      method: 'POST',
      body: JSON.stringify(pluginData)
    });
  }

  async updatePlugin(id: string, updates: Partial<PluginData>) {
    return this.request(`/api/plugins/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  }

  async deletePlugin(id: string) {
    return this.request(`/api/plugins/${id}`, {
      method: 'DELETE'
    });
  }

  // Bot management
  async getBotStatus() {
    return this.request('/api/bot/status');
  }

  async updateBotConfig(config: BotConfig) {
    return this.request('/api/bot/config', {
      method: 'PUT',
      body: JSON.stringify(config)
    });
  }
}

// Usage example
const api = new DisModularAPI('http://localhost:3002', 'session-id');
const plugins = await api.getPlugins();
console.log(plugins);
```

### Python SDK

```python
import requests
import json
from typing import Dict, List, Optional

class DisModularAPI:
    def __init__(self, base_url: str, session_id: str):
        self.base_url = base_url.rstrip('/')
        self.session_id = session_id
        self.session = requests.Session()
        self.session.cookies.set('session', session_id)

    def _request(self, method: str, endpoint: str, **kwargs) -> Dict:
        url = f"{self.base_url}{endpoint}"
        response = self.session.request(method, url, **kwargs)
        
        if not response.ok:
            error = response.json()
            raise Exception(error.get('message', 'API request failed'))
        
        return response.json()

    def get_plugins(self) -> List[Dict]:
        return self._request('GET', '/api/plugins')

    def create_plugin(self, plugin_data: Dict) -> Dict:
        return self._request('POST', '/api/plugins', 
                           json=plugin_data)

    def update_plugin(self, plugin_id: str, updates: Dict) -> Dict:
        return self._request('PUT', f'/api/plugins/{plugin_id}', 
                           json=updates)

    def delete_plugin(self, plugin_id: str) -> Dict:
        return self._request('DELETE', f'/api/plugins/{plugin_id}')

    def get_bot_status(self) -> Dict:
        return self._request('GET', '/api/bot/status')

# Usage example
api = DisModularAPI('http://localhost:3002', 'session-id')
plugins = api.get_plugins()
print(plugins)
```

## Testing

### Unit Testing

```javascript
// Using Jest for API testing
const request = require('supertest');
const app = require('../src/app');

describe('API Endpoints', () => {
  let sessionCookie;

  beforeAll(async () => {
    // Setup test user and get session
    const authResponse = await request(app)
      .get('/api/auth/discord');
    sessionCookie = authResponse.headers['set-cookie'];
  });

  describe('GET /api/plugins', () => {
    it('should return plugins list', async () => {
      const response = await request(app)
        .get('/api/plugins')
        .set('Cookie', sessionCookie)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/plugins')
        .expect(401);
    });
  });

  describe('POST /api/plugins', () => {
    it('should create a new plugin', async () => {
      const pluginData = {
        name: 'Test Plugin',
        type: 'slash',
        command: 'test',
        nodes: [],
        edges: []
      };

      const response = await request(app)
        .post('/api/plugins')
        .set('Cookie', sessionCookie)
        .send(pluginData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Test Plugin');
    });
  });
});
```

### Integration Testing

```javascript
// End-to-end API testing
describe('API Integration Tests', () => {
  let api;
  let testPluginId;

  beforeAll(() => {
    api = new DisModularAPI('http://localhost:3002', 'test-session');
  });

  test('Complete plugin lifecycle', async () => {
    // Create plugin
    const plugin = await api.createPlugin({
      name: 'Integration Test Plugin',
      type: 'slash',
      command: 'test',
      nodes: [
        { id: 'trigger', type: 'trigger', data: { command: 'test' } },
        { id: 'response', type: 'response', data: { message: 'Hello!' } }
      ],
      edges: [
        { source: 'trigger', target: 'response' }
      ]
    });

    testPluginId = plugin.id;
    expect(plugin.name).toBe('Integration Test Plugin');

    // Update plugin
    const updated = await api.updatePlugin(testPluginId, {
      name: 'Updated Test Plugin'
    });
    expect(updated.name).toBe('Updated Test Plugin');

    // Get plugin
    const retrieved = await api.getPlugin(testPluginId);
    expect(retrieved.id).toBe(testPluginId);

    // Delete plugin
    await api.deletePlugin(testPluginId);
    
    // Verify deletion
    try {
      await api.getPlugin(testPluginId);
      fail('Plugin should have been deleted');
    } catch (error) {
      expect(error.message).toContain('404');
    }
  });
});
```

### Load Testing

```javascript
// Using Artillery for load testing
const artillery = require('artillery');

const config = {
  target: 'http://localhost:3002',
  phases: [
    { duration: '2m', arrivalRate: 10 },
    { duration: '5m', arrivalRate: 20 },
    { duration: '2m', arrivalRate: 0 }
  ]
};

const scenarios = [
  {
    name: 'Plugin Management Load Test',
    flow: [
      { get: { url: '/api/plugins' } },
      { post: { 
        url: '/api/plugins',
        json: {
          name: 'Load Test Plugin',
          type: 'slash',
          command: 'loadtest'
        }
      }},
      { get: { url: '/api/bot/status' } }
    ]
  }
];

artillery.run(config, scenarios);
```
