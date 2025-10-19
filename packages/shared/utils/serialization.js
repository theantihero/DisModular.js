/**
 * Serialization Utilities - Handles circular references and complex object serialization
 * @author fkndean_
 * @date 2025-01-27
 */

import { Logger } from './logger.js';

const logger = new Logger('Serialization');

/**
 * Safe JSON stringify with circular reference handling
 * @param {any} obj - Object to serialize
 * @param {Object} options - Serialization options
 * @param {number} options.maxDepth - Maximum depth to traverse (default: 10)
 * @param {boolean} options.includeCircularRefs - Whether to include circular reference markers (default: true)
 * @param {string} options.circularRefMarker - Marker for circular references (default: '[Circular Reference]')
 * @returns {string} Serialized JSON string
 */
export function safeStringify(obj, options = {}) {
  const {
    maxDepth = 10,
    includeCircularRefs = true,
    circularRefMarker = '[Circular Reference]'
  } = options;

  const seen = new WeakSet();

  function serialize(value, depth = 0) {
    try {
      // Handle null/undefined
      if (value === null || value === undefined) {
        return value;
      }

      // Check depth limit
      if (depth > maxDepth) {
        logger.warn(`Max depth ${maxDepth} reached`);
        return '[Max Depth Reached]';
      }

      // Handle functions first (before primitive type check)
      if (typeof value === 'function') {
        logger.warn(`Function found, replacing with null`);
        return null;
      }

      // Handle DOM elements and other browser-specific objects
      if (typeof value === 'object' && value !== null) {
        if (value.nodeType !== undefined || value.tagName !== undefined) {
          logger.warn(`DOM element found, replacing with null`);
          return null;
        }
        
        // Handle Event objects
        if (value.type !== undefined && value.target !== undefined && value.preventDefault !== undefined) {
          logger.warn(`Event object found, replacing with null`);
          return null;
        }
        
        // Handle WebSocket and other complex objects
        if (value.readyState !== undefined || value.url !== undefined) {
          logger.warn(`WebSocket or similar object found, replacing with null`);
          return null;
        }
      }

      // Handle primitive types
      if (typeof value !== 'object') {
        return value;
      }

      // Handle special object types
      if (value instanceof Date) {
        return value.toISOString();
      }

      if (value instanceof RegExp) {
        return {
          source: value.source,
          flags: value.flags
        };
      }

      if (value instanceof Error) {
        return {
          message: value.message,
          name: value.name
        };
      }

      if (value instanceof Map) {
        return Object.fromEntries(value);
      }

      if (value instanceof Set) {
        return Array.from(value);
      }

      if (value instanceof Promise) {
        logger.warn(`Promise found, replacing with null`);
        return null;
      }

      // Handle Discord.js objects specifically (but not standard objects like Error, Date, etc.)
      if (value.constructor && value.constructor.name && 
          !(value instanceof Error) && 
          !(value instanceof Date) && 
          !(value instanceof RegExp) && 
          !(value instanceof Map) && 
          !(value instanceof Set)) {
        const constructorName = value.constructor.name;
        if (constructorName.includes('Client') || 
            constructorName.includes('Guild') || 
            constructorName.includes('Channel') || 
            constructorName.includes('User') || 
            constructorName.includes('Message') || 
            constructorName.includes('Interaction') ||
            constructorName.includes('Collection') ||
            constructorName.includes('Manager')) {
          logger.warn(`Discord.js object (${constructorName}) found, replacing with null`);
          return null;
        }
      }

      // Handle Symbol objects
      if (typeof value === 'symbol') {
        return value.toString();
      }

      // Handle BigInt
      if (typeof value === 'bigint') {
        return value.toString();
      }

      // Check for circular reference
      if (seen.has(value)) {
        if (includeCircularRefs) {
          return circularRefMarker;
        }
        return null;
      }

      // Add to seen set
      seen.add(value);

      // Handle arrays
      if (Array.isArray(value)) {
        return value.map(item => serialize(item, depth + 1));
      }

      // Handle plain objects
      const result = {};
      for (const [key, val] of Object.entries(value)) {
        try {
          result[key] = serialize(val, depth + 1);
        } catch (keyError) {
          logger.warn(`Error serializing key ${key}:`, keyError);
          result[key] = null;
        }
      }
      
      return result;
    } catch (error) {
      logger.error(`Error serializing value at depth ${depth}:`, error);
      return null;
    }
  }

  try {
    const serialized = serialize(obj);
    return JSON.stringify(serialized);
  } catch (error) {
    logger.error('Failed to serialize object:', error);
    return '{}';
  }
}

/**
 * Safe JSON parse with error handling
 * @param {string} str - JSON string to parse
 * @param {any} defaultValue - Default value if parsing fails
 * @returns {any} Parsed object or default value
 */
export function safeParse(str, defaultValue = null) {
  try {
    return JSON.parse(str);
  } catch (error) {
    logger.error('Failed to parse JSON string:', error);
    return defaultValue;
  }
}

/**
 * Deep clone with circular reference handling
 * @param {any} obj - Object to clone
 * @param {Object} options - Cloning options
 * @param {number} options.maxDepth - Maximum depth to traverse (default: 10)
 * @returns {any} Cloned object
 */
export function safeClone(obj, options = {}) {
  const { maxDepth = 10 } = options;
  
  if (obj === null || obj === undefined) {
    return obj;
  }

  const seen = new WeakMap();

  function cloneValue(value, depth) {
    try {
      // Check depth limit
      if (depth > maxDepth) {
        logger.warn(`Max depth ${maxDepth} reached during cloning`);
        return '[Max Depth Reached]';
      }

      // Handle primitive types
      if (typeof value !== 'object' || value === null) {
        return value;
      }

      // Check for circular reference
      if (seen.has(value)) {
        return '[Circular Reference]';
      }

      // Handle special object types
      if (value instanceof Date) {
        return new Date(value.getTime());
      }

      if (value instanceof RegExp) {
        return new RegExp(value.source, value.flags);
      }

      if (value instanceof Error) {
        const clonedError = new Error(value.message);
        clonedError.name = value.name;
        clonedError.stack = value.stack;
        return clonedError;
      }

      if (value instanceof Map) {
        const clonedMap = new Map();
        seen.set(value, clonedMap);
        for (const [k, v] of value.entries()) {
          clonedMap.set(cloneValue(k, depth + 1), cloneValue(v, depth + 1));
        }
        return clonedMap;
      }

      if (value instanceof Set) {
        const clonedSet = new Set();
        seen.set(value, clonedSet);
        for (const v of value) {
          clonedSet.add(cloneValue(v, depth + 1));
        }
        return clonedSet;
      }

      // Handle Symbol
      if (typeof value === 'symbol') {
        return Symbol(value.description);
      }

      // Handle BigInt
      if (typeof value === 'bigint') {
        return BigInt(value.toString());
      }

      // Handle arrays
      if (Array.isArray(value)) {
        const clonedArray = [];
        seen.set(value, clonedArray);
        for (let i = 0; i < value.length; i++) {
          clonedArray[i] = cloneValue(value[i], depth + 1);
        }
        return clonedArray;
      }

      // Handle plain objects
      const clonedObj = {};
      seen.set(value, clonedObj);
      
      for (const [key, val] of Object.entries(value)) {
        try {
          clonedObj[key] = cloneValue(val, depth + 1);
        } catch (keyError) {
          logger.warn(`Error cloning key ${key}:`, keyError);
          clonedObj[key] = null;
        }
      }
      
      return clonedObj;
    } catch (error) {
      logger.error(`Error cloning value at depth ${depth}:`, error);
      return null;
    }
  }

  return cloneValue(obj, 0);
}

/**
 * Serialize state object with circular reference handling
 * @param {any} state - State object to serialize
 * @param {Object} options - Serialization options
 * @returns {Object} Serialized state object
 */
export function serializeState(state, options = {}) {
  try {
    // Handle null/undefined input
    if (state === null || state === undefined) {
      return {};
    }

    // Use safeStringify and then parse to get the serialized object
    const serializedString = safeStringify(state, options);
    return JSON.parse(serializedString);
  } catch (error) {
    logger.error('Failed to serialize state:', error);
    return {};
  }
}

/**
 * Validate if an object can be safely serialized
 * @param {any} obj - Object to validate
 * @param {Object} options - Validation options
 * @returns {Object} Validation result with details
 */
export function validateSerialization(obj, options = {}) {
  const {
    maxDepth = 10,
    includeCircularRefs = true
  } = options;

  const seen = new WeakSet();
  const issues = [];

  function validate(value, depth = 0, path = '') {
    try {
      // Check depth limit
      if (depth > maxDepth) {
        issues.push({
          type: 'max_depth',
          path,
          message: `Max depth ${maxDepth} reached`
        });
        return;
      }

      // Handle null/undefined
      if (value === null || value === undefined) {
        return;
      }

      // Check for functions
      if (typeof value === 'function') {
        issues.push({
          type: 'function',
          path,
          message: 'Function found - will be replaced with null'
        });
        return;
      }

      // Check for promises
      if (value instanceof Promise) {
        issues.push({
          type: 'promise',
          path,
          message: 'Promise found - will be replaced with null'
        });
        return;
      }

      // Handle primitive types
      if (typeof value !== 'object') {
        return;
      }

      // Check for circular reference
      if (seen.has(value)) {
        if (includeCircularRefs) {
          issues.push({
            type: 'circular_reference',
            path,
            message: 'Circular reference detected - will be replaced with marker'
          });
        } else {
          issues.push({
            type: 'circular_reference',
            path,
            message: 'Circular reference detected - will be replaced with null'
          });
        }
        return;
      }

      // Add to seen set
      seen.add(value);

      // Handle arrays
      if (Array.isArray(value)) {
        for (let i = 0; i < value.length; i++) {
          validate(value[i], depth + 1, `${path}[${i}]`);
        }
        return;
      }

      // Handle plain objects
      for (const [key, val] of Object.entries(value)) {
        validate(val, depth + 1, path ? `${path}.${key}` : key);
      }
    } catch (error) {
      issues.push({
        type: 'error',
        path,
        message: `Validation error: ${error.message}`
      });
    }
  }

  validate(obj);

  return {
    valid: issues.length === 0,
    issues,
    summary: {
      total: issues.length,
      functions: issues.filter(i => i.type === 'function').length,
      promises: issues.filter(i => i.type === 'promise').length,
      circularReferences: issues.filter(i => i.type === 'circular_reference').length,
      errors: issues.filter(i => i.type === 'error').length,
      maxDepth: issues.filter(i => i.type === 'max_depth').length
    }
  };
}

export default {
  safeStringify,
  safeParse,
  safeClone,
  serializeState,
  validateSerialization
};