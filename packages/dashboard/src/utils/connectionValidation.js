/**
 * Connection Validation Utilities
 * Validates node connections and provides feedback
 * @author fkndean_
 * @date 2025-10-15
 */

/**
 * Valid connection rules between node types
 */
const CONNECTION_RULES = {
  trigger: {
    canConnectTo: ['variable', 'condition', 'action', 'response'],
    description: 'Entry point - can connect to processing nodes'
  },
  variable: {
    canConnectTo: ['variable', 'condition', 'action', 'response', 'math_operation', 'string_operation', 'array_operation'],
    description: 'Data storage - can connect to processing and output nodes'
  },
  condition: {
    canConnectTo: ['action', 'response', 'variable', 'condition'],
    description: 'Logic branching - can connect to different paths'
  },
  action: {
    canConnectTo: ['action', 'response', 'variable'],
    description: 'Processing step - can connect to next actions or outputs'
  },
  response: {
    canConnectTo: [],
    description: 'Exit point - cannot connect to other nodes'
  },
  math_operation: {
    canConnectTo: ['variable', 'condition', 'action', 'response'],
    description: 'Mathematical processing - can connect to outputs'
  },
  string_operation: {
    canConnectTo: ['variable', 'condition', 'action', 'response'],
    description: 'String processing - can connect to outputs'
  },
  array_operation: {
    canConnectTo: ['variable', 'condition', 'action', 'response'],
    description: 'Array processing - can connect to outputs'
  },
  object_operation: {
    canConnectTo: ['variable', 'condition', 'action', 'response'],
    description: 'Object processing - can connect to outputs'
  },
  http_request: {
    canConnectTo: ['variable', 'condition', 'action', 'response'],
    description: 'HTTP request - can connect to outputs'
  },
  embed_builder: {
    canConnectTo: ['embed_response', 'discord_action'],
    description: 'Embed creation - can connect to embed outputs'
  },
  embed_response: {
    canConnectTo: ['discord_action', 'action', 'response'],
    description: 'Embed output - can connect to Discord actions and responses'
  },
  discord_action: {
    canConnectTo: ['action', 'response'],
    description: 'Discord action - can connect to next actions or outputs'
  },
  permission: {
    canConnectTo: ['action', 'response', 'condition'],
    description: 'Permission check - can connect to allowed/denied paths'
  },
  database: {
    canConnectTo: ['variable', 'condition', 'action', 'response'],
    description: 'Database operation - can connect to outputs'
  },
  json: {
    canConnectTo: ['variable', 'condition', 'action', 'response'],
    description: 'JSON processing - can connect to outputs'
  },
  for_loop: {
    canConnectTo: ['action', 'variable', 'condition'],
    description: 'Loop control - can connect to loop body'
  },
  while_loop: {
    canConnectTo: ['action', 'variable', 'condition'],
    description: 'Loop control - can connect to loop body'
  },
  comparison: {
    canConnectTo: ['condition', 'action', 'response'],
    description: 'Comparison result - can connect to logic nodes'
  }
};

/**
 * Check if two node types can be connected
 * @param {string} sourceType - Source node type
 * @param {string} targetType - Target node type
 * @param {string} sourceHandle - Source handle (for condition nodes)
 * @returns {Object} - Validation result
 */
export const validateConnection = (sourceType, targetType, sourceHandle = null) => {
  const sourceRule = CONNECTION_RULES[sourceType];
  const targetRule = CONNECTION_RULES[targetType];

  if (!sourceRule) {
    return {
      valid: false,
      message: `Unknown source node type: ${sourceType}`,
      severity: 'error'
    };
  }

  if (!targetRule) {
    return {
      valid: false,
      message: `Unknown target node type: ${targetType}`,
      severity: 'error'
    };
  }

  // Check if source can connect to target
  if (!sourceRule.canConnectTo.includes(targetType)) {
    return {
      valid: false,
      message: `Cannot connect ${sourceType} to ${targetType}. ${sourceRule.description}`,
      severity: 'warning'
    };
  }

  // Special validation for condition nodes
  if (sourceType === 'condition' && sourceHandle) {
    if (sourceHandle === 'true' && targetType === 'response') {
      return {
        valid: true,
        message: 'Valid true path connection',
        severity: 'info'
      };
    }
    if (sourceHandle === 'false' && targetType === 'response') {
      return {
        valid: true,
        message: 'Valid false path connection',
        severity: 'info'
      };
    }
  }

  // Check for circular dependencies
  if (sourceType === targetType && sourceType === 'variable') {
    return {
      valid: false,
      message: 'Circular variable connections are not recommended',
      severity: 'warning'
    };
  }

  return {
    valid: true,
    message: `Valid connection: ${sourceRule.description}`,
    severity: 'success'
  };
};

/**
 * Get connection suggestions for a node type
 * @param {string} nodeType - Node type to get suggestions for
 * @returns {Array} - Array of suggested connections
 */
export const getConnectionSuggestions = (nodeType) => {
  const rule = CONNECTION_RULES[nodeType];
  if (!rule) return [];

  return rule.canConnectTo.map(targetType => ({
    targetType,
    description: CONNECTION_RULES[targetType]?.description || 'Unknown node type'
  }));
};

/**
 * Validate entire graph for common issues
 * @param {Array} nodes - Array of node objects
 * @param {Array} edges - Array of edge objects
 * @returns {Array} - Array of validation issues
 */
export const validateGraph = (nodes, edges) => {
  const issues = [];

  // Check for orphaned nodes
  const connectedNodes = new Set();
  edges.forEach(edge => {
    connectedNodes.add(edge.source);
    connectedNodes.add(edge.target);
  });

  nodes.forEach(node => {
    if (!connectedNodes.has(node.id) && node.type !== 'trigger') {
      issues.push({
        type: 'orphaned',
        nodeId: node.id,
        message: `Node "${node.data?.label || node.id}" is not connected to the graph`,
        severity: 'warning'
      });
    }
  });

  // Check for multiple triggers
  const triggerNodes = nodes.filter(node => node.type === 'trigger');
  if (triggerNodes.length > 1) {
    issues.push({
      type: 'multiple_triggers',
      message: 'Multiple trigger nodes found. Only one trigger per plugin is recommended',
      severity: 'warning'
    });
  }

  // Check for missing triggers
  if (triggerNodes.length === 0) {
    issues.push({
      type: 'no_trigger',
      message: 'No trigger node found. Plugin needs at least one entry point',
      severity: 'error'
    });
  }

  // Check for unreachable nodes
  const reachableNodes = new Set();
  const triggerNode = triggerNodes[0];
  if (triggerNode) {
    const traverse = (nodeId) => {
      reachableNodes.add(nodeId);
      edges
        .filter(edge => edge.source === nodeId)
        .forEach(edge => {
          if (!reachableNodes.has(edge.target)) {
            traverse(edge.target);
          }
        });
    };
    traverse(triggerNode.id);
  }

  nodes.forEach(node => {
    if (!reachableNodes.has(node.id) && node.type !== 'trigger') {
      issues.push({
        type: 'unreachable',
        nodeId: node.id,
        message: `Node "${node.data?.label || node.id}" is not reachable from trigger`,
        severity: 'warning'
      });
    }
  });

  // Check for cycles
  const visited = new Set();
  const recursionStack = new Set();
  
  const hasCycle = (nodeId) => {
    visited.add(nodeId);
    recursionStack.add(nodeId);
    
    const outgoingEdges = edges.filter(edge => edge.source === nodeId);
    for (const edge of outgoingEdges) {
      if (!visited.has(edge.target)) {
        if (hasCycle(edge.target)) return true;
      } else if (recursionStack.has(edge.target)) {
        return true;
      }
    }
    
    recursionStack.delete(nodeId);
    return false;
  };

  nodes.forEach(node => {
    if (!visited.has(node.id)) {
      if (hasCycle(node.id)) {
        issues.push({
          type: 'cycle',
          message: 'Circular dependency detected in the graph',
          severity: 'error'
        });
      }
    }
  });

  return issues;
};

/**
 * Get node type display name
 * @param {string} nodeType - Node type
 * @returns {string} - Display name
 */
export const getNodeTypeDisplayName = (nodeType) => {
  const displayNames = {
    trigger: 'Trigger',
    variable: 'Variable',
    condition: 'Condition',
    action: 'Action',
    response: 'Response',
    math_operation: 'Math Operation',
    string_operation: 'String Operation',
    array_operation: 'Array Operation',
    object_operation: 'Object Operation',
    http_request: 'HTTP Request',
    embed_builder: 'Embed Builder',
    embed_response: 'Embed Response',
    discord_action: 'Discord Action',
    permission: 'Permission',
    database: 'Database',
    json: 'JSON',
    for_loop: 'For Loop',
    while_loop: 'While Loop',
    comparison: 'Comparison'
  };
  
  return displayNames[nodeType] || nodeType;
};
