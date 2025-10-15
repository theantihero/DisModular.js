# Bot Documentation

The DisModular.js Bot is the core Discord bot that executes plugins and manages interactions.

## Architecture

The bot is built using Discord.js v14 and follows a modular architecture:

```
packages/bot/
├── src/
│   ├── Bot.js              # Main bot class
│   ├── PluginManager.js    # Plugin lifecycle management
│   ├── SandboxExecutor.js  # Safe plugin execution
│   └── models/
│       └── PluginModel.js  # Database operations
├── tests/                  # Comprehensive test suite
└── package.json
```

## Core Components

### Bot Class (`src/Bot.js`)

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

## Troubleshooting

### Common Issues

**Bot not responding:**
- Check token validity
- Verify intents are enabled
- Check network connectivity
- Review error logs

**Plugins not loading:**
- Verify plugin format
- Check compilation errors
- Ensure plugin is enabled
- Review database connection

**Permission errors:**
- Check bot permissions in Discord
- Verify slash command registration
- Review role hierarchy
- Check channel permissions
