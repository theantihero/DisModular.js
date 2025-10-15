/**
 * Logger Utility
 * @author fkndean_
 * @date 2025-10-14
 */

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

/**
 * Creates a formatted timestamp
 * @returns {string} Formatted timestamp
 */
function getTimestamp() {
  return new Date().toISOString();
}

/**
 * Logger class for consistent logging across packages
 */
export class Logger {
  constructor(context = 'App') {
    this.context = context;
  }

  /**
   * Log info message
   * @param {string} message - Message to log
   * @param {...any} args - Additional arguments
   */
  info(message, ...args) {
    console.log(
      `${colors.blue}[INFO]${colors.reset} ${colors.cyan}[${this.context}]${colors.reset} ${getTimestamp()} - ${message}`,
      ...args
    );
  }

  /**
   * Log success message
   * @param {string} message - Message to log
   * @param {...any} args - Additional arguments
   */
  success(message, ...args) {
    console.log(
      `${colors.green}[SUCCESS]${colors.reset} ${colors.cyan}[${this.context}]${colors.reset} ${getTimestamp()} - ${message}`,
      ...args
    );
  }

  /**
   * Log warning message
   * @param {string} message - Message to log
   * @param {...any} args - Additional arguments
   */
  warn(message, ...args) {
    console.warn(
      `${colors.yellow}[WARN]${colors.reset} ${colors.cyan}[${this.context}]${colors.reset} ${getTimestamp()} - ${message}`,
      ...args
    );
  }

  /**
   * Log error message
   * @param {string} message - Message to log
   * @param {...any} args - Additional arguments
   */
  error(message, ...args) {
    console.error(
      `${colors.red}[ERROR]${colors.reset} ${colors.cyan}[${this.context}]${colors.reset} ${getTimestamp()} - ${message}`,
      ...args
    );
  }

  /**
   * Log debug message (only in development)
   * @param {string} message - Message to log
   * @param {...any} args - Additional arguments
   */
  debug(message, ...args) {
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `${colors.magenta}[DEBUG]${colors.reset} ${colors.cyan}[${this.context}]${colors.reset} ${getTimestamp()} - ${message}`,
        ...args
      );
    }
  }
}

export default Logger;

