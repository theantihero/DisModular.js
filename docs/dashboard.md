# Dashboard Documentation

The DisModular.js Dashboard is a modern React-based web interface for managing plugins, viewing analytics, and configuring bot settings.

## Architecture

The dashboard is built with React 18 and modern web technologies:

```
packages/dashboard/
├── src/
│   ├── components/         # React components
│   │   ├── Editor/        # Visual plugin editor
│   │   ├── Analytics/     # Analytics dashboard
│   │   ├── Settings/      # Settings panels
│   │   └── common/        # Shared components
│   ├── hooks/             # Custom React hooks
│   ├── services/          # API service layer
│   ├── utils/             # Utility functions
│   └── styles/            # CSS and styling
├── public/                # Static assets
└── package.json
```

## Key Features

### 🎨 Visual Plugin Editor

The heart of the dashboard is the visual node-based plugin editor.

**Core Components:**
- **Canvas**: Interactive workspace for node manipulation
- **Node Palette**: Drag-and-drop node library
- **Property Panel**: Node configuration interface
- **Toolbar**: Editor tools and actions
- **Compile Panel**: Code preview and validation

**Node Types Available:**
- **Triggers**: Start plugin execution
- **Actions**: Perform operations
- **Conditions**: Control flow logic
- **Variables**: Data storage and manipulation
- **Discord Features**: Embeds, reactions, messages
- **External APIs**: HTTP requests, data fetching
- **Storage**: Database operations

### 📊 Analytics Dashboard

Real-time monitoring and analytics for bot performance.

**Metrics Displayed:**
- **Command Usage**: Total commands executed
- **Active Users**: Unique users interacting with bot
- **Success Rate**: Percentage of successful executions
- **Response Time**: Average response time
- **Hourly Charts**: Usage patterns over 24 hours
- **Plugin Performance**: Individual plugin statistics

**Features:**
- Auto-refresh every 10 seconds
- Interactive charts and graphs
- Exportable data
- Historical trends
- Performance alerts

### ⚙️ Settings Panel

Comprehensive configuration management.

**General Settings:**
- Bot prefix configuration
- Command cooldowns
- Maximum plugin limits
- Logging levels
- Database settings

**Security Settings:**
- Admin user management
- Permission controls
- Access restrictions
- Audit logging

**Plugin Settings:**
- Global plugin defaults
- Execution timeouts
- Memory limits
- Sandbox configuration

### 👥 User Management

Admin user management and access control.

**Features:**
- User search by name or Discord ID
- Grant/revoke admin privileges
- Role-based access control
- Session management
- Activity monitoring

## User Interface

### Design System

**Color Palette:**
- Primary: Modern gradient backgrounds
- Secondary: Glass morphism effects
- Accent: Discord brand colors
- Status: Success, warning, error indicators

**Typography:**
- Headers: Bold, modern sans-serif
- Body: Clean, readable fonts
- Code: Monospace for technical content
- Responsive sizing

**Layout:**
- Mobile-first responsive design
- Flexible grid system
- Collapsible sidebars
- Modal dialogs for complex actions

### Navigation

**Main Navigation:**
- Dashboard overview
- Plugin editor
- Analytics
- Settings
- User management

**Breadcrumbs:**
- Clear navigation path
- Quick access to parent pages
- Context awareness

**Search:**
- Global search functionality
- Plugin search and filtering
- User search
- Command search

## Authentication

### Discord OAuth Integration

**Flow:**
1. User clicks "Login with Discord"
2. Redirected to Discord OAuth
3. User authorizes application
4. Callback with authorization code
5. Exchange code for access token
6. Create session and redirect to dashboard

**Session Management:**
- Secure HTTP-only cookies
- Session expiration handling
- Automatic token refresh
- Logout functionality

### Authorization

**Admin Access:**
- First user with matching Discord ID becomes admin
- Additional admins can be added via database
- Admin privileges required for:
  - Plugin creation/editing
  - User management
  - Settings modification
  - Analytics access

**Access Control:**
- Route-level protection
- Component-level permissions
- API endpoint authorization
- Real-time permission updates

## API Integration

### Service Layer

**API Client:**
```javascript
// Example API service
class PluginService {
  async getPlugins() {
    const response = await fetch('/api/plugins');
    return response.json();
  }
  
  async createPlugin(pluginData) {
    const response = await fetch('/api/plugins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pluginData)
    });
    return response.json();
  }
}
```

**Error Handling:**
- Global error boundary
- API error handling
- User-friendly error messages
- Retry mechanisms
- Offline support

### Real-time Updates

**WebSocket Integration:**
- Real-time plugin updates
- Live analytics data
- Bot status monitoring
- User activity tracking

**Polling Fallback:**
- Regular API polling
- Configurable intervals
- Background refresh
- Data synchronization

## State Management

### React Context

**Global State:**
- User authentication
- Plugin data
- Bot configuration
- UI preferences

**Local State:**
- Component-specific data
- Form inputs
- UI interactions
- Temporary data

### Data Flow

**Unidirectional Data Flow:**
1. User interaction triggers action
2. Action updates state
3. State change re-renders components
4. Components reflect new state

**State Persistence:**
- Local storage for preferences
- Session storage for temporary data
- Server state synchronization
- Optimistic updates

## Performance

### Optimization Strategies

**Code Splitting:**
- Route-based splitting
- Component lazy loading
- Dynamic imports
- Bundle optimization

**Caching:**
- API response caching
- Component memoization
- Image optimization
- CDN integration

**Rendering:**
- Virtual scrolling for large lists
- Debounced search inputs
- Optimized re-renders
- Efficient DOM updates

### Monitoring

**Performance Metrics:**
- Page load times
- Component render times
- API response times
- User interaction metrics

**Error Tracking:**
- JavaScript errors
- API failures
- User experience issues
- Performance bottlenecks

## Development

### Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev:dashboard

# Build for production
npm run build:dashboard
```

### Development Tools

**Code Quality:**
- ESLint for code linting
- Prettier for code formatting
- TypeScript for type safety
- Jest for testing

**Development Features:**
- Hot module replacement
- Source maps
- Debug tools
- Development server

### Testing

**Test Types:**
- Unit tests for components
- Integration tests for workflows
- E2E tests for user journeys
- Performance tests

**Test Commands:**
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Deployment

### Build Process

**Production Build:**
```bash
npm run build:dashboard
```

**Build Output:**
- Optimized JavaScript bundles
- Minified CSS
- Compressed assets
- Source maps (optional)

### Deployment Options

**Static Hosting:**
- Netlify
- Vercel
- GitHub Pages
- AWS S3 + CloudFront

**Server Deployment:**
- Node.js server
- Docker container
- Kubernetes cluster
- Traditional hosting

### Environment Configuration

**Environment Variables:**
```bash
REACT_APP_API_URL=http://localhost:3002
REACT_APP_DISCORD_CLIENT_ID=your_client_id
REACT_APP_ENVIRONMENT=production
```

## Troubleshooting

### Common Issues

**Dashboard won't load:**
- Check API server connectivity
- Verify CORS configuration
- Check browser console for errors
- Ensure proper authentication

**Plugin editor issues:**
- Clear browser cache
- Check for JavaScript errors
- Verify plugin data format
- Test with simple plugins

**Authentication problems:**
- Verify Discord OAuth configuration
- Check session cookies
- Clear browser data
- Review server logs

### Debug Mode

Enable debug mode for detailed logging:
```bash
REACT_APP_DEBUG=true npm run dev:dashboard
```

### Support

For additional support:
- Check the GitHub issues
- Review the documentation
- Contact the development team
- Join the Discord community
