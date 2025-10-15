/**
 * Node Analyzer Utility
 * Analyzes node graphs to extract available variables and determine scope
 * @author fkndean_
 * @date 2025-10-14
 */

/**
 * Extract all available variables from nodes connected before the target node
 * @param {string} targetNodeId - ID of the target node
 * @param {Array} allNodes - All nodes in the graph
 * @param {Array} allEdges - All edges in the graph
 * @returns {Array} Array of available variables with metadata
 */
export function getAvailableVariables(targetNodeId, allNodes, allEdges) {
  const availableVars = [];
  const visited = new Set();
  
  // Build a reverse graph (from target to sources)
  const reverseGraph = new Map();
  for (const edge of allEdges) {
    if (!reverseGraph.has(edge.target)) {
      reverseGraph.set(edge.target, []);
    }
    reverseGraph.get(edge.target).push(edge.source);
  }
  
  // Traverse backwards from target node
  function traverse(nodeId) {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);
    
    const node = allNodes.find(n => n.id === nodeId);
    if (!node) return;
    
    // Extract variables from this node based on type
    const vars = extractVariablesFromNode(node);
    availableVars.push(...vars);
    
    // Continue traversing
    const sources = reverseGraph.get(nodeId) || [];
    for (const sourceId of sources) {
      traverse(sourceId);
    }
  }
  
  traverse(targetNodeId);
  
  // Remove duplicates and sort by name
  const uniqueVars = Array.from(
    new Map(availableVars.map(v => [v.name, v])).values()
  );
  
  return uniqueVars.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Extract variable names from a single node based on its type
 * @param {Object} node - Node to analyze
 * @returns {Array} Array of variable definitions
 */
function extractVariablesFromNode(node) {
  const vars = [];
  const config = node.data?.config || {};
  
  switch (node.type) {
    case 'variable':
      if (config.name) {
        vars.push({
          name: config.name,
          type: config.type || 'string',
          source: 'Variable Node',
          nodeId: node.id,
          nodeLabel: node.data?.label || 'Variable'
        });
      }
      break;
      
    case 'data':
      if (config.name) {
        vars.push({
          name: config.name,
          type: config.dataType || 'data',
          source: 'Data Node',
          nodeId: node.id,
          nodeLabel: node.data?.label || 'Data'
        });
      }
      break;
      
    case 'http_request':
      if (config.responseVar) {
        vars.push({
          name: config.responseVar,
          type: 'http_response',
          source: 'HTTP Request',
          nodeId: node.id,
          nodeLabel: node.data?.label || 'HTTP Request'
        });
        vars.push({
          name: `${config.responseVar}_status`,
          type: 'number',
          source: 'HTTP Request',
          nodeId: node.id,
          nodeLabel: node.data?.label || 'HTTP Request'
        });
        vars.push({
          name: `${config.responseVar}_error`,
          type: 'string',
          source: 'HTTP Request',
          nodeId: node.id,
          nodeLabel: node.data?.label || 'HTTP Request'
        });
      }
      break;
      
    case 'math_operation':
      if (config.resultVar) {
        vars.push({
          name: config.resultVar,
          type: 'number',
          source: 'Math Operation',
          nodeId: node.id,
          nodeLabel: node.data?.label || 'Math'
        });
      }
      break;
      
    case 'string_operation':
      if (config.resultVar) {
        vars.push({
          name: config.resultVar,
          type: 'string',
          source: 'String Operation',
          nodeId: node.id,
          nodeLabel: node.data?.label || 'String'
        });
      }
      break;
      
    case 'array_operation':
      if (config.resultVar || config.outputVar) {
        vars.push({
          name: config.resultVar || config.outputVar,
          type: 'array',
          source: 'Array Operation',
          nodeId: node.id,
          nodeLabel: node.data?.label || 'Array'
        });
      }
      break;
      
    case 'object_operation':
      if (config.outputVar) {
        vars.push({
          name: config.outputVar,
          type: 'object',
          source: 'Object Operation',
          nodeId: node.id,
          nodeLabel: node.data?.label || 'Object'
        });
      }
      break;
      
    case 'database':
      if (config.operation === 'get' && config.resultVar) {
        vars.push({
          name: config.resultVar,
          type: 'database_value',
          source: 'Database',
          nodeId: node.id,
          nodeLabel: node.data?.label || 'Database'
        });
      }
      break;
      
    case 'json':
      if (config.outputVar) {
        const type = config.operation === 'parse' ? 'object' : 'string';
        vars.push({
          name: config.outputVar,
          type: type,
          source: 'JSON',
          nodeId: node.id,
          nodeLabel: node.data?.label || 'JSON'
        });
      }
      break;
      
    case 'embed_builder':
      if (config.embedVar) {
        vars.push({
          name: config.embedVar,
          type: 'embed',
          source: 'Embed Builder',
          nodeId: node.id,
          nodeLabel: node.data?.label || 'Embed'
        });
      }
      break;
      
    case 'for_loop':
      if (config.iteratorVar) {
        vars.push({
          name: config.iteratorVar,
          type: 'loop_item',
          source: 'For Loop',
          nodeId: node.id,
          nodeLabel: node.data?.label || 'For Loop'
        });
      }
      break;
      
    case 'comparison':
    case 'discord_action':
      if (config.outputVar) {
        vars.push({
          name: config.outputVar,
          type: 'boolean',
          source: node.type === 'comparison' ? 'Comparison' : 'Discord Action',
          nodeId: node.id,
          nodeLabel: node.data?.label || node.type
        });
      }
      break;
  }
  
  return vars;
}

/**
 * Get all variable names as a simple array (for autocomplete)
 * @param {string} targetNodeId - ID of the target node
 * @param {Array} allNodes - All nodes in the graph
 * @param {Array} allEdges - All edges in the graph
 * @returns {Array} Array of variable names
 */
export function getVariableNames(targetNodeId, allNodes, allEdges) {
  const vars = getAvailableVariables(targetNodeId, allNodes, allEdges);
  return vars.map(v => v.name);
}

/**
 * Format variable for display in dropdown
 * @param {Object} variable - Variable object
 * @returns {string} Formatted display string
 */
export function formatVariableDisplay(variable) {
  return `${variable.name} (${variable.type} from ${variable.source})`;
}

