/**
 * Plugin Type Definitions
 * @author fkndean_
 * @date 2025-10-14
 */

/**
 * @typedef {Object} PluginMetadata
 * @property {string} id - Unique plugin identifier
 * @property {string} name - Plugin name
 * @property {string} version - Plugin version
 * @property {string} description - Plugin description
 * @property {string} author - Plugin author
 * @property {'slash' | 'text' | 'both'} type - Command type
 * @property {boolean} enabled - Whether plugin is enabled
 * @property {Date} createdAt - Creation timestamp
 * @property {Date} updatedAt - Last update timestamp
 */

/**
 * @typedef {Object} PluginTrigger
 * @property {'command' | 'event' | 'message'} type - Trigger type
 * @property {string} command - Command name (for command triggers)
 * @property {string} event - Event name (for event triggers)
 * @property {string} pattern - Regex pattern (for message triggers)
 */

/**
 * @typedef {Object} NodeData
 * @property {string} type - Node type
 * @property {string} label - Node label
 * @property {Object} config - Node configuration
 */

/**
 * @typedef {Object} FlowNode
 * @property {string} id - Node ID
 * @property {string} type - Node type
 * @property {Object} position - Node position {x, y}
 * @property {NodeData} data - Node data
 */

/**
 * @typedef {Object} FlowEdge
 * @property {string} id - Edge ID
 * @property {string} source - Source node ID
 * @property {string} target - Target node ID
 * @property {string} sourceHandle - Source handle ID
 * @property {string} targetHandle - Target handle ID
 */

/**
 * @typedef {Object} PluginDefinition
 * @property {PluginMetadata} metadata - Plugin metadata
 * @property {PluginTrigger} trigger - Plugin trigger
 * @property {FlowNode[]} nodes - React Flow nodes
 * @property {FlowEdge[]} edges - React Flow edges
 * @property {string} compiled - Compiled JavaScript code
 */

export const PluginTypes = {
  SLASH: 'slash',
  TEXT: 'text',
  BOTH: 'both'
};

export const NodeTypes = {
  TRIGGER: 'trigger',
  ACTION: 'action',
  CONDITION: 'condition',
  VARIABLE: 'variable',
  RESPONSE: 'response',
  DATA: 'data'
};

export const TriggerTypes = {
  COMMAND: 'command',
  EVENT: 'event',
  MESSAGE: 'message'
};

