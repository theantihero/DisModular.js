# Bot Documentation

The DisModular.js Bot is the core Discord bot that executes plugins and manages interactions. Built with Discord.js v14, it provides a robust, scalable platform for Discord bot development with visual plugin creation.

## Table of Contents

- [Architecture Overview](#architecture)
- [Core Components](#core-components)
- [Plugin System](#plugin-system)
- [Security Features](#security)
- [Configuration](#configuration)
- [Performance & Monitoring](#performance--monitoring)
- [Development Guide](#development)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [API Reference](#api-reference)

## Architecture

The bot follows a modular, event-driven architecture designed for scalability and maintainability:

```
packages/bot/
├── src/
│   ├── core/
│   │   └── BotClient.js          # Main bot class and event handling
│   ├── models/
│   │   └── PluginModel.js        # Plugin database operations
│   ├── plugins/
│   │   ├── PluginManager.js      # Plugin lifecycle management
│   │   └── PluginLoader.js       # Plugin loading and file watching
│   ├── sandbox/
│   │   └── SandboxExecutor.js    # Safe plugin execution environment
│   ├── viewmodels/               # Business logic layer (empty)
│   └── index.js                  # Entry point
├── tests/                        # Test suite
│   ├── PluginManager.test.js     # Plugin manager tests
│   └── SandboxExecutor.test.js   # Sandbox execution tests
└── package.json
```

### Design Patterns

- **MVVM Architecture**: Clear separation between models, view models, and views
- **Event-Driven**: Loose coupling through Discord.js event handling
- **Plugin Pattern**: Modular plugin system with dynamic loading
- **Sandbox Pattern**: Isolated execution environment for user code

## Core Components

### BotClient Class (`src/core/BotClient.js`)

The main bot class that handles Discord client initialization and event management.

**Key Features:**
- Discord client setup with intents
- Event handling (ready, interactionCreate, messageCreate)
- Plugin loading and management
- Error handling and logging

**Configuration:**
```javascript
const bot = new Bot({
  token: process.env.DISCORD_BOT_TOKEN,
  clientId: process.env.DISCORD_CLIENT_ID,
  intents: [
    'Guilds',
    'GuildMessages',
    'MessageContent'
  ]
});
```

### PluginManager (`src/PluginManager.js`)

Manages the complete plugin lifecycle from registration to execution.

**Key Methods:**
- `register(pluginData)` - Register a new plugin
- `unregister(pluginId)` - Remove a plugin
- `getPluginByCommand(command, type)` - Find plugin by command
- `enablePlugin(pluginId)` - Enable a plugin
- `disablePlugin(pluginId)` - Disable a plugin
- `reloadPlugin(pluginId)` - Reload plugin code

**Plugin Data Structure:**
```javascript
{
  id: 'unique-plugin-id',
  name: 'Plugin Name',
  description: 'Plugin description',
  version: '1.0.0',
  author: 'Author Name',
  type: 'slash', // 'slash', 'text', or 'both'
  command: 'command-name',
  nodes: [...], // Visual editor nodes
  edges: [...], // Node connections
  compiled: '// Generated JavaScript code',
  enabled: true
}
```

### SandboxExecutor (`src/SandboxExecutor.js`)

Provides secure execution environment for user-generated plugin code.

**Security Features:**
- Isolated VM execution using `isolated-vm`
- Code validation against dangerous patterns
- Timeout protection (5 second default)
- Memory limits and resource constraints
- No access to Node.js APIs or system resources

**Execution Context:**
```javascript
const context = {
  interaction: {
    user: { id, username, discriminator },
    guild: { id, name },
    channel: { id, name },
    commandName: 'command',
    options: { ... }
  },
  variables: { ... }, // Plugin variables
  state: { ... }      // Plugin state
};
```

### PluginModel (`src/models/PluginModel.js`)

Handles database operations for plugin persistence.

**Key Methods:**
- `create(pluginData)` - Create new plugin
- `getById(id)` - Get plugin by ID
- `getAll()` - Get all plugins
- `update(id, data)` - Update plugin
- `delete(id)` - Delete plugin
- `setState(pluginId, state)` - Update plugin state
- `getState(pluginId)` - Get plugin state

## Plugin Types

### Slash Commands
Discord slash commands that appear in the command picker.

**Example:**
```javascript
{
  type: 'slash',
  command: 'poll',
  description: 'Create a poll',
  options: [
    {
      name: 'question',
      type: 'string',
      description: 'Poll question',
      required: true
    }
  ]
}
```

### Text Commands
Traditional text-based commands with prefix.

**Example:**
```javascript
{
  type: 'text',
  command: 'hello',
  description: 'Say hello to the user'
}
```

### Both Types
Plugins that support both slash and text commands.

## Plugin Execution Flow

1. **Command Received** - Bot receives Discord interaction or message
2. **Plugin Lookup** - Find matching plugin by command and type
3. **Validation** - Check if plugin is enabled and user has permission
4. **Compilation** - Convert visual nodes to executable JavaScript
5. **Sandbox Execution** - Run compiled code in isolated environment
6. **Response** - Send response back to Discord
7. **Logging** - Record execution details and any errors

## Security

### Code Validation
Before execution, plugin code is validated against dangerous patterns:

```javascript
const forbiddenPatterns = [
  /require\s*\(/,
  /import\s+/,
  /process\./,
  /eval\s*\(/,
  /Function\s*\(/,
  /fs\./,
  /global\./
];
```

### Sandbox Isolation
- No access to Node.js modules
- No file system access
- No process manipulation
- No environment variable access
- Limited memory and CPU usage

### Input Sanitization
- All user inputs are sanitized
- SQL injection protection
- XSS prevention
- Command injection prevention

## Configuration

### Environment Variables
```bash
DISCORD_BOT_TOKEN=your_bot_token
DISCORD_CLIENT_ID=your_client_id
DISCORD_CLIENT_SECRET=your_client_secret
DATABASE_PATH=./data/bot.db
LOG_LEVEL=info
```

### Bot Settings
```javascript
{
  prefix: '!',
  cooldown: 3000, // 3 seconds
  maxPlugins: 100,
  timeout: 5000,  // 5 seconds
  memoryLimit: 50 * 1024 * 1024 // 50MB
}
```

## Error Handling

### Plugin Errors
- Compilation errors are caught and logged
- Runtime errors are handled gracefully
- User-friendly error messages
- Detailed logging for debugging

### Bot Errors
- Connection issues are handled with retry logic
- Rate limiting is respected
- Permission errors are logged
- Critical errors trigger alerts

## Monitoring

### Metrics
- Command execution count
- Plugin performance metrics
- Error rates and types
- Memory usage
- Response times

### Logging
- Structured JSON logging
- Different log levels (debug, info, warn, error)
- Request/response logging
- Error stack traces
- Performance metrics

## Development

### Running the Bot
```bash
# Development mode
npm run dev:bot

# Production mode
npm run start:bot
```

### Testing
```bash
# Run all tests
npm test

# Run bot tests only
npm test --workspace=@dismodular/bot
```

### Debugging
Enable debug logging:
```bash
LOG_LEVEL=debug npm run dev:bot
```

## Deployment

### Production Setup
1. Set up environment variables
2. Configure database
3. Install dependencies
4. Start the bot service
5. Monitor logs and metrics

### Docker Support
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
CMD ["npm", "start:bot"]
```

## Performance & Monitoring

### Built-in Logging

The bot uses the shared Logger utility for comprehensive logging:

```javascript
import { Logger } from '@dismodular/shared';

const logger = new Logger('BotClient');
logger.info('Bot started successfully');
logger.error('Plugin execution failed', { error: error.message });
```

### Plugin Execution Monitoring

The SandboxExecutor provides execution monitoring:

```javascript
// Execution timeout and memory limits
const result = await sandboxExecutor.execute(code, context, {
  timeout: 5000,        // 5 second timeout
  memoryLimit: 128 * 1024 * 1024, // 128MB memory limit
  allowAsync: true
});
```

## Configuration

### Environment Variables

The bot can be configured using environment variables:

```env
# Discord Bot Configuration
DISCORD_BOT_TOKEN=your_bot_token_here
DISCORD_CLIENT_ID=your_client_id_here
DISCORD_CLIENT_SECRET=your_client_secret_here

# Optional: Guild ID for faster command registration during development
DISCORD_GUILD_ID=your_guild_id_for_testing

# Bot Configuration
ENABLE_MESSAGE_CONTENT=false
ENABLE_GUILD_MEMBERS=false

# Database
DATABASE_PATH=./data/bot.db

# Plugins
PLUGINS_DIR=./plugins
```

## Troubleshooting

### Common Issues

**Bot not responding:**
- Check token validity and permissions
- Verify intents are enabled in Discord Developer Portal
- Check network connectivity and firewall settings
- Review error logs for specific error messages
- Ensure bot has proper permissions in target guilds

**Plugins not loading:**
- Verify plugin JSON format and required fields
- Check compilation errors in bot console
- Ensure plugin is enabled in dashboard
- Review database connection and permissions
- Check plugin file permissions

**Permission errors:**
- Verify bot has necessary permissions in Discord
- Check slash command registration status
- Review role hierarchy and channel permissions
- Ensure bot role is above user roles
- Check for permission conflicts

**Performance issues:**
- Monitor memory usage and CPU utilization
- Check for memory leaks in plugins
- Review database query performance
- Analyze plugin execution times
- Consider implementing caching strategies

### Debug Mode

Enable comprehensive debugging:

```bash
# Environment variables for debugging
DEBUG=bot:*
LOG_LEVEL=debug
NODE_ENV=development

# Start bot with debug logging
npm run dev:bot
```

### Log Analysis

```javascript
// Structured logging for better analysis
const logger = new Logger('Bot', {
  level: 'debug',
  format: 'json',
  transports: [
    new ConsoleTransport(),
    new FileTransport('bot.log'),
    new DatabaseTransport()
  ]
});

// Query logs for analysis
const errorLogs = await logger.query({
  level: 'error',
  startTime: '2025-10-15T00:00:00.000Z',
  endTime: '2025-10-15T23:59:59.999Z'
});
```

### Health Checks

```javascript
// Bot health check endpoint
app.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    plugins: {
      total: pluginManager.getPluginCount(),
      enabled: pluginManager.getEnabledPluginCount(),
      errors: pluginManager.getErrorCount()
    },
    database: await checkDatabaseConnection(),
    discord: await checkDiscordConnection()
  };
  
  res.json(health);
});
```

## API Reference

### BotClient Class Methods

```javascript
class BotClient {
  // Initialize bot with configuration
  constructor(config)
  
  // Start the bot and register commands
  async start()
  
  // Stop the bot gracefully
  async stop()
  
  // Register slash commands with Discord
  async registerSlashCommands()
  
  // Handle slash command interactions
  async handleSlashCommand(interaction)
  
  // Handle message commands (if enabled)
  async handleMessageCommand(message)
}
```

### PluginManager Methods

```javascript
class PluginManager {
  // Get plugin by command
  getPluginByCommand(command)
  
  // Get all plugins
  getAllPlugins()
  
  // Check if plugin exists
  hasPlugin(pluginId)
  
  // Execute plugin
  async executePlugin(plugin, context)
}
```

### SandboxExecutor Methods

```javascript
class SandboxExecutor {
  // Execute code in sandbox
  async execute(code, context, options)
  
  // Validate code before execution
  validateCode(code)
  
  // Create safe context for execution
  createContext(baseContext)
}
```
