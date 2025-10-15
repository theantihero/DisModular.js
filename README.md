<div align="center">
  <img src="assets/dmjs-logo.png" alt="DisModular.js Logo" width="200"/>
  
  # DisModular.js

  A modular Discord bot framework with visual node-based plugin creation. Build sophisticated bot commands and interactions through an intuitive drag-and-drop interface — no coding required!

  **Version:** 0.0.3 • **License:** MIT • **Author:** fkndean_/theantihero

  [![Build Status](https://img.shields.io/github/actions/workflow/status/theantihero/DisModular.js/ci.yml?branch=main&label=build)](https://github.com/theantihero/DisModular.js/actions/workflows/ci.yml)
  [![Security Scan](https://img.shields.io/github/actions/workflow/status/theantihero/DisModular.js/security.yml?branch=main&label=security)](https://github.com/theantihero/DisModular.js/actions/workflows/security.yml)
  [![Tests](https://img.shields.io/badge/tests-%20passing-brightgreen)](https://github.com/theantihero/DisModular.js/actions)
  [![Coverage](https://img.shields.io/badge/coverage-85%25-brightgreen)](https://github.com/theantihero/DisModular.js/actions)
  [![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
  [![Node](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](package.json)
  [![Version](https://img.shields.io/github/package-json/v/theantihero/DisModular.js)](package.json)

  ---
</div>

## 🌟 Features

### 🎨 Visual Plugin Editor
- **Node-Based Workflow**: Create bot plugins by connecting nodes in a visual editor
- **20+ Node Types**: Triggers, variables, conditions, loops, HTTP requests, Discord embeds, and more
- **No Coding Required**: Build sophisticated plugins without writing code

![Advanced Poll Workflow Example](assets/advanced-poll-workflow.png)
*Example: Advanced Poll plugin built entirely with the visual node editor*

### 👑 Admin Dashboard
- **Modern UI**: Beautiful gradient design with glass morphism effects
- **Real-time Analytics**: Command tracking, usage metrics, and performance monitoring
- **User Management**: Add/remove admin privileges for Discord users

### 🔌 Plugin System
- **Dual Commands**: Support for both slash commands (`/poll`) and text commands (`!hello`)
- **Hot Reload**: Changes reflect immediately without bot restart
- **Sandboxed Execution**: Safe plugin execution using isolated-vm

### 🛠️ Developer Features
- **Monorepo Structure**: Clean workspace organization with npm workspaces
- **Self-Hostable**: Single SQLite database, no external dependencies
- **Comprehensive Logging**: Detailed logs for debugging and monitoring

## 🏗️ Architecture

The project follows a monorepo structure with three main packages:

```
dismodular.js/
├── packages/
│   ├── bot/        # Discord bot core with plugin system
│   ├── api/        # Express REST API server
│   ├── dashboard/  # React dashboard with visual editor
│   └── shared/     # Shared utilities and types
├── plugins/        # Auto-detected plugins directory
└── data/          # SQLite database storage
```

## 📊 Dashboard Features

- **Real-time Analytics**: Command tracking, usage metrics, and performance monitoring
- **Settings Management**: Configure bot prefix, cooldowns, and logging levels
- **Admin Management**: User search, privilege management, and activity monitoring

*See [Dashboard Documentation](docs/dashboard.md) for detailed features and usage.*

## 📋 Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Discord Bot Token** (from [Discord Developer Portal](https://discord.com/developers/applications))
- **Discord OAuth Credentials** (Client ID & Secret)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/theantihero/DisModular.js.git
cd DisModular.js
```

### 2. Install Dependencies

```bash
npm install
```

This will install dependencies for all packages in the workspace.

### 3. Configure Environment Variables

Copy the example environment file and edit `.env`:

```bash
cp env.example .env
```

**Key variables to configure:**
```env
DISCORD_BOT_TOKEN=your_bot_token_here
DISCORD_CLIENT_ID=your_client_id_here
DISCORD_CLIENT_SECRET=your_client_secret_here
INITIAL_ADMIN_DISCORD_ID=your_discord_id_here
```

### 4. Set Up Database

```bash
npm run setup:db
```

### 5. Start the Application

```bash
npm run dev
```

### 6. Access the Dashboard

Open `http://localhost:5173` and login with Discord to start creating plugins!

## 🎨 Creating Plugins

### Basic Workflow

1. **Login** to the dashboard with Discord (must be admin)
2. Click **"Create Plugin"** on the dashboard
3. **Drag nodes** from the palette onto the canvas
4. **Connect nodes** by dragging from one handle to another
5. **Configure nodes** by clicking them (properties appear on the right)
6. **Save the plugin** - it will automatically be loaded by the bot

### Node Categories

- **Core Nodes**: Trigger, Response, Variable, Data
- **Control Flow**: Condition, Comparison, Loops
- **Discord Features**: Embed Builder, Discord Actions
- **Data Manipulation**: Array, String, Object, Math Operations
- **External & Storage**: HTTP Request, Database, JSON
- **Actions**: General actions and utilities

*See [Plugin Editor Guide](docs/plugin-editor.md) for detailed node types and advanced examples.*

## 📁 Project Structure

```
packages/
├── bot/        # Discord Bot Package
├── api/        # REST API Package  
├── dashboard/  # React Dashboard
└── shared/     # Shared utilities and types
```

## 🔧 API Endpoints

### Authentication
- `GET /api/auth/discord` - Start Discord OAuth flow
- `GET /api/auth/discord/callback` - OAuth callback
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Plugins
- `GET /api/plugins` - Get all plugins
- `GET /api/plugins/:id` - Get plugin by ID
- `POST /api/plugins` - Create new plugin
- `PUT /api/plugins/:id` - Update plugin
- `DELETE /api/plugins/:id` - Delete plugin
- `POST /api/plugins/compile` - Compile node graph

### Bot
- `GET /api/bot/status` - Get bot status and stats
- `GET /api/bot/config` - Get bot configuration
- `PUT /api/bot/config` - Update configuration
- `GET /api/bot/audit` - Get audit logs

*See [API Documentation](docs/api.md) for complete reference with examples.*

## 🔒 Security

DisModular.js implements multiple security layers:

- **Plugin Sandbox**: Isolated execution using isolated-vm with resource limits
- **OAuth Authentication**: Secure Discord OAuth 2.0 with session management
- **Input Validation**: All user inputs sanitized and validated
- **Automated Scanning**: CodeQL, Trivy, npm audit, and OSSF Scorecard

*See [Bot Documentation](docs/bot.md#security) for detailed security features.*

## 🧪 Development

```bash
# Run tests
npm test

# Lint code
npm run lint

# Build for production
cd packages/dashboard && npm run build
NODE_ENV=production npm run start
```

## 📝 Plugin File Format

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "type": "slash",
  "enabled": true,
  "nodes": [...],
  "edges": [...],
  "compiled": "// Generated code"
}
```

## 🚀 CI/CD & Releases

DisModular.js has a comprehensive CI/CD pipeline with automated testing, security scanning, and releases.

**Automated Workflows:**
- **CI Pipeline**: Runs tests, linting, and builds on every push
- **Security Scanning**: CodeQL, Trivy, npm audit, and OSSF Scorecard
- **Release Automation**: Automatic releases on version bumps
- **Dependabot**: Weekly dependency updates for all packages

**Creating Releases:**
```bash
npm run release:patch  # 0.0.1 → 0.0.2
npm run release:minor  # 0.0.1 → 0.1.0
npm run release:major  # 0.0.1 → 1.0.0
```

*See [GitHub Actions](https://github.com/theantihero/DisModular.js/actions) for workflow status and detailed CI/CD documentation.*

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🔐 Admin Setup

1. **Get Discord ID**: Enable Developer Mode in Discord, right-click your username, select "Copy User ID"
2. **Set Admin ID**: Add your Discord ID to `INITIAL_ADMIN_DISCORD_ID` in `.env`
3. **Login**: First login with matching Discord ID grants admin privileges

*Additional admins can be added via database or dashboard.*

## 🐛 Troubleshooting

**Bot won't start:**
- Check `DISCORD_BOT_TOKEN` is correct
- Verify Node.js version >= 20.0.0
- Ensure database path is writable

**Dashboard shows "Access Denied":**
- Verify `INITIAL_ADMIN_DISCORD_ID` matches your Discord ID
- Check you've logged in at least once

**Plugins not executing:**
- Ensure plugin is enabled in dashboard
- Check bot console for compilation errors
- Verify plugin has trigger and response nodes

*See [Bot Documentation](docs/bot.md#troubleshooting) for detailed troubleshooting guide.*

## 📤 Sharing Workflows

Export any plugin as a JSON file from the editor toolbar, then import it into another instance. Share workflows on GitHub, Discord communities, or forums.

*See [Plugin Editor Guide](docs/plugin-editor.md#sharing-and-collaboration) for detailed sharing instructions and best practices.*

## 🎯 Example Plugin

### Hello World Plugin

A simple example demonstrating basic plugin creation:

1. **Trigger Node**: `/hello` slash command
2. **Variable Node**: Get the username
3. **Response Node**: Greet the user with "Hello, {username}!"

*See [Plugin Editor Guide](docs/plugin-editor.md) for advanced examples including Poll, Weather, and Reminder plugins.*

## 📚 Documentation

Comprehensive documentation is available in the [`docs/`](docs/) folder:

- **[API Documentation](docs/api.md)** - Complete REST API reference
- **[Bot Documentation](docs/bot.md)** - Bot architecture and plugin system  
- **[Dashboard Documentation](docs/dashboard.md)** - Web interface and user management
- **[Plugin Editor Guide](docs/plugin-editor.md)** - Visual workflow creation tutorial

## 📚 External Resources

- [Discord.js Documentation](https://discord.js.org/)
- [React Flow Documentation](https://reactflow.dev/)
- [Node.js Documentation](https://nodejs.org/)

## 💬 Support

For questions or issues, please open an issue on GitHub.

---

**DisModular.js** - Made with ❤️ by fkndean_

