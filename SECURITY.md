# Security Policy

## Overview

DisModular.js is a professional modular Discord bot framework with visual node-based plugin creation. We take security seriously and are committed to protecting our users and their data.

## Supported Versions

We provide security updates for the following versions:

| Version | Supported          | End of Life |
| ------- | ------------------ | ----------- |
| 0.0.x   | :white_check_mark: | TBD         |
| < 0.0   | :x:                | N/A         |

**Note**: As we are currently in pre-release (0.0.x), all versions receive security updates. Once we reach 1.0.0, we will follow semantic versioning for security support.

## Security Features

### Authentication & Authorization
- **Discord OAuth 2.0**: Secure authentication through Discord's OAuth system
- **Role-based Access Control**: Admin and user roles with appropriate permissions
- **Session Management**: Secure session handling with configurable timeouts
- **Rate Limiting**: Built-in rate limiting to prevent abuse

### Data Protection
- **Database Security**: Uses Prisma ORM with parameterized queries to prevent SQL injection
- **Environment Variables**: Sensitive configuration stored in environment variables
- **Secure Cookies**: HTTP-only, secure cookies for session management
- **Input Validation**: Comprehensive input validation and sanitization

### Plugin Security
- **Sandboxed Execution**: Plugin code runs in a controlled sandbox environment
- **Code Compilation**: Plugins are compiled and validated before execution
- **Permission System**: Granular permissions for plugin operations
- **Template System**: Secure template plugin system with validation

## Reporting a Vulnerability

### How to Report

If you discover a security vulnerability in DisModular.js, please report it responsibly:

1. **DO NOT** create a public GitHub issue
2. **DO NOT** discuss the vulnerability publicly until it's been addressed
3. **DO** report it privately using one of the methods below:

#### Preferred Method: GitHub Security Advisories
1. Go to the [Security tab](https://github.com/fkndean/DisModular.js/security) on our GitHub repository
2. Click "Report a vulnerability"
3. Fill out the security advisory form with details about the vulnerability

#### Alternative Method: Direct Contact
- **Email**: security@dismodular.js (if available)
- **Discord**: Contact `fkndean_` directly via Discord

### What to Include

Please include the following information in your report:

- **Description**: Clear description of the vulnerability
- **Steps to Reproduce**: Detailed steps to reproduce the issue
- **Impact**: Potential impact and severity assessment
- **Affected Versions**: Which versions are affected
- **Suggested Fix**: If you have ideas for fixing the issue
- **Your Contact Information**: How we can reach you for follow-up

### Response Timeline

- **Initial Response**: Within 48 hours of receiving your report
- **Status Updates**: Weekly updates on progress
- **Resolution**: We aim to resolve critical vulnerabilities within 7 days, high severity within 30 days
- **Public Disclosure**: Coordinated disclosure after fixes are deployed

### Vulnerability Severity Levels

We use the following severity levels:

| Severity | Description | Response Time |
|----------|-------------|---------------|
| **Critical** | Remote code execution, authentication bypass, data breach | 24-48 hours |
| **High** | Privilege escalation, data exposure, DoS | 1-7 days |
| **Medium** | Information disclosure, limited DoS | 1-4 weeks |
| **Low** | Minor security improvements, best practices | Next release |

## Security Best Practices

### For Users

1. **Keep Updated**: Always use the latest version of DisModular.js
2. **Secure Configuration**: Use strong, unique passwords and secure environment variables
3. **Database Security**: Ensure your database is properly secured and accessible only to authorized users
4. **Network Security**: Use HTTPS in production and secure your server infrastructure
5. **Plugin Management**: Only install plugins from trusted sources
6. **Access Control**: Regularly review and audit user permissions

### For Developers

1. **Code Review**: All code changes undergo security review
2. **Dependency Management**: Regular updates of dependencies with security patches
3. **Testing**: Comprehensive security testing including penetration testing
4. **Documentation**: Security considerations documented in code and architecture
5. **Monitoring**: Security monitoring and logging for production deployments

## Security Considerations

### Known Limitations

- **Plugin Sandboxing**: While we implement sandboxing, malicious plugins could potentially impact the bot's performance
- **Database Access**: Plugins with database access permissions can potentially access sensitive data
- **External APIs**: Plugins that make external API calls could expose sensitive information

### Security Recommendations

1. **Production Deployment**:
   - Use HTTPS for all web interfaces
   - Implement proper firewall rules
   - Regular security audits and penetration testing
   - Monitor logs for suspicious activity

2. **Plugin Development**:
   - Follow secure coding practices
   - Validate all inputs
   - Use least privilege principle
   - Regular security reviews of plugin code

3. **Database Security**:
   - Use strong authentication
   - Implement proper access controls
   - Regular backups with encryption
   - Monitor database access logs

## Security Updates

Security updates are released as:
- **Patch releases** (0.0.x) for critical vulnerabilities
- **Minor releases** (0.x.0) for significant security improvements
- **Major releases** (x.0.0) for architectural security changes

## Contact Information

- **Project Maintainer**: fkndean_
- **License**: MIT License
- **Repository**: https://github.com/fkndean/DisModular.js

## Acknowledgments

We appreciate the security research community and encourage responsible disclosure. Security researchers who report vulnerabilities will be acknowledged (with permission) in our security advisories.

---

**Last Updated**: October 20, 2025  
**Version**: 0.0.3