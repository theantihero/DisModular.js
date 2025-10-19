/**
 * Logger Utility - Simple logging with levels and colors
 * @author fkndean_
 * @date 2025-10-18
 */

/**
 * Sanitize log message to prevent log injection attacks
 * @param {*} message - Message to sanitize (can be string, object, array, etc.)
 * @returns {string} Sanitized message
 */
function sanitizeLogMessage(message) {
  if (typeof message === 'string') {
    // Remove newlines and control characters that could be used to forge log entries
    return message
      .replace(/[\r\n\t]/g, ' ') // Replace newlines and tabs with spaces
      .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // Remove control characters
      .trim()
      .substring(0, 1000); // Limit message length to prevent log flooding
  }
  
  if (typeof message === 'object' && message !== null) {
    try {
      // For objects and arrays, stringify and sanitize
      const jsonString = JSON.stringify(message);
      return jsonString
        .replace(/[\r\n\t]/g, ' ') // Replace newlines and tabs with spaces
        .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // Remove control characters
        .substring(0, 1000); // Limit length
    } catch (error) {
      // If JSON.stringify fails, fall back to string representation
      return String(message).substring(0, 1000);
    }
  }
  
  // For other types (numbers, booleans, etc.), convert to string and sanitize
  return String(message)
    .replace(/[\r\n\t]/g, ' ')
    .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
    .substring(0, 1000);
}

export class Logger {
  constructor(name) {
    this.name = name;
    this.isTestMode = this.detectTestMode();
  }

  /**
   * Detect if we're running in test mode
   * @returns {boolean} True if in test mode
   */
  detectTestMode() {
    return process.env.NODE_ENV === 'test' || 
           process.argv.some(arg => arg.includes('--test') || arg.includes('test') || arg.includes('vitest')) ||
           typeof global !== 'undefined' && global.testConfig;
  }

  info(message, ...args) {
    const sanitizedMessage = sanitizeLogMessage(message);
    const sanitizedArgs = args.map(arg => sanitizeLogMessage(arg));
    console.log(`[INFO] [${this.name}] ${new Date().toISOString()} - ${sanitizedMessage}`, ...sanitizedArgs);
  }

  success(message, ...args) {
    const sanitizedMessage = sanitizeLogMessage(message);
    const sanitizedArgs = args.map(arg => sanitizeLogMessage(arg));
    console.log(`[SUCCESS] [${this.name}] ${new Date().toISOString()} - ${sanitizedMessage}`, ...sanitizedArgs);
  }

  warn(message, ...args) {
    // Suppress warnings during tests unless they're critical
    if (this.isTestMode && this.isExpectedTestWarning(message)) {
      return;
    }
    const sanitizedMessage = sanitizeLogMessage(message);
    const sanitizedArgs = args.map(arg => sanitizeLogMessage(arg));
    console.warn(`[WARN] [${this.name}] ${new Date().toISOString()} - ${sanitizedMessage}`, ...sanitizedArgs);
  }

  error(message, ...args) {
    const sanitizedMessage = sanitizeLogMessage(message);
    const sanitizedArgs = args.map(arg => sanitizeLogMessage(arg));
    console.error(`[ERROR] [${this.name}] ${new Date().toISOString()} - ${sanitizedMessage}`, ...sanitizedArgs);
  }

  debug(message, ...args) {
    if (process.env.NODE_ENV === 'development' || process.env.DEBUG) {
      const sanitizedMessage = sanitizeLogMessage(message);
      const sanitizedArgs = args.map(arg => sanitizeLogMessage(arg));
      console.debug(`[DEBUG] [${this.name}] ${new Date().toISOString()} - ${sanitizedMessage}`, ...sanitizedArgs);
    }
  }

  /**
   * Check if a warning message is expected during tests and should be suppressed
   * @param {string} message - Warning message
   * @returns {boolean} True if this is an expected test warning
   */
  isExpectedTestWarning(message) {
    const expectedWarnings = [
      'Function found, replacing with null',
      'Promise found, replacing with null',
      'Circular reference detected - will be replaced with marker',
      'Max depth',
      'State validation found issues',
      'Serialization issue at',
    ];
    
    return expectedWarnings.some(pattern => message.includes(pattern));
  }
}

export default Logger;