/**
 * Logger Utility - Simple logging with levels and colors
 * @author fkndean_
 * @date 2025-10-18
 */

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
    console.log(`[INFO] [${this.name}] ${new Date().toISOString()} - ${message}`, ...args);
  }

  success(message, ...args) {
    console.log(`[SUCCESS] [${this.name}] ${new Date().toISOString()} - ${message}`, ...args);
  }

  warn(message, ...args) {
    // Suppress warnings during tests unless they're critical
    if (this.isTestMode && this.isExpectedTestWarning(message)) {
      return;
    }
    console.warn(`[WARN] [${this.name}] ${new Date().toISOString()} - ${message}`, ...args);
  }

  error(message, ...args) {
    console.error(`[ERROR] [${this.name}] ${new Date().toISOString()} - ${message}`, ...args);
  }

  debug(message, ...args) {
    if (process.env.NODE_ENV === 'development' || process.env.DEBUG) {
      console.debug(`[DEBUG] [${this.name}] ${new Date().toISOString()} - ${message}`, ...args);
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