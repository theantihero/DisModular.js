/**
 * Node Compiler Service
 * Converts React Flow node graphs to executable plugin code
 * @author fkndean_
 * @date 2025-10-14
 */

/* eslint-disable no-case-declarations */

import { Logger } from '@dismodular/shared';

const logger = new Logger('NodeCompiler');

export class NodeCompiler {
  /**
   * Extract command options from variable nodes
   * @param {Array} nodes - React Flow nodes
   * @returns {Array} Discord slash command options
   */
  extractOptions(nodes) {
    const options = [];
    
    // Find all variable nodes with user_input type
    const inputNodes = nodes.filter(node => 
      node.type === 'variable' && 
      node.data?.config?.type === 'user_input',
    );
    
    for (const node of inputNodes) {
      const config = node.data?.config;
      if (config?.name) {
        options.push({
          type: 3, // STRING type
          name: config.name,
          description: config.description || `Enter ${config.name}`,
          required: config.required !== false, // Default to required
        });
      }
    }
    
    return options;
  }

  /**
   * Compile node graph to JavaScript code
   * @param {Array} nodes - React Flow nodes
   * @param {Array} edges - React Flow edges
   * @returns {string} Compiled JavaScript code
   */
  compile(nodes, edges) {
    try {
      logger.debug(`Compiling ${nodes.length} nodes and ${edges.length} edges`);

      // Find the start node (trigger node)
      const startNode = nodes.find(n => n.type === 'trigger');
      if (!startNode) {
        throw new Error('No trigger node found');
      }

      // Build execution graph
      const graph = this.buildExecutionGraph(nodes, edges);

      // Generate code
      const code = this.generateCode(startNode, graph, nodes, edges);

      logger.success('Node graph compiled successfully');
      return code;
    } catch (error) {
      logger.error('Compilation failed:', error);
      throw error;
    }
  }

  /**
   * Build execution graph from nodes and edges
   * @param {Array} nodes - React Flow nodes
   * @param {Array} edges - React Flow edges
   * @returns {Map} Execution graph
   */
  buildExecutionGraph(nodes, edges) {
    const graph = new Map();

    // Initialize all nodes
    for (const node of nodes) {
      graph.set(node.id, {
        node,
        next: [],
        previous: [],
      });
    }

    // Build connections
    for (const edge of edges) {
      const sourceEntry = graph.get(edge.source);
      const targetEntry = graph.get(edge.target);

      if (sourceEntry && targetEntry) {
        sourceEntry.next.push({
          nodeId: edge.target,
          handle: edge.sourceHandle,
        });
        targetEntry.previous.push({
          nodeId: edge.source,
          handle: edge.targetHandle,
        });
      }
    }

    return graph;
  }

  /**
   * Generate executable code from graph
   * @param {Object} startNode - Starting node
   * @param {Map} graph - Execution graph
   * @param {Array} nodes - All nodes
   * @param {Array} edges - All edges
   * @returns {string} Generated code
   */
  generateCode(startNode, graph, _nodes, _edges) {
    const codeLines = [];

    // Add header
    codeLines.push('// Auto-generated plugin code');
    codeLines.push('// DO NOT EDIT MANUALLY');
    codeLines.push('');

    // Initialize variables
    codeLines.push('let variables = {};');
    codeLines.push('let __pendingResponse = null;');
    codeLines.push('');

    // Generate main execution function
    codeLines.push('(async function execute() {');

    // Start from trigger node
    const visited = new Set();
    this.generateNodeCode(startNode.id, graph, codeLines, visited, 1);

    // Resolve with pending response at the end
    codeLines.push('');
    codeLines.push('  // Send final response');
    codeLines.push('  if (__pendingResponse !== null) {');
    codeLines.push('    await __resolve(__pendingResponse);');
    codeLines.push('  }');

    codeLines.push('})();');

    return codeLines.join('\n');
  }

  /**
   * Generate code for a specific node
   * @param {string} nodeId - Node ID
   * @param {Map} graph - Execution graph
   * @param {Array} codeLines - Code lines array
   * @param {Set} visited - Visited nodes
   * @param {number} indent - Indentation level
   */
  generateNodeCode(nodeId, graph, codeLines, visited, indent = 0) {
    if (visited.has(nodeId)) {return;}
    visited.add(nodeId);

    const entry = graph.get(nodeId);
    if (!entry) {return;}

    const { node } = entry;
    // Limit indent depth to prevent resource exhaustion
    const safeIndent = Math.min(Math.max(0, indent), 50);
    const indentStr = '  '.repeat(safeIndent);

    // Generate code based on node type
    switch (node.type) {
    case 'trigger':
      this.generateTriggerCode(node, codeLines, indentStr);
      break;

    case 'response':
      this.generateResponseCode(node, codeLines, indentStr);
      break;

    case 'variable':
      this.generateVariableCode(node, codeLines, indentStr);
      break;

    case 'condition':
      this.generateConditionCode(node, entry, graph, codeLines, visited, indent);
      return; // Condition handles its own next nodes

    case 'permission':
      this.generatePermissionCode(node, entry, graph, codeLines, visited, indent);
      return; // Permission handles its own next nodes

    case 'comparison':
      this.generateComparisonCode(node, entry, graph, codeLines, visited, indent);
      return; // Comparison handles its own next nodes

    case 'action':
      this.generateActionCode(node, codeLines, indentStr);
      break;

    case 'data':
      this.generateDataCode(node, codeLines, indentStr);
      break;

    case 'http_request':
      this.generateHTTPRequestCode(node, codeLines, indentStr);
      break;

    case 'embed_builder':
      this.generateEmbedBuilderCode(node, codeLines, indentStr);
      break;

    case 'embed_response':
      this.generateEmbedResponseCode(node, codeLines, indentStr);
      break;

    case 'discord_action':
      this.generateDiscordActionCode(node, codeLines, indentStr);
      break;

    case 'for_loop':
      this.generateForLoopCode(node, entry, graph, codeLines, visited, indent);
      return; // Loop handles its own next nodes

    case 'while_loop':
      this.generateWhileLoopCode(node, entry, graph, codeLines, visited, indent);
      return; // Loop handles its own next nodes

    case 'array_operation':
      this.generateArrayOperationCode(node, codeLines, indentStr);
      break;

    case 'string_operation':
      this.generateStringOperationCode(node, codeLines, indentStr);
      break;

    case 'object_operation':
      this.generateObjectOperationCode(node, codeLines, indentStr);
      break;

    case 'math_operation':
      this.generateMathOperationCode(node, codeLines, indentStr);
      break;

    case 'database':
      this.generateDatabaseCode(node, codeLines, indentStr);
      break;

    case 'json':
      this.generateJSONCode(node, codeLines, indentStr);
      break;
    }

    // Process next nodes
    for (const next of entry.next) {
      this.generateNodeCode(next.nodeId, graph, codeLines, visited, indent);
    }
  }

  /**
   * Generate trigger node code
   */
  generateTriggerCode(node, codeLines, indent) {
    codeLines.push(`${indent}// Trigger: ${node.data.label || 'Command'}`);
    codeLines.push(`${indent}console.log('Plugin executed');`);
  }

  /**
   * Generate response node code
   */
  generateResponseCode(node, codeLines, indent) {
    const message = node.data.config?.message || 'Hello!';
    const interpolated = this.interpolateVariables(message);
    
    codeLines.push(`${indent}// Response: ${node.data.label || 'Reply'}`);
    codeLines.push(`${indent}__pendingResponse = \`${interpolated}\`;`);
  }

  /**
   * Generate variable node code
   */
  generateVariableCode(node, codeLines, indent) {
    const varName = node.data.config?.name || 'var';
    const varValue = node.data.config?.value || '';
    const varType = node.data.config?.type || 'string';

    codeLines.push(`${indent}// Variable: ${varName}`);
    
    switch (varType) {
    case 'user_input':
      codeLines.push(`${indent}variables['${varName}'] = interaction?.options?.getString('${varName}') || message?.content || '';`);
      break;
    case 'user_name':
      codeLines.push(`${indent}variables['${varName}'] = interaction?.user?.username || message?.author?.username || 'Unknown';`);
      break;
    case 'user_id':
      codeLines.push(`${indent}variables['${varName}'] = interaction?.user?.id || message?.author?.id || '';`);
      break;
    case 'channel_id':
      codeLines.push(`${indent}variables['${varName}'] = interaction?.channel?.id || message?.channel?.id || '';`);
      break;
    case 'guild_id':
      codeLines.push(`${indent}variables['${varName}'] = interaction?.guild?.id || message?.guild?.id || '';`);
      break;
    case 'timestamp':
      codeLines.push(`${indent}variables['${varName}'] = new Date().toISOString();`);
      break;
    case 'random_number': {
      const min = node.data.config?.min || 1;
      const max = node.data.config?.max || 100;
      codeLines.push(`${indent}variables['${varName}'] = Math.floor(Math.random() * (${max} - ${min} + 1)) + ${min};`);
      break;
    }
    case 'string': {
      const interpolated = this.interpolateVariables(varValue);
      codeLines.push(`${indent}variables['${varName}'] = \`${interpolated}\`;`);
      break;
    }
    default:
      codeLines.push(`${indent}variables['${varName}'] = \`${varValue}\`;`);
    }
  }

  /**
   * Generate condition node code
   */
  generateConditionCode(node, entry, graph, codeLines, visited, indent) {
    // Limit indent depth to prevent resource exhaustion
    const safeIndent = Math.min(Math.max(0, indent), 50);
    const indentStr = '  '.repeat(safeIndent);
    const condition = node.data.config?.condition || 'true';
    const interpolated = this.interpolateVariables(condition);

    codeLines.push(`${indentStr}// Condition: ${node.data.label || 'If'}`);
    codeLines.push(`${indentStr}if (${interpolated}) {`);

    // Find true branch
    const trueBranch = entry.next.find(n => n.handle?.includes('true'));
    if (trueBranch) {
      this.generateNodeCode(trueBranch.nodeId, graph, codeLines, visited, indent + 1);
    }

    codeLines.push(`${indentStr}} else {`);

    // Find false branch
    const falseBranch = entry.next.find(n => n.handle?.includes('false'));
    if (falseBranch) {
      this.generateNodeCode(falseBranch.nodeId, graph, codeLines, visited, indent + 1);
    }

    codeLines.push(`${indentStr}}`);
  }

  /**
   * Generate permission node code
   */
  generatePermissionCode(node, entry, graph, codeLines, visited, indent) {
    // Limit indent depth to prevent resource exhaustion
    const safeIndent = Math.min(Math.max(0, indent), 50);
    const indentStr = '  '.repeat(safeIndent);
    const checkType = node.data.config?.checkType || 'user_id';
    const values = node.data.config?.values || [];
    const mode = node.data.config?.mode || 'whitelist';
    
    codeLines.push(`${indentStr}// Permission Check: ${node.data.label || 'Access Control'}`);
    
    let checkCondition = '';
    
    if (checkType === 'user_id') {
      const userIds = JSON.stringify(values);
      if (mode === 'whitelist') {
        checkCondition = `${userIds}.includes(interaction?.user?.id || message?.author?.id)`;
      } else {
        checkCondition = `!${userIds}.includes(interaction?.user?.id || message?.author?.id)`;
      }
    } else if (checkType === 'role') {
      const roleIds = JSON.stringify(values);
      if (mode === 'whitelist') {
        checkCondition = `interaction?.member?.roles?.cache?.some(r => ${roleIds}.includes(r.id))`;
      } else {
        checkCondition = `!interaction?.member?.roles?.cache?.some(r => ${roleIds}.includes(r.id))`;
      }
    } else if (checkType === 'permission') {
      const permissions = JSON.stringify(values);
      checkCondition = `interaction?.member?.permissions?.has(${permissions})`;
    }
    
    codeLines.push(`${indentStr}if (${checkCondition}) {`);
    
    // Process allowed path
    const allowedEdges = graph.edges.filter(e => e.source === node.id && e.sourceHandle === 'allowed');
    if (allowedEdges.length > 0) {
      const allowedTargets = allowedEdges.map(e => graph.nodes.find(n => n.id === e.target));
      for (const target of allowedTargets) {
        if (target && !visited.has(target.id)) {
          this.generateNodeCode(target, { node: target }, graph, codeLines, visited, indent + 1);
        }
      }
    }
    
    codeLines.push(`${indentStr}} else {`);
    
    // Process denied path
    const deniedEdges = graph.edges.filter(e => e.source === node.id && e.sourceHandle === 'denied');
    if (deniedEdges.length > 0) {
      const deniedTargets = deniedEdges.map(e => graph.nodes.find(n => n.id === e.target));
      for (const target of deniedTargets) {
        if (target && !visited.has(target.id)) {
          this.generateNodeCode(target, { node: target }, graph, codeLines, visited, indent + 1);
        }
      }
    }
    
    codeLines.push(`${indentStr}}`);
    
    visited.add(node.id);
  }

  /**
   * Generate action node code
   */
  generateActionCode(node, codeLines, indent) {
    const actionType = node.data.config?.actionType || 'log';

    codeLines.push(`${indent}// Action: ${node.data.label || 'Do something'}`);

    switch (actionType) {
    case 'log': {
      const logMessage = this.interpolateVariables(node.data.config?.message || 'Log message');
      codeLines.push(`${indent}console.log(\`${logMessage}\`);`);
      break;
    }

    case 'wait':
      const durationConfig = node.data.config?.duration || 1000;
      const duration = typeof durationConfig === 'string' && durationConfig.includes('{') 
        ? this.interpolateVariables(durationConfig)
        : durationConfig;
      const durationCode = typeof duration === 'string' && duration.includes('variables')
        ? `Number(\`${duration}\`)`
        : duration;
      codeLines.push(`${indent}await new Promise(resolve => setTimeout(resolve, ${durationCode}));`);
      break;

    case 'set_state': {
      const stateKey = node.data.config?.key || 'key';
      const stateValue = this.interpolateVariables(node.data.config?.value || '');
      codeLines.push(`${indent}state['${stateKey}'] = \`${stateValue}\`;`);
      break;
    }
    }
  }

  /**
   * Generate data node code
   */
  generateDataCode(node, codeLines, indent) {
    const dataType = node.data.config?.dataType || 'text';
    const varName = node.data.config?.name || 'data';

    codeLines.push(`${indent}// Data: ${node.data.label || 'Get data'}`);

    switch (dataType) {
    case 'server_name':
      codeLines.push(`${indent}variables['${varName}'] = interaction?.guild?.name || message?.guild?.name || 'Unknown';`);
      break;
    case 'channel_name':
      codeLines.push(`${indent}variables['${varName}'] = interaction?.channel?.name || message?.channel?.name || 'Unknown';`);
      break;
    case 'timestamp':
      codeLines.push(`${indent}variables['${varName}'] = new Date().toISOString();`);
      break;
    }
  }

  /**
   * Interpolate variables in string
   * @param {string} str - String to interpolate
   * @returns {string} Interpolated string
   */
  /**
   * Escape special characters for template strings
   */
  escapeTemplateString(str) {
    if (typeof str !== 'string') {return str;}
    return str
      .replace(/\\/g, '\\\\')   // Escape backslashes first
      .replace(/`/g, '\\`')     // Escape backticks  
      .replace(/\n/g, '\\n')    // Escape newlines
      .replace(/\r/g, '\\r');   // Escape carriage returns
  }

  interpolateVariables(str) {
    if (typeof str !== 'string') {return str;}
    
    // First escape special characters, then replace {varname} patterns
    // const result = str;
    
    // Split by variable patterns to preserve them
    const parts = [];
    let lastIndex = 0;
    // Updated regex to handle array access like {varname[index]}
    const regex = /\{(\w+)(?:\[(\d+)\])?\}/g;
    let match;
    
    while ((match = regex.exec(str)) !== null) {
      // Add the text before the variable (escaped)
      if (match.index > lastIndex) {
        parts.push(this.escapeTemplateString(str.substring(lastIndex, match.index)));
      }
      // Add the variable reference (not escaped)
      if (match[2]) {
        // Array access: {varname[index]}
        parts.push('${variables[\'' + match[1] + '\'][' + match[2] + ']}');
      } else {
        // Simple variable: {varname}
        parts.push('${variables[\'' + match[1] + '\']}');
      }
      lastIndex = regex.lastIndex;
    }
    
    // Add remaining text (escaped)
    if (lastIndex < str.length) {
      parts.push(this.escapeTemplateString(str.substring(lastIndex)));
    }
    
    return parts.join('');
  }

  /**
   * Generate HTTP request code
   */
  generateHTTPRequestCode(node, codeLines, indent) {
    const method = node.data.config?.method || 'GET';
    const url = this.interpolateVariables(node.data.config?.url || '');
    const responseVar = node.data.config?.responseVar || node.data.config?.outputVar || 'response';
    const headers = node.data.config?.headers || {};
    const body = node.data.config?.body ? this.interpolateVariables(node.data.config.body) : null;

    codeLines.push(`${indent}// HTTP Request: ${method} ${url}`);
    codeLines.push(`${indent}try {`);
    codeLines.push(`${indent}  const fetchOptions = {`);
    codeLines.push(`${indent}    method: '${method}',`);
    codeLines.push(`${indent}    headers: ${JSON.stringify(headers)}`);
    if (body && method !== 'GET') {
      codeLines.push(`${indent}    , body: JSON.stringify(\`${body}\`)`);
    }
    codeLines.push(`${indent}  };`);
    codeLines.push(`${indent}  const httpResponse = await fetch(\`${url}\`, fetchOptions);`);
    codeLines.push(`${indent}  variables['${responseVar}'] = await httpResponse.json();`);
    codeLines.push(`${indent}  variables['${responseVar}_status'] = httpResponse.status;`);
    codeLines.push(`${indent}} catch(httpError) {`);
    codeLines.push(`${indent}  variables['${responseVar}_error'] = httpError.message;`);
    codeLines.push(`${indent}  console.error('HTTP Request failed:', httpError);`);
    codeLines.push(`${indent}}`);
  }

  /**
   * Generate embed builder code
   */
  generateEmbedBuilderCode(node, codeLines, indent) {
    const outputVar = node.data.config?.embedVar || node.data.config?.outputVar || 'embed';
    const config = node.data.config || {};

    codeLines.push(`${indent}// Build Embed`);
    codeLines.push(`${indent}variables['${outputVar}'] = {`);
    if (config.title) {codeLines.push(`${indent}  title: \`${this.interpolateVariables(config.title)}\`,`);}
    if (config.description) {codeLines.push(`${indent}  description: \`${this.interpolateVariables(config.description)}\`,`);}
    if (config.color) {
      // Convert hex color to integer for Discord
      const colorValue = config.color.replace('#', '');
      codeLines.push(`${indent}  color: parseInt('${colorValue}', 16),`);
    }
    if (config.author) {
      codeLines.push(`${indent}  author: {`);
      codeLines.push(`${indent}    name: \`${this.interpolateVariables(config.author.name || '')}\`,`);
      if (config.author.icon) {codeLines.push(`${indent}    iconURL: \`${config.author.icon}\`,`);}
      if (config.author.url) {codeLines.push(`${indent}    url: \`${config.author.url}\`,`);}
      codeLines.push(`${indent}  },`);
    }
    if (config.thumbnail) {codeLines.push(`${indent}  thumbnail: { url: \`${config.thumbnail}\` },`);}
    if (config.image) {codeLines.push(`${indent}  image: { url: \`${config.image}\` },`);}
    if (config.footer) {
      codeLines.push(`${indent}  footer: {`);
      codeLines.push(`${indent}    text: \`${this.interpolateVariables(config.footer.text || '')}\`,`);
      if (config.footer.icon) {codeLines.push(`${indent}    iconURL: \`${config.footer.icon}\`,`);}
      codeLines.push(`${indent}  },`);
    }
    if (config.timestamp) {codeLines.push(`${indent}  timestamp: new Date().toISOString(),`);}
    if (config.fields && config.fields.length > 0) {
      codeLines.push(`${indent}  fields: [`);
      config.fields.forEach(field => {
        codeLines.push(`${indent}    {`);
        codeLines.push(`${indent}      name: \`${this.interpolateVariables(field.name)}\`,`);
        codeLines.push(`${indent}      value: \`${this.interpolateVariables(field.value)}\`,`);
        codeLines.push(`${indent}      inline: ${field.inline || false}`);
        codeLines.push(`${indent}    },`);
      });
      codeLines.push(`${indent}  ],`);
    }
    codeLines.push(`${indent}};`);
  }

  /**
   * Generate embed response code
   */
  generateEmbedResponseCode(node, codeLines, indent) {
    const embedVar = node.data.config?.embedVar || 'embed';
    const ephemeral = node.data.config?.ephemeral || false;

    codeLines.push(`${indent}// Send Embed (store response, don't resolve yet)`);
    codeLines.push(`${indent}__pendingResponse = { embeds: [variables['${embedVar}']], ephemeral: ${ephemeral} };`);
    codeLines.push(`${indent}const sentMessage = await interaction.editReply(__pendingResponse);`);
    codeLines.push(`${indent}variables['_sent_message'] = sentMessage;`);
    codeLines.push(`${indent}variables['_message_id'] = sentMessage.id;`);
    codeLines.push(`${indent}variables['_channel_id'] = sentMessage.channel.id;`);
  }

  /**
   * Generate Discord action code
   */
  generateDiscordActionCode(node, codeLines, indent) {
    const action = node.data.config?.actionType || node.data.config?.action || 'send_message';
    
    codeLines.push(`${indent}// Discord Action: ${action}`);
    
    switch (action) {
    case 'send_dm': {
      const userId = this.interpolateVariables(node.data.config?.userId || '');
      const dmMessage = this.interpolateVariables(node.data.config?.message || '');
      codeLines.push(`${indent}try {`);
      codeLines.push(`${indent}  const dmUser = await client.users.fetch(\`${userId}\`);`);
      codeLines.push(`${indent}  await dmUser.send(\`${dmMessage}\`);`);
      codeLines.push(`${indent}} catch(e) { console.error('DM failed:', e); }`);
      break;
    }
      
    case 'add_reaction': {
      const emoji = node.data.config?.emoji || '👍';
      codeLines.push(`${indent}if (message) await message.react('${emoji}');`);
      break;
    }
      
    case 'add_multiple_reactions': {
      // Don't interpolate - just extract the variable name
      let emojisVar = node.data.config?.emojis || 'emojis';
      // Remove curly braces if present (e.g., "{reaction_emojis}" -> "reaction_emojis")
      emojisVar = emojisVar.replace(/^\{|\}$/g, '');
        
      codeLines.push(`${indent}// Add Multiple Reactions`);
      codeLines.push(`${indent}if (variables['_sent_message'] && variables['${emojisVar}']) {`);
      codeLines.push(`${indent}  for (const emoji of variables['${emojisVar}']) {`);
      codeLines.push(`${indent}    try { await variables['_sent_message'].react(emoji); } catch(e) { console.log('Reaction failed:', e); }`);
      codeLines.push(`${indent}  }`);
      codeLines.push(`${indent}} else if (message && variables['${emojisVar}']) {`);
      codeLines.push(`${indent}  for (const emoji of variables['${emojisVar}']) {`);
      codeLines.push(`${indent}    try { await message.react(emoji); } catch(e) { console.log('Reaction failed:', e); }`);
      codeLines.push(`${indent}  }`);
      codeLines.push(`${indent}}`);
      break;
    }
      
    case 'setup_single_choice_voting':
      // Setup single-choice voting collector
      let scEmojisVar = node.data.config?.emojis || 'emojis';
      let scDurationVar = node.data.config?.duration || 'duration_ms';
      // Remove curly braces if present
      scEmojisVar = scEmojisVar.replace(/^\{|\}$/g, '');
      scDurationVar = scDurationVar.replace(/^\{|\}$/g, '');
        
      codeLines.push(`${indent}// Setup Single-Choice Voting`);
      codeLines.push(`${indent}console.log('[Setup] Checking conditions:', {`);
      codeLines.push(`${indent}  hasMessage: !!variables['_sent_message'],`);
      codeLines.push(`${indent}  hasEmojis: !!variables['${scEmojisVar}'],`);
      codeLines.push(`${indent}  hasDuration: !!variables['${scDurationVar}'],`);
      codeLines.push(`${indent}  durationValue: variables['${scDurationVar}'],`);
      codeLines.push(`${indent}  hasMethod: typeof variables['_sent_message']?.setupSingleChoiceVoting`);
      codeLines.push(`${indent}});`);
      codeLines.push(`${indent}if (variables['_sent_message'] && variables['${scEmojisVar}'] && variables['${scDurationVar}']) {`);
      codeLines.push(`${indent}  try {`);
      codeLines.push(`${indent}    variables['_sent_message'].setupSingleChoiceVoting(variables['${scEmojisVar}'], variables['${scDurationVar}']);`);
      codeLines.push(`${indent}  } catch(e) { console.log('[Setup] Error:', e.message); }`);
      codeLines.push(`${indent}}`);
      break;
      
    case 'check_role':
      const roleId = node.data.config?.roleId || '';
      const roleVar = node.data.config?.outputVar || 'hasRole';
      codeLines.push(`${indent}variables['${roleVar}'] = interaction?.member?.roles?.cache?.has('${roleId}') || message?.member?.roles?.cache?.has('${roleId}') || false;`);
      break;
      
    case 'add_role':
      const addRoleId = node.data.config?.roleId || '';
      const addUserId = this.interpolateVariables(node.data.config?.userId || 'interaction?.user?.id');
      codeLines.push(`${indent}try {`);
      codeLines.push(`${indent}  const member = interaction?.guild?.members?.fetch(\`${addUserId}\`);`);
      codeLines.push(`${indent}  if (member) await member.roles.add('${addRoleId}');`);
      codeLines.push(`${indent}} catch(e) { console.error('Add role failed:', e); }`);
      break;
      
    case 'remove_role':
      const removeRoleId = node.data.config?.roleId || '';
      const removeUserId = this.interpolateVariables(node.data.config?.userId || 'interaction?.user?.id');
      codeLines.push(`${indent}try {`);
      codeLines.push(`${indent}  const member = interaction?.guild?.members?.fetch(\`${removeUserId}\`);`);
      codeLines.push(`${indent}  if (member) await member.roles.remove('${removeRoleId}');`);
      codeLines.push(`${indent}} catch(e) { console.error('Remove role failed:', e); }`);
      break;
      
    case 'kick_member':
      const kickUserId = this.interpolateVariables(node.data.config?.userId || 'interaction?.user?.id');
      const kickReason = this.interpolateVariables(node.data.config?.reason || 'Kicked by bot');
      codeLines.push(`${indent}try {`);
      codeLines.push(`${indent}  const member = interaction?.guild?.members?.fetch(\`${kickUserId}\`);`);
      codeLines.push(`${indent}  if (member) await member.kick(\`${kickReason}\`);`);
      codeLines.push(`${indent}} catch(e) { console.error('Kick failed:', e); }`);
      break;
      
    case 'ban_member':
      const banUserId = this.interpolateVariables(node.data.config?.userId || 'interaction?.user?.id');
      const banReason = this.interpolateVariables(node.data.config?.reason || 'Banned by bot');
      const deleteDays = node.data.config?.deleteDays || 0;
      codeLines.push(`${indent}try {`);
      codeLines.push(`${indent}  await interaction?.guild?.members?.ban(\`${banUserId}\`, { reason: \`${banReason}\`, deleteMessageDays: ${deleteDays} });`);
      codeLines.push(`${indent}} catch(e) { console.error('Ban failed:', e); }`);
      break;
      
    case 'create_channel':
      const channelName = this.interpolateVariables(node.data.config?.name || 'new-channel');
      const channelType = node.data.config?.type || 'text';
      const channelTopic = this.interpolateVariables(node.data.config?.topic || '');
      const channelVar = node.data.config?.outputVar || 'newChannel';
      codeLines.push(`${indent}try {`);
      codeLines.push(`${indent}  const channel = await interaction?.guild?.channels?.create({`);
      codeLines.push(`${indent}    name: \`${channelName}\`,`);
      codeLines.push(`${indent}    type: ${channelType},`);
      codeLines.push(`${indent}    topic: \`${channelTopic}\``);
      codeLines.push(`${indent}  });`);
      codeLines.push(`${indent}  variables['${channelVar}'] = channel;`);
      codeLines.push(`${indent}} catch(e) { console.error('Create channel failed:', e); }`);
      break;
      
    case 'delete_channel':
      const deleteChannelId = this.interpolateVariables(node.data.config?.channelId || 'interaction?.channel?.id');
      codeLines.push(`${indent}try {`);
      codeLines.push(`${indent}  const channel = interaction?.guild?.channels?.fetch(\`${deleteChannelId}\`);`);
      codeLines.push(`${indent}  if (channel) await channel.delete();`);
      codeLines.push(`${indent}} catch(e) { console.error('Delete channel failed:', e); }`);
      break;
      
    case 'collect_reactions':
      const collectChannelId = this.interpolateVariables(node.data.config?.channelId || 'interaction?.channel?.id');
      const collectMessageId = this.interpolateVariables(node.data.config?.messageId || '');
      const collectEmoji = node.data.config?.emoji || '👍';
      const collectTime = node.data.config?.time || 30000;
      const collectVar = node.data.config?.outputVar || 'reactions';
      codeLines.push(`${indent}try {`);
      codeLines.push(`${indent}  const channel = interaction?.guild?.channels?.fetch(\`${collectChannelId}\`);`);
      codeLines.push(`${indent}  const message = await channel?.messages?.fetch(\`${collectMessageId}\`);`);
      codeLines.push(`${indent}  const filter = (reaction, user) => reaction.emoji.name === '${collectEmoji}' && !user.bot;`);
      codeLines.push(`${indent}  const collected = await message?.awaitReactions({ filter, time: ${collectTime}, errors: ['time'] });`);
      codeLines.push(`${indent}  variables['${collectVar}'] = collected?.get('${collectEmoji}')?.count || 0;`);
      codeLines.push(`${indent}} catch(e) { console.error('Collect reactions failed:', e); }`);
      break;
    }
  }

  /**
   * Generate for loop code
   */
  generateForLoopCode(node, entry, graph, codeLines, visited, indent) {
    // Limit indent depth to prevent resource exhaustion
    const safeIndent = Math.min(Math.max(0, indent), 50);
    const indentStr = '  '.repeat(safeIndent);
    const arrayVar = node.data.config?.arrayVar || 'array';
    const iteratorVar = node.data.config?.iteratorVar || 'item';
    const maxIterations = node.data.config?.maxIterations || 1000;

    codeLines.push(`${indentStr}// For Loop`);
    codeLines.push(`${indentStr}const loopArray = variables['${arrayVar}'] || [];`);
    codeLines.push(`${indentStr}let loopCount = 0;`);
    codeLines.push(`${indentStr}for (const ${iteratorVar} of loopArray) {`);
    codeLines.push(`${indentStr}  if (loopCount++ >= ${maxIterations}) break;`);
    codeLines.push(`${indentStr}  variables['${iteratorVar}'] = ${iteratorVar};`);

    // Find loop body
    const loopBody = entry.next.find(n => n.handle?.includes('loop-body'));
    if (loopBody) {
      this.generateNodeCode(loopBody.nodeId, graph, codeLines, visited, indent + 1);
    }

    codeLines.push(`${indentStr}}`);

    // Find complete branch
    const complete = entry.next.find(n => n.handle?.includes('complete'));
    if (complete) {
      this.generateNodeCode(complete.nodeId, graph, codeLines, visited, indent);
    }
  }

  /**
   * Generate while loop code
   */
  generateWhileLoopCode(node, entry, graph, codeLines, visited, indent) {
    // Limit indent depth to prevent resource exhaustion
    const safeIndent = Math.min(Math.max(0, indent), 50);
    const indentStr = '  '.repeat(safeIndent);
    const condition = this.interpolateVariables(node.data.config?.condition || 'false');
    const maxIterations = node.data.config?.maxIterations || 1000;

    codeLines.push(`${indentStr}// While Loop`);
    codeLines.push(`${indentStr}let whileCount = 0;`);
    codeLines.push(`${indentStr}while (${condition} && whileCount++ < ${maxIterations}) {`);

    const loopBody = entry.next.find(n => n.handle?.includes('loop-body'));
    if (loopBody) {
      this.generateNodeCode(loopBody.nodeId, graph, codeLines, visited, indent + 1);
    }

    codeLines.push(`${indentStr}}`);

    const complete = entry.next.find(n => n.handle?.includes('complete'));
    if (complete) {
      this.generateNodeCode(complete.nodeId, graph, codeLines, visited, indent);
    }
  }

  /**
   * Generate comparison code
   */
  generateComparisonCode(node, entry, graph, codeLines, visited, indent) {
    // Limit indent depth to prevent resource exhaustion
    const safeIndent = Math.min(Math.max(0, indent), 50);
    const indentStr = '  '.repeat(safeIndent);
    const operator = node.data.config?.operator || '==';
    const left = this.interpolateVariables(node.data.config?.left || '');
    const right = this.interpolateVariables(node.data.config?.right || '');

    let condition;
    switch (operator) {
    case 'includes':
      condition = `(\`${left}\`).includes(\`${right}\`)`;
      break;
    case 'startsWith':
      condition = `(\`${left}\`).startsWith(\`${right}\`)`;
      break;
    case 'endsWith':
      condition = `(\`${left}\`).endsWith(\`${right}\`)`;
      break;
    default:
      condition = `\`${left}\` ${operator} \`${right}\``;
    }

    codeLines.push(`${indentStr}// Comparison: ${operator}`);
    codeLines.push(`${indentStr}if (${condition}) {`);

    const trueBranch = entry.next.find(n => n.handle?.includes('true'));
    if (trueBranch) {
      this.generateNodeCode(trueBranch.nodeId, graph, codeLines, visited, indent + 1);
    }

    codeLines.push(`${indentStr}} else {`);

    const falseBranch = entry.next.find(n => n.handle?.includes('false'));
    if (falseBranch) {
      this.generateNodeCode(falseBranch.nodeId, graph, codeLines, visited, indent + 1);
    }

    codeLines.push(`${indentStr}}`);
  }

  /**
   * Generate array operation code
   */
  generateArrayOperationCode(node, codeLines, indent) {
    const operation = node.data.config?.operation || 'create';
    const outputVar = node.data.config?.resultVar || node.data.config?.outputVar || 'array';

    codeLines.push(`${indent}// Array Operation: ${operation}`);

    switch (operation) {
    case 'create':
      const items = node.data.config?.items || '';
      codeLines.push(`${indent}variables['${outputVar}'] = [\`${this.interpolateVariables(items)}\`.split(',').map(s => s.trim())];`);
      break;
    case 'push':
      const arrayVar = node.data.config?.arrayVar || 'array';
      const item = this.interpolateVariables(node.data.config?.item || '');
      codeLines.push(`${indent}if (!variables['${arrayVar}']) variables['${arrayVar}'] = [];`);
      codeLines.push(`${indent}variables['${arrayVar}'].push(\`${item}\`);`);
      break;
    case 'pop':
      const popArray = node.data.config?.arrayVar || 'array';
      codeLines.push(`${indent}variables['${outputVar}'] = variables['${popArray}']?.pop();`);
      break;
    case 'filter':
      const filterArray = node.data.config?.arrayVar || 'array';
      const filterExpr = this.interpolateVariables(node.data.config?.expression || 'true');
      codeLines.push(`${indent}variables['${outputVar}'] = (variables['${filterArray}'] || []).filter(item => ${filterExpr});`);
      break;
    case 'map':
      const mapArray = node.data.config?.arrayVar || 'array';
      const mapExpr = node.data.config?.expression || 'item';
      // Don't interpolate - use expression as-is JavaScript
      if (mapExpr.includes('index')) {
        codeLines.push(`${indent}variables['${outputVar}'] = (variables['${mapArray}'] || []).map((item, index) => ${mapExpr});`);
      } else {
        codeLines.push(`${indent}variables['${outputVar}'] = (variables['${mapArray}'] || []).map(item => ${mapExpr});`);
      }
      break;
    case 'length':
      const lengthArray = node.data.config?.arrayVar || 'array';
      codeLines.push(`${indent}variables['${outputVar}'] = (variables['${lengthArray}'] || []).length;`);
      break;
    case 'join':
      const joinArray = node.data.config?.arrayVar || 'array';
      const separator = node.data.config?.separator || ', ';
      // Handle escape sequences in separator
      const escapedSep = separator.replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\r/g, '\r');
      const sepCode = JSON.stringify(escapedSep);
      codeLines.push(`${indent}variables['${outputVar}'] = (variables['${joinArray}'] || []).join(${sepCode});`);
      logger.debug(`Generated join operation: variables['${outputVar}'] = (variables['${joinArray}'] || []).join(${sepCode});`);
      break;
    }
  }

  /**
   * Generate string operation code
   */
  generateStringOperationCode(node, codeLines, indent) {
    const operation = node.data.config?.operation || 'concat';
    const outputVar = node.data.config?.resultVar || node.data.config?.outputVar || 'result';

    codeLines.push(`${indent}// String Operation: ${operation}`);

    switch (operation) {
    case 'concat':
      const strings = (node.data.config?.strings || []).map(s => this.interpolateVariables(s));
      codeLines.push(`${indent}variables['${outputVar}'] = [\`${strings.join('`, `')}\`].join('');`);
      break;
    case 'split':
      const str = this.interpolateVariables(node.data.config?.input || node.data.config?.string || '');
      const delimiter = node.data.config?.delimiter || ',';
      codeLines.push(`${indent}variables['${outputVar}'] = \`${str}\`.split('${delimiter}');`);
      break;
    case 'replace':
      const replaceStr = this.interpolateVariables(node.data.config?.input || node.data.config?.string || '');
      const search = node.data.config?.param1 || node.data.config?.search || '';
      const replace = this.interpolateVariables(node.data.config?.param2 || node.data.config?.replace || '');
      codeLines.push(`${indent}variables['${outputVar}'] = \`${replaceStr}\`.replace(/${search}/g, \`${replace}\`);`);
      break;
    case 'uppercase':
      const upperStr = this.interpolateVariables(node.data.config?.input || node.data.config?.string || '');
      codeLines.push(`${indent}variables['${outputVar}'] = \`${upperStr}\`.toUpperCase();`);
      break;
    case 'lowercase':
      const lowerStr = this.interpolateVariables(node.data.config?.input || node.data.config?.string || '');
      codeLines.push(`${indent}variables['${outputVar}'] = \`${lowerStr}\`.toLowerCase();`);
      break;
    case 'trim':
      const trimStr = this.interpolateVariables(node.data.config?.input || node.data.config?.string || '');
      codeLines.push(`${indent}variables['${outputVar}'] = \`${trimStr}\`.trim();`);
      break;
    case 'substring':
      const substringStr = this.interpolateVariables(node.data.config?.input || node.data.config?.string || '');
      const start = node.data.config?.start || '0';
      const end = node.data.config?.end || '';
      if (end) {
        codeLines.push(`${indent}variables['${outputVar}'] = \`${substringStr}\`.substring(${start}, ${end});`);
      } else {
        codeLines.push(`${indent}variables['${outputVar}'] = \`${substringStr}\`.substring(${start});`);
      }
      break;
      
    case 'condition':
      const condInput = this.interpolateVariables(node.data.config?.input || '');
      const conditions = node.data.config?.conditions || [];
      const defaultValue = node.data.config?.default || '';
        
      codeLines.push(`${indent}// String condition mapping`);
      codeLines.push(`${indent}const condValue = \`${condInput}\`;`);
      codeLines.push(`${indent}let ${outputVar}_result = '${defaultValue}';`);
        
      conditions.forEach((cond, idx) => {
        const ifValues = cond.if.split(',').map(v => v.trim());
        const thenValue = cond.then || '';
        const ifStatement = idx === 0 ? 'if' : 'else if';
        const conditions = ifValues.map(v => `condValue === '${v}'`).join(' || ');
          
        codeLines.push(`${indent}${ifStatement} (${conditions}) {`);
        codeLines.push(`${indent}  ${outputVar}_result = '${thenValue}';`);
        codeLines.push(`${indent}}`);
      });
        
      codeLines.push(`${indent}variables['${outputVar}'] = ${outputVar}_result;`);
      break;
      
    case 'join':
      const joinArray = node.data.config?.arrayVar || 'array';
      const joinSeparator = node.data.config?.separator || ', ';
      // Handle escape sequences in separator
      const escapedJoinSep = joinSeparator.replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\r/g, '\r');
      const joinSepCode = JSON.stringify(escapedJoinSep);
      codeLines.push(`${indent}variables['${outputVar}'] = (variables['${joinArray}'] || []).join(${joinSepCode});`);
      break;
    }
  }

  /**
   * Generate object operation code
   */
  generateObjectOperationCode(node, codeLines, indent) {
    const operation = node.data.config?.operation || 'create';
    const outputVar = node.data.config?.outputVar || 'object';

    codeLines.push(`${indent}// Object Operation: ${operation}`);

    switch (operation) {
    case 'create':
      const pairs = node.data.config?.pairs || [];
      codeLines.push(`${indent}variables['${outputVar}'] = {`);
      pairs.forEach(pair => {
        codeLines.push(`${indent}  '${pair.key}': \`${this.interpolateVariables(pair.value)}\`,`);
      });
      codeLines.push(`${indent}};`);
      break;
    case 'get':
      const objVar = node.data.config?.objectVar || 'object';
      const key = node.data.config?.key || '';
      codeLines.push(`${indent}variables['${outputVar}'] = variables['${objVar}']?.['${key}'];`);
      break;
    case 'set':
      const setObjVar = node.data.config?.objectVar || 'object';
      const setKey = node.data.config?.key || '';
      const setValue = this.interpolateVariables(node.data.config?.value || '');
      codeLines.push(`${indent}if (!variables['${setObjVar}']) variables['${setObjVar}'] = {};`);
      codeLines.push(`${indent}variables['${setObjVar}']['${setKey}'] = \`${setValue}\`;`);
      break;
    case 'keys':
      const keysObj = node.data.config?.objectVar || 'object';
      codeLines.push(`${indent}variables['${outputVar}'] = Object.keys(variables['${keysObj}'] || {});`);
      break;
    case 'values':
      const valuesObj = node.data.config?.objectVar || 'object';
      codeLines.push(`${indent}variables['${outputVar}'] = Object.values(variables['${valuesObj}'] || {});`);
      break;
    }
  }

  /**
   * Generate math operation code
   */
  generateMathOperationCode(node, codeLines, indent) {
    const operation = node.data.config?.operation || 'add';
    const left = this.interpolateVariables(node.data.config?.value1 || node.data.config?.left || '0');
    const right = this.interpolateVariables(node.data.config?.value2 || node.data.config?.right || '0');
    const outputVar = node.data.config?.resultVar || node.data.config?.outputVar || 'result';

    codeLines.push(`${indent}// Math: ${operation}`);

    switch (operation) {
    case 'add':
      codeLines.push(`${indent}variables['${outputVar}'] = Number(\`${left}\`) + Number(\`${right}\`);`);
      break;
    case 'subtract':
      codeLines.push(`${indent}variables['${outputVar}'] = Number(\`${left}\`) - Number(\`${right}\`);`);
      break;
    case 'multiply':
      codeLines.push(`${indent}variables['${outputVar}'] = Number(\`${left}\`) * Number(\`${right}\`);`);
      break;
    case 'divide':
      codeLines.push(`${indent}variables['${outputVar}'] = Number(\`${left}\`) / Number(\`${right}\`);`);
      break;
    case 'modulo':
      codeLines.push(`${indent}variables['${outputVar}'] = Number(\`${left}\`) % Number(\`${right}\`);`);
      break;
    case 'power':
      codeLines.push(`${indent}variables['${outputVar}'] = Math.pow(Number(\`${left}\`), Number(\`${right}\`));`);
      break;
    case 'sqrt':
      codeLines.push(`${indent}variables['${outputVar}'] = Math.sqrt(Number(\`${left}\`));`);
      break;
    case 'abs':
      codeLines.push(`${indent}variables['${outputVar}'] = Math.abs(Number(\`${left}\`));`);
      break;
    }
  }

  /**
   * Generate database operation code
   */
  generateDatabaseCode(node, codeLines, indent) {
    const operation = node.data.config?.operation || 'get';
    const key = node.data.config?.key || '';
    const outputVar = node.data.config?.resultVar || node.data.config?.outputVar || 'dbValue';

    codeLines.push(`${indent}// Database: ${operation}`);

    switch (operation) {
    case 'get':
      codeLines.push(`${indent}variables['${outputVar}'] = await state.get('${key}');`);
      break;
    case 'set':
      const value = this.interpolateVariables(node.data.config?.value || '');
      codeLines.push(`${indent}await state.set('${key}', \`${value}\`);`);
      break;
    case 'delete':
      codeLines.push(`${indent}await state.delete('${key}');`);
      break;
    case 'list':
      codeLines.push(`${indent}variables['${outputVar}'] = await state.list();`);
      break;
    case 'exists':
      codeLines.push(`${indent}variables['${outputVar}'] = await state.exists('${key}');`);
      break;
    }
  }

  /**
   * Generate JSON operation code
   */
  generateJSONCode(node, codeLines, indent) {
    const operation = node.data.config?.operation || 'parse';
    const inputVar = node.data.config?.inputVar || 'json';
    const outputVar = node.data.config?.outputVar || 'parsed';

    codeLines.push(`${indent}// JSON: ${operation}`);

    if (operation === 'parse') {
      codeLines.push(`${indent}try {`);
      codeLines.push(`${indent}  variables['${outputVar}'] = JSON.parse(variables['${inputVar}']);`);
      codeLines.push(`${indent}} catch(e) { variables['${outputVar}_error'] = e.message; }`);
    } else if (operation === 'stringify') {
      codeLines.push(`${indent}variables['${outputVar}'] = JSON.stringify(variables['${inputVar}']);`);
    } else if (operation === 'extract') {
      const path = node.data.config?.path || '';
      codeLines.push(`${indent}try {`);
      codeLines.push(`${indent}  // Extract value from JSON path: ${path}`);
      codeLines.push(`${indent}  const jsonExtractSource = variables['${inputVar}'];`);
      codeLines.push(`${indent}  let jsonExtractResult = jsonExtractSource;`);
      
      // Parse the path and generate safe navigation code
      if (path) {
        const pathParts = this.parseJSONPath(path);
        for (const part of pathParts) {
          if (part.type === 'property') {
            codeLines.push(`${indent}  jsonExtractResult = jsonExtractResult?.['${part.value}'];`);
          } else if (part.type === 'index') {
            codeLines.push(`${indent}  jsonExtractResult = jsonExtractResult?.[${part.value}];`);
          }
        }
      }
      
      codeLines.push(`${indent}  variables['${outputVar}'] = jsonExtractResult;`);
      codeLines.push(`${indent}} catch(e) {`);
      codeLines.push(`${indent}  variables['${outputVar}_error'] = e.message;`);
      codeLines.push(`${indent}  variables['${outputVar}'] = undefined;`);
      codeLines.push(`${indent}}`);
    }
  }

  /**
   * Parse JSON path into parts for safe navigation
   * Supports: data.weather.temp, items[0].name, data['key']
   * @param {string} path - JSON path
   * @returns {Array} Array of path parts
   */
  parseJSONPath(path) {
    // Input validation to prevent ReDoS attacks
    if (!path || typeof path !== 'string' || path.length > 1000) {
      return [];
    }

    const parts = [];
    let i = 0;
    
    while (i < path.length) {
      // Skip dots
      if (path[i] === '.') {
        i++;
        continue;
      }
      
      // Handle property names (letters, numbers, underscore)
      if (/[a-zA-Z_$]/.test(path[i])) {
        let propertyName = '';
        while (i < path.length && /[a-zA-Z0-9_$]/.test(path[i])) {
          propertyName += path[i];
          i++;
        }
        if (propertyName) {
          parts.push({ type: 'property', value: propertyName });
        }
        continue;
      }
      
      // Handle bracket notation
      if (path[i] === '[') {
        i++; // Skip opening bracket
        let bracketContent = '';
        let bracketDepth = 1;
        
        // Find matching closing bracket
        while (i < path.length && bracketDepth > 0) {
          if (path[i] === '[') {bracketDepth++;}
          else if (path[i] === ']') {bracketDepth--;}
          else {bracketContent += path[i];}
          i++;
        }
        
        if (bracketDepth === 0) {
          bracketContent = bracketContent.trim();
          if (bracketContent.match(/^['"](.*)['"]$/)) {
            // String key: ['key']
            const key = bracketContent.replace(/^['"]|['"]$/g, '');
            parts.push({ type: 'property', value: key });
          } else if (bracketContent.match(/^\d+$/)) {
            // Numeric index: [0]
            parts.push({ type: 'index', value: bracketContent });
          }
        }
        continue;
      }
      
      // Skip invalid characters
      i++;
    }
    
    return parts;
  }

  /**
   * Validate node graph
   * @param {Array} nodes - React Flow nodes
   * @param {Array} edges - React Flow edges
   * @returns {Object} Validation result
   */
  validate(nodes, edges) {
    const errors = [];

    // Check for trigger node
    const triggerNodes = nodes.filter(n => n.type === 'trigger');
    if (triggerNodes.length === 0) {
      errors.push('Plugin must have exactly one trigger node');
    } else if (triggerNodes.length > 1) {
      errors.push('Plugin can only have one trigger node');
    }

    // Check for response node
    const responseNodes = nodes.filter(n => n.type === 'response');
    if (responseNodes.length === 0) {
      errors.push('Plugin must have at least one response node');
    }

    // Check for orphaned nodes
    const connectedNodes = new Set();
    for (const edge of edges) {
      connectedNodes.add(edge.source);
      connectedNodes.add(edge.target);
    }

    const triggerNode = triggerNodes[0];
    if (triggerNode) {
      connectedNodes.add(triggerNode.id);
    }

    for (const node of nodes) {
      if (!connectedNodes.has(node.id) && node.type !== 'trigger') {
        errors.push(`Node "${node.data.label || node.id}" is not connected`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export default NodeCompiler;

