# GitHub Workflows for DisModular.js

This directory contains GitHub Actions workflows for automated testing, building, and releasing.

## Workflows

### CI Workflow (`ci.yml`)

**Triggers:** Push to `main` or `develop` branches, Pull Requests

**Jobs:**
1. **Test** - Runs all tests across Node.js 18.x and 20.x
   - Installs dependencies
   - Runs all workspace tests
   - Runs integration tests
   
2. **Build** - Builds the dashboard
   - Builds the React dashboard
   - Uploads build artifacts for review

### Release Workflow (`release.yml`)

**Triggers:** Push of version tags (e.g., `v0.0.1`, `v1.0.0`)

**Jobs:**
1. **Test** - Full test suite on Node.js 18.x
   - All workspace tests
   - Integration tests
   
2. **Build and Release** - Creates GitHub Release with distribution zip
   - Builds dashboard
   - Creates distribution folder with all packages
   - Removes test files and node_modules
   - Creates versioned zip file
   - Generates release notes from CHANGELOG.md
   - Creates GitHub Release with zip attachment

## Creating a Release

To create a new release:

```bash
# Update version in package.json files
npm version patch  # or minor, or major

# Update CHANGELOG.md with new version

# Commit changes
git add .
git commit -m "chore: bump version to v0.0.2"

# Create and push tag
git tag v0.0.2
git push origin main --tags
```

The GitHub Actions workflow will automatically:
- Run all tests
- Build the dashboard
- Create a release zip
- Publish the GitHub Release

## Badges

Add these to your README.md:

```markdown
![CI Status](https://github.com/YOUR_USERNAME/dismodular.js/workflows/CI%20-%20Test%20%26%20Build/badge.svg)
![Release](https://github.com/YOUR_USERNAME/dismodular.js/workflows/Release/badge.svg)
```

## Local Testing

To test the workflows locally, you can use [act](https://github.com/nektos/act):

```bash
# Install act
# Run CI workflow
act -j test

# Run release workflow (requires tag)
act -j build-and-release --secret GITHUB_TOKEN=your_token
```

