# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.2] - 2025-10-15

### Changed
- Version bump to 0.0.2

## [Unreleased]

### Added
- Comprehensive test suite with 99+ tests
- Complete CI/CD pipeline with GitHub Actions
- Dependabot configuration for automated dependency updates
- Security scanning with CodeQL, Trivy, and npm audit
- Release automation workflow

### Changed
- Updated all workflows to Node 20.x for better compatibility
- Fixed cache configuration for monorepo structure
- Resolved all test failures and CI issues

### Fixed
- Foreign key constraint errors in integration tests
- Plugin data structure mismatches
- Environment variable loading in CI
- OSSF Scorecard authentication issues

## [0.0.1] - 2025-10-15

### Added
- Initial release of DisModular.js
- Visual node-based Discord bot plugin creation system
- React dashboard for plugin development
- Plugin management system with database persistence
- Sandbox execution environment for plugin safety
- Node compiler for converting visual flows to executable code
- Comprehensive logging system
- Type definitions and shared utilities
- Security validation for plugin code
- Integration test suite

### Features
- **Visual Plugin Creation**: Drag-and-drop interface for building Discord bot plugins
- **Node Types**: Trigger, Action, Condition, Variable, Response, Data nodes
- **Plugin Management**: Enable/disable, reload, and lifecycle management
- **Security**: Code validation and sandbox execution
- **Database**: SQLite-based plugin and state persistence
- **API**: REST API for plugin management
- **Dashboard**: React-based web interface
- **Testing**: Comprehensive test coverage across all packages