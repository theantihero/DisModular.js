# Contributing to DisModular.js

First off, thank you for considering contributing to DisModular.js! 🎉

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Coding Guidelines](#coding-guidelines)
- [Pull Request Process](#pull-request-process)

## Code of Conduct

This project and everyone participating in it is governed by a code of conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues. When creating a bug report, include as many details as possible:

- Use a clear and descriptive title
- Describe the exact steps to reproduce the problem
- Provide specific examples
- Describe the behavior you observed and what you expected
- Include screenshots if applicable
- Include your environment details (Node version, OS, etc.)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

- Use a clear and descriptive title
- Provide a detailed description of the suggested enhancement
- Explain why this enhancement would be useful
- List any potential implementation details if you have ideas

### Creating Plugins

One of the best ways to contribute is by creating and sharing plugin examples:

1. Create a new plugin using the visual editor
2. Test it thoroughly
3. Export the workflow as JSON
4. Submit it as a pull request to `plugins/community/`
5. Include a README explaining what the plugin does

## Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/YOUR_USERNAME/dismodular.js.git
   cd dismodular.js
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Set Up Environment**
   ```bash
   cp env.example .env
   # Edit .env with your test bot credentials
   ```

4. **Set Up Database**
   ```bash
   npm run setup:db
   ```

5. **Start Development**
   ```bash
   npm run dev
   ```

## Coding Guidelines

### JavaScript/Node.js Style

- Use ES6+ features (const/let, arrow functions, async/await)
- Use meaningful variable and function names
- Add JSDoc comments for functions and classes
- Use 2 spaces for indentation
- Use single quotes for strings
- Add semicolons

### File Organization

- Follow the existing package structure
- Keep files focused and single-purpose
- Use index.js for exports
- Place tests next to source files

### React/Frontend

- Use functional components with hooks
- Follow the MVVM pattern (ViewModels for state)
- Use Tailwind CSS for styling
- Keep components small and focused
- Use proper prop-types or TypeScript types

### Commit Messages

Follow conventional commits format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Examples:
```
feat(dashboard): add analytics page with real-time metrics
fix(sandbox): resolve function cloning error in executor
docs(readme): update installation instructions
```

### Testing

- Write tests for new features
- Ensure existing tests pass
- Test plugins in both slash and message command modes
- Test on multiple Discord servers if possible

## Pull Request Process

1. **Create a Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Your Changes**
   - Follow the coding guidelines
   - Add tests if applicable
   - Update documentation

3. **Test Thoroughly**
   - Run `npm test`
   - Test in development environment
   - Verify no errors in console

4. **Commit Your Changes**
   - Use conventional commit format
   - Keep commits focused and atomic

5. **Push and Create PR**
   ```bash
   git push origin feature/your-feature-name
   ```
   - Go to GitHub and create a Pull Request
   - Fill in the PR template
   - Link related issues

6. **Code Review**
   - Respond to review comments
   - Make requested changes
   - Keep the conversation constructive

7. **Merge**
   - Maintainers will merge once approved
   - Your contribution will be in the next release!

## Project Structure

```
packages/
├── bot/           # Discord bot core
│   ├── src/
│   │   ├── core/        # BotClient and event handlers
│   │   ├── models/      # Database models
│   │   ├── plugins/     # Plugin loader and manager
│   │   └── sandbox/     # Sandboxed execution
│   └── tests/
├── api/           # Express API server
│   ├── src/
│   │   ├── controllers/ # Request handlers
│   │   ├── middleware/  # Auth and validation
│   │   ├── models/      # Database models
│   │   ├── routes/      # API routes
│   │   └── services/    # Business logic
│   └── scripts/         # Database setup scripts
├── dashboard/     # React frontend
│   └── src/
│       ├── components/  # Reusable components
│       ├── pages/       # Page components
│       ├── viewmodels/  # State management
│       └── views/       # Node components
└── shared/        # Shared utilities
    └── utils/     # Logger, helpers
```

## Development Workflow

### Adding a New Node Type

1. Create node component in `packages/dashboard/src/views/nodes/`
2. Add to `packages/dashboard/src/views/nodes/index.js`
3. Add to node palette in `packages/dashboard/src/pages/PluginEditor.jsx`
4. Add compiler logic in `packages/api/src/services/NodeCompiler.js`
5. Test in the visual editor
6. Document in README

### Adding an API Endpoint

1. Create route in appropriate file in `packages/api/src/routes/`
2. Add middleware (auth, validation)
3. Implement controller logic
4. Add to API service in `packages/dashboard/src/services/api.js`
5. Test the endpoint
6. Document the endpoint

### Adding a Dashboard Page

1. Create page component in `packages/dashboard/src/pages/`
2. Add route in `packages/dashboard/src/App.jsx`
3. Add navigation link where appropriate
4. Implement with responsive design
5. Add toast notifications for user feedback
6. Test on mobile and desktop

## Questions?

Feel free to open an issue for:
- Questions about the codebase
- Implementation guidance
- Feature discussions
- Architecture decisions

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing! 🚀

