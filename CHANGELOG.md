# Changelog

All notable changes to DisModular.js will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.1] - 2025-10-14

### Added
- 🎨 **Modern Admin Dashboard** with gradient design and glass morphism effects
- 👑 **Admin Management System** - Add/remove admin privileges for users
- 📊 **Real-time Analytics Dashboard** with command tracking and metrics
- ⚙️ **Settings Page** with full bot configuration management
- 📱 **Mobile Responsive Design** - Full mobile navigation and touch-friendly interface
- 🔌 **Visual Plugin Editor** - Node-based workflow creator with 20+ node types
- 📤 **Export/Import Workflows** - Share plugin JSON files with the community

### Sample Plugins
- 🌤️ **Weather Command Plugin** - Example using Open-Meteo API and HTTP requests
- 📊 **Poll Command Plugin** - Advanced polls with multiple options and time limits
- ⏰ **Reminder Command Plugin** - Set reminders with flexible time parsing
- 🎲 **Dice Roller Plugin** - Roll dice with customizable sides
- 👋 **Hello World Plugin** - Simple example for getting started
- 🔢 **Counter Plugin** - Track counts with persistent state

### Features
- **Node Types**:
  - Core: Trigger, Response, Variable, Condition, Action, Data
  - HTTP: HTTP Request for external API calls
  - Discord: Embed Builder, Embed Response, Discord Actions
  - Control Flow: For Loop, While Loop, Comparison
  - Data Manipulation: Array, String, Object, Math operations
  - Database: Database queries and state management
  - Utilities: JSON parsing and manipulation

- **Admin Features**:
  - User management with admin privileges
  - Real-time analytics and metrics
  - Bot configuration settings
  - Command execution tracking
  - Audit logging

- **Editor Features**:
  - Context menus (right-click)
  - Keyboard shortcuts (Ctrl+S, Ctrl+C, Ctrl+V, etc.)
  - Collapsible node palette with categories
  - Test compile functionality
  - Export/import workflows

### Technical
- **Architecture**: Monorepo with bot, API, dashboard, and shared packages
- **Security**: Discord OAuth, admin-only routes, sandboxed plugin execution
- **Database**: SQLite with better-sqlite3, WAL mode enabled
- **Frontend**: React with Tailwind CSS, React Flow, Zustand
- **Backend**: Express.js with passport authentication
- **Bot**: Discord.js v14 with configurable intents

### Fixed
- Slash command options now register correctly with Discord API
- Admin panel database connection issues resolved
- Plugin editor route matching fixed
- SandboxExecutor function cloning error fixed
- Environment variable loading across all packages
- Database path resolution for workspace root

### Security
- Admin authentication with Discord OAuth
- Role-based access control (admin-only endpoints)
- Session management with secure cookies
- Input validation and sanitization
- Sandboxed plugin execution with isolated-vm

---

## Future Releases

### Planned for v0.1.0
- User role management
- Plugin marketplace
- Advanced analytics with graphs
- Webhook integrations
- Database backup automation
- Plugin versioning system
- Custom node creation

---

**Legend:**
- 🎨 UI/UX
- 👑 Admin
- 📊 Analytics
- ⚙️ Settings
- 🔌 Plugins
- 📱 Mobile
- 🔧 Technical

