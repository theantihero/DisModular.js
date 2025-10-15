/**
 * Node Configuration Panel
 * Comprehensive configuration for all node types
 * @author fkndean_
 * @date 2025-10-14
 */

import { getAvailableVariables, formatVariableDisplay } from '../utils/nodeAnalyzer.js';
import { useEffect } from 'react';

/**
 * Validate condition expression syntax
 * @param {string} condition - The condition expression to validate
 * @returns {boolean} - Whether the condition is valid
 */
const validateCondition = (condition) => {
  if (!condition || condition.trim() === '') return true; // Empty is valid
  
  try {
    // Basic syntax validation
    const balancedBrackets = (str) => {
      const stack = [];
      const brackets = { '[': ']', '(': ')', '{': '}' };
      for (let char of str) {
        if (brackets[char]) stack.push(char);
        else if (Object.values(brackets).includes(char)) {
          if (stack.length === 0) return false;
          const last = stack.pop();
          if (brackets[last] !== char) return false;
        }
      }
      return stack.length === 0;
    };
    
    const balancedQuotes = (str) => {
      let singleQuotes = 0;
      let doubleQuotes = 0;
      for (let char of str) {
        if (char === "'") singleQuotes++;
        if (char === '"') doubleQuotes++;
      }
      return singleQuotes % 2 === 0 && doubleQuotes % 2 === 0;
    };
    
    // Check for balanced brackets and quotes
    if (!balancedBrackets(condition)) return false;
    if (!balancedQuotes(condition)) return false;
    
    // Check for common syntax errors
    const invalidPatterns = [
      /&&\s*&&/,  // Double &&
      /\|\|\s*\|\|/,  // Double ||
      /==\s*===/,  // Mixed equality
      /!=\s*!==/,  // Mixed inequality
      /[^=!<>]\s*=\s*[^=]/,  // Single = instead of ==
    ];
    
    for (const pattern of invalidPatterns) {
      if (pattern.test(condition)) return false;
    }
    
    return true;
  } catch (error) {
    return false;
  }
};


/**
 * Helper function to update node config
 */
const updateConfig = (setNodes, nodeId, updates) => {
  setNodes((nds) =>
    nds.map((n) =>
      n.id === nodeId
        ? {
            ...n,
            data: {
              ...n.data,
              config: { ...n.data.config, ...updates }
            }
          }
        : n
    )
  );
};

/**
 * Node Configuration Panel Component
 */
export function NodeConfigPanel({ selectedNode, setNodes, onDelete, allNodes = [], allEdges = [] }) {
  if (!selectedNode) return null;

  const updateNodeConfig = (updates) => updateConfig(setNodes, selectedNode.id, updates);
  
  // Get condition type with default fallback
  const getConditionType = () => {
    return selectedNode?.data?.config?.conditionType || 'expression';
  };
  
  // Get available variables for this node
  const availableVariables = getAvailableVariables(selectedNode.id, allNodes, allEdges);

  return (
    <div className="w-80 bg-gray-800 border-l border-gray-700 p-4 overflow-y-auto">
      <h2 className="text-white text-xl font-bold mb-4">Node Properties</h2>
      
      {/* Available Variables Section */}
      {availableVariables.length > 0 && (
        <div className="mb-4 p-3 bg-gradient-to-r from-purple-900 to-indigo-900 bg-opacity-40 border border-purple-700 rounded-lg">
          <h3 className="text-purple-300 text-sm font-semibold mb-2 flex items-center gap-2">
            <span>💡</span>
            Available Variables
          </h3>
          <div className="flex flex-wrap gap-1">
            {availableVariables.slice(0, 10).map((v) => (
              <span
                key={v.name}
                className="px-2 py-1 bg-purple-700 bg-opacity-50 text-purple-200 text-xs rounded border border-purple-600 hover:bg-purple-600 cursor-help"
                title={`${v.type} from ${v.source}`}
              >
                {'{' + v.name + '}'}
              </span>
            ))}
            {availableVariables.length > 10 && (
              <span className="px-2 py-1 text-purple-400 text-xs">
                +{availableVariables.length - 10} more
              </span>
            )}
          </div>
          <p className="text-purple-400 text-xs mt-2">
            ℹ️ Click variable names in dropdowns below to insert them
          </p>
        </div>
      )}
      
      <div className="space-y-4">
        {/* Node Type Display */}
        <div>
          <label className="text-gray-400 text-sm">Node Type</label>
          <div className="text-white font-semibold capitalize">{selectedNode.type.replace('_', ' ')}</div>
        </div>

        {/* Label (common to all nodes) */}
        <div>
          <label className="text-gray-400 text-sm">Label</label>
          <input
            type="text"
            value={selectedNode.data.label || ''}
            onChange={(e) => {
              setNodes((nds) =>
                nds.map((n) =>
                  n.id === selectedNode.id
                    ? { ...n, data: { ...n.data, label: e.target.value } }
                    : n
                )
              );
            }}
            className="w-full mt-1 px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Trigger Node */}
        {selectedNode.type === 'trigger' && (
          <div className="text-gray-300 text-sm bg-gradient-to-r from-green-900 to-green-800 bg-opacity-30 p-3 rounded border border-green-700">
            <p className="font-semibold mb-2 flex items-center gap-2">
              <span>▶️</span>
              Starting Point
            </p>
            <p className="text-xs mb-2">This node triggers when your command is executed. Every plugin needs exactly ONE trigger node.</p>
            <div className="text-xs text-green-300 bg-green-900 bg-opacity-30 p-2 rounded mt-2">
              💡 <strong>Tip:</strong> Connect this to Variable nodes first to get user input, then build your logic!
            </div>
          </div>
        )}

        {/* Response Node */}
        {selectedNode.type === 'response' && (
          <>
            <div className="text-xs text-gray-400 bg-gray-700 p-2 rounded mb-3">
              <strong>💬 Response Node:</strong> Sends a text message back to the user
            </div>
            <div>
              <label className="text-gray-400 text-sm">Message</label>
              <textarea
                value={selectedNode.data.config?.message || ''}
                onChange={(e) => updateNodeConfig({ message: e.target.value })}
                rows={4}
                className="w-full mt-1 px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
                placeholder="Enter your response message... Use {variableName} for variables"
              />
              <p className="text-gray-400 text-xs mt-1">💡 Use {'{variableName}'} to insert variables</p>
            </div>
            <div className="text-xs text-gray-400 bg-gray-750 p-2 rounded mt-2">
              <strong>Examples:</strong><br/>
              • Hello, {'{username}'}!<br/>
              • Your score is: {'{points}'}<br/>
              • The weather in {'{city}'} is {'{temperature}'}°C
            </div>
          </>
        )}

        {/* Variable Node */}
        {selectedNode.type === 'variable' && (
          <>
            <div className="text-xs text-gray-400 bg-gray-700 p-2 rounded mb-3">
              <strong>📦 Variable Node:</strong> Store and retrieve data for use in your command
            </div>
            <div>
              <label className="text-gray-400 text-sm">Variable Name</label>
              <input
                type="text"
                value={selectedNode.data.config?.name || ''}
                onChange={(e) => updateNodeConfig({ name: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
                placeholder="myVariable"
              />
              <p className="text-gray-500 text-xs mt-1">Name to reference this variable later using {'{myVariable}'}</p>
            </div>
            <div>
              <label className="text-gray-400 text-sm">Variable Type</label>
              <select
                value={selectedNode.data.config?.type || 'string'}
                onChange={(e) => updateNodeConfig({ type: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
              >
                <option value="string">Custom String (enter your own value)</option>
                <option value="user_input">User Input (from slash command option)</option>
                <option value="user_name">User Name (who ran the command)</option>
                <option value="user_id">User ID (Discord ID)</option>
                <option value="channel_id">Channel ID (where command was used)</option>
                <option value="guild_id">Server/Guild ID</option>
                <option value="random_number">Random Number</option>
                <option value="timestamp">Current Timestamp</option>
              </select>
            </div>
            {selectedNode.data.config?.type === 'string' && (
              <>
                <div>
                  <label className="text-gray-400 text-sm">Value</label>
                  <input
                    type="text"
                    value={selectedNode.data.config?.value || ''}
                    onChange={(e) => updateNodeConfig({ value: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
                    placeholder="Enter value or use {variableName}"
                  />
                </div>
                {availableVariables.length > 0 && (
                  <div>
                    <label className="text-gray-400 text-sm flex items-center gap-1">
                      <span>💡</span>
                      Available Variables
                    </label>
                    <select
                      onChange={(e) => {
                        const currentValue = selectedNode.data.config?.value || '';
                        const newValue = currentValue ? `${currentValue} {${e.target.value}}` : `{${e.target.value}}`;
                        updateNodeConfig({ value: newValue });
                      }}
                      className="w-full mt-1 px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500 text-sm"
                      defaultValue=""
                    >
                      <option value="" disabled>Select a variable to insert</option>
                      {availableVariables.map((v) => (
                        <option key={v.name} value={v.name}>
                          {formatVariableDisplay(v)}
                        </option>
                      ))}
                    </select>
                    <p className="text-gray-500 text-xs mt-1">
                      ℹ️ Variables from connected previous nodes
                    </p>
                  </div>
                )}
              </>
            )}
            {selectedNode.data.config?.type === 'random_number' && (
              <>
                <div>
                  <label className="text-gray-400 text-sm">Min</label>
                  <input
                    type="number"
                    value={selectedNode.data.config?.min || '1'}
                    onChange={(e) => updateNodeConfig({ min: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Max</label>
                  <input
                    type="number"
                    value={selectedNode.data.config?.max || '100'}
                    onChange={(e) => updateNodeConfig({ max: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </>
            )}
          </>
        )}

        {/* Condition Node */}
        {selectedNode.type === 'condition' && (
          <>
            <div className="text-xs text-gray-400 bg-gray-700 p-3 rounded mb-3">
              <strong>ℹ️ Condition Node:</strong> Create if/else logic for your workflow. Choose from common patterns or write custom expressions.
            </div>
            
            {/* Condition Type Selection */}
            <div>
              <label className="text-gray-400 text-sm">Condition Type</label>
              <select
                value={getConditionType()}
                onChange={(e) => updateNodeConfig({ conditionType: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
              >
                <option value="expression">Custom Expression</option>
                <option value="variable">Variable Check</option>
                <option value="comparison">Value Comparison</option>
                <option value="multiple">Multiple Conditions</option>
              </select>
            </div>

            {/* Variable Check Builder */}
            {getConditionType() === 'variable' && (
              <div className="space-y-3">
                <div>
                  <label className="text-gray-400 text-sm">Variable Name</label>
                  <input
                    type="text"
                    value={selectedNode.data.config?.variableName || ''}
                    onChange={(e) => updateNodeConfig({ variableName: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
                    placeholder="count"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Check Type</label>
                  <select
                    value={selectedNode.data.config?.checkType || 'exists'}
                    onChange={(e) => updateNodeConfig({ checkType: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
                  >
                    <option value="exists">Variable Exists</option>
                    <option value="not_exists">Variable Does Not Exist</option>
                    <option value="truthy">Variable is Truthy</option>
                    <option value="falsy">Variable is Falsy</option>
                    <option value="empty">Variable is Empty</option>
                    <option value="not_empty">Variable is Not Empty</option>
                  </select>
                </div>
                <div className="bg-gray-800 p-2 rounded text-xs text-gray-300">
                  <strong>Generated:</strong> <code className="text-blue-300">
                    {selectedNode.data.config?.checkType === 'exists' && `variables['${selectedNode.data.config?.variableName || 'var'}'] !== undefined`}
                    {selectedNode.data.config?.checkType === 'not_exists' && `variables['${selectedNode.data.config?.variableName || 'var'}'] === undefined`}
                    {selectedNode.data.config?.checkType === 'truthy' && `variables['${selectedNode.data.config?.variableName || 'var'}']`}
                    {selectedNode.data.config?.checkType === 'falsy' && `!variables['${selectedNode.data.config?.variableName || 'var'}']`}
                    {selectedNode.data.config?.checkType === 'empty' && `!variables['${selectedNode.data.config?.variableName || 'var'}'] || variables['${selectedNode.data.config?.variableName || 'var'}'].length === 0`}
                    {selectedNode.data.config?.checkType === 'not_empty' && `variables['${selectedNode.data.config?.variableName || 'var'}'] && variables['${selectedNode.data.config?.variableName || 'var'}'].length > 0`}
                  </code>
                </div>
              </div>
            )}

            {/* Comparison Builder */}
            {getConditionType() === 'comparison' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-gray-400 text-sm">Left Value</label>
                    <input
                      type="text"
                      value={selectedNode.data.config?.leftValue || ''}
                      onChange={(e) => updateNodeConfig({ leftValue: e.target.value })}
                      className="w-full mt-1 px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
                      placeholder="variables['count']"
                    />
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm">Operator</label>
                    <select
                      value={selectedNode.data.config?.operator || '>'}
                      onChange={(e) => updateNodeConfig({ operator: e.target.value })}
                      className="w-full mt-1 px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
                    >
                      <option value="===">Equals (===)</option>
                      <option value="!==">Not Equals (!==)</option>
                      <option value=">">Greater Than (&gt;)</option>
                      <option value="<">Less Than (&lt;)</option>
                      <option value=">=">Greater or Equal (&gt;=)</option>
                      <option value="<=">Less or Equal (&lt;=)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Right Value</label>
                  <input
                    type="text"
                    value={selectedNode.data.config?.rightValue || ''}
                    onChange={(e) => updateNodeConfig({ rightValue: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
                    placeholder="5 or variables['max']"
                  />
                </div>
                <div className="bg-gray-800 p-2 rounded text-xs text-gray-300">
                  <strong>Generated:</strong> <code className="text-blue-300">
                    {selectedNode.data.config?.leftValue || 'left'} {selectedNode.data.config?.operator || '>'} {selectedNode.data.config?.rightValue || 'right'}
                  </code>
                </div>
              </div>
            )}

            {/* Multiple Conditions Builder */}
            {getConditionType() === 'multiple' && (
              <div className="space-y-3">
                <div>
                  <label className="text-gray-400 text-sm">Logic Type</label>
                  <select
                    value={selectedNode.data.config?.logicType || 'and'}
                    onChange={(e) => updateNodeConfig({ logicType: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
                  >
                    <option value="and">All Conditions Must Be True (AND)</option>
                    <option value="or">Any Condition Can Be True (OR)</option>
                  </select>
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Conditions</label>
                  <div className="mt-2 space-y-2">
                    {(selectedNode.data.config?.conditions || []).map((cond, index) => (
                      <div key={index} className="bg-gray-800 p-3 rounded-lg border border-gray-600">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-gray-400 text-xs">Condition {index + 1}</span>
                          <button
                            onClick={() => {
                              const newConditions = (selectedNode.data.config?.conditions || []).filter((_, i) => i !== index);
                              updateNodeConfig({ conditions: newConditions });
                            }}
                            className="text-red-400 hover:text-red-300 text-xs ml-auto"
                          >
                            Remove
                          </button>
                        </div>
                        <input
                          type="text"
                          value={cond || ''}
                          onChange={(e) => {
                            const newConditions = [...(selectedNode.data.config?.conditions || [])];
                            newConditions[index] = e.target.value;
                            updateNodeConfig({ conditions: newConditions });
                          }}
                          className="w-full px-2 py-1 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-blue-500 text-sm"
                          placeholder="variables['count'] > 5"
                        />
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        const newConditions = [...(selectedNode.data.config?.conditions || []), ''];
                        updateNodeConfig({ conditions: newConditions });
                      }}
                      className="w-full py-2 px-3 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg border border-gray-600 text-sm transition-colors"
                    >
                      + Add Condition
                    </button>
                  </div>
                </div>
                <div className="bg-gray-800 p-2 rounded text-xs text-gray-300">
                  <strong>Generated:</strong> <code className="text-blue-300">
                    {(selectedNode.data.config?.conditions || []).join(` ${selectedNode.data.config?.logicType === 'and' ? '&&' : '||'} `)}
                  </code>
                </div>
              </div>
            )}

            {/* Custom Expression */}
            {(getConditionType() === 'expression' || !selectedNode.data.config?.conditionType) && (
              <div>
                <label className="text-gray-400 text-sm">Condition Expression</label>
                <textarea
                  value={selectedNode.data.config?.condition || ''}
                  onChange={(e) => updateNodeConfig({ condition: e.target.value })}
                  rows={3}
                  className={`w-full mt-1 px-3 py-2 bg-gray-700 text-white rounded-lg border focus:outline-none font-mono text-sm ${
                    validateCondition(selectedNode.data.config?.condition || '') 
                      ? 'border-gray-600 focus:border-blue-500' 
                      : 'border-red-500 focus:border-red-400'
                  }`}
                  placeholder="e.g., variables['count'] > 5 && variables['status'] === 'active'"
                />
                
                {/* Validation feedback */}
                {selectedNode.data.config?.condition && (
                  <div className={`mt-2 text-xs p-2 rounded ${
                    validateCondition(selectedNode.data.config?.condition) 
                      ? 'text-green-300 bg-green-900 bg-opacity-30' 
                      : 'text-red-300 bg-red-900 bg-opacity-30'
                  }`}>
                    {validateCondition(selectedNode.data.config?.condition) 
                      ? '✅ Valid condition expression' 
                      : '❌ Invalid syntax - check brackets, quotes, and operators'
                    }
                  </div>
                )}
                
                <div className="mt-2 text-xs text-gray-400 space-y-1">
                  <p><strong>Tips:</strong></p>
                  <p>• Use <code className="text-blue-300">variables['name']</code> to access variables</p>
                  <p>• Use <code className="text-blue-300">&&</code> for AND logic, <code className="text-blue-300">||</code> for OR logic</p>
                  <p>• Use <code className="text-blue-300">===</code> for exact equality, <code className="text-blue-300">!==</code> for not equal</p>
                  <p>• Use <code className="text-blue-300">true</code> for always true, <code className="text-blue-300">false</code> for always false</p>
                </div>
              </div>
            )}

            {/* Auto-generate condition based on builder */}
            {(getConditionType() === 'variable' || 
              getConditionType() === 'comparison' || 
              getConditionType() === 'multiple') && (
              <div className="mt-3">
                <button
                  onClick={() => {
                    let generatedCondition = '';
                    
                    if (getConditionType() === 'variable') {
                      const varName = selectedNode.data.config?.variableName || 'var';
                      const checkType = selectedNode.data.config?.checkType || 'exists';
                      
                      switch (checkType) {
                        case 'exists': generatedCondition = `variables['${varName}'] !== undefined`; break;
                        case 'not_exists': generatedCondition = `variables['${varName}'] === undefined`; break;
                        case 'truthy': generatedCondition = `variables['${varName}']`; break;
                        case 'falsy': generatedCondition = `!variables['${varName}']`; break;
                        case 'empty': generatedCondition = `!variables['${varName}'] || variables['${varName}'].length === 0`; break;
                        case 'not_empty': generatedCondition = `variables['${varName}'] && variables['${varName}'].length > 0`; break;
                      }
                    } else if (getConditionType() === 'comparison') {
                      const left = selectedNode.data.config?.leftValue || 'left';
                      const op = selectedNode.data.config?.operator || '>';
                      const right = selectedNode.data.config?.rightValue || 'right';
                      generatedCondition = `${left} ${op} ${right}`;
                    } else if (getConditionType() === 'multiple') {
                      const conditions = selectedNode.data.config?.conditions || [];
                      const logicOp = selectedNode.data.config?.logicType === 'and' ? '&&' : '||';
                      generatedCondition = conditions.join(` ${logicOp} `);
                    }
                    
                    updateNodeConfig({ condition: generatedCondition });
                  }}
                  className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Generate Condition Expression
                </button>
              </div>
            )}
          </>
        )}

        {/* Permission Node */}
        {selectedNode.type === 'permission' && (
          <>
            <div>
              <label className="text-gray-400 text-sm">Check Type</label>
              <select
                value={selectedNode.data.config?.checkType || 'user_id'}
                onChange={(e) => updateNodeConfig({ checkType: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
              >
                <option value="user_id">User ID</option>
                <option value="role">Role ID</option>
                <option value="permission">Discord Permission</option>
              </select>
            </div>
            
            <div>
              <label className="text-gray-400 text-sm">Mode</label>
              <select
                value={selectedNode.data.config?.mode || 'whitelist'}
                onChange={(e) => updateNodeConfig({ mode: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
              >
                <option value="whitelist">Whitelist (Allow only these)</option>
                <option value="blacklist">Blacklist (Deny only these)</option>
              </select>
            </div>
            
            <div>
              <label className="text-gray-400 text-sm">
                {selectedNode.data.config?.checkType === 'user_id' ? 'User IDs' : 
                 selectedNode.data.config?.checkType === 'role' ? 'Role IDs' : 'Permissions'}
              </label>
              <textarea
                value={(selectedNode.data.config?.values || []).join('\n')}
                onChange={(e) => updateNodeConfig({ values: e.target.value.split('\n').filter(v => v.trim()) })}
                placeholder={
                  selectedNode.data.config?.checkType === 'permission' 
                    ? 'ADMINISTRATOR\nMANAGE_GUILD\nMANAGE_MESSAGES' 
                    : 'One ID per line'
                }
                className="w-full mt-1 px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500 font-mono text-sm"
                rows={5}
              />
              <p className="text-gray-400 text-xs mt-1">
                {selectedNode.data.config?.checkType === 'permission' 
                  ? 'Use Discord permission flags like ADMINISTRATOR, MANAGE_GUILD, etc.'
                  : 'Enter one ID per line'
                }
              </p>
            </div>
          </>
        )}

        {/* HTTP Request Node */}
        {selectedNode.type === 'http_request' && (
          <>
            <div>
              <label className="text-gray-400 text-sm">Method</label>
              <select
                value={selectedNode.data.config?.method || 'GET'}
                onChange={(e) => updateNodeConfig({ method: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
                <option value="PATCH">PATCH</option>
              </select>
            </div>
            <div>
              <label className="text-gray-400 text-sm">URL</label>
              <input
                type="text"
                value={selectedNode.data.config?.url || ''}
                onChange={(e) => updateNodeConfig({ url: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
                placeholder="https://api.example.com/data"
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm">Headers (JSON)</label>
              <textarea
                value={selectedNode.data.config?.headers || ''}
                onChange={(e) => updateNodeConfig({ headers: e.target.value })}
                rows={3}
                className="w-full mt-1 px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500 font-mono text-xs"
                placeholder='{"Authorization": "Bearer token"}'
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm">Body (JSON)</label>
              <textarea
                value={selectedNode.data.config?.body || ''}
                onChange={(e) => updateNodeConfig({ body: e.target.value })}
                rows={3}
                className="w-full mt-1 px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500 font-mono text-xs"
                placeholder='{"key": "value"}'
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm">Store Response In</label>
              <input
                type="text"
                value={selectedNode.data.config?.responseVar || ''}
                onChange={(e) => updateNodeConfig({ responseVar: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
                placeholder="responseData"
              />
            </div>
          </>
        )}

        {/* Math Operation Node */}
        {selectedNode.type === 'math_operation' && (
          <>
            <div>
              <label className="text-gray-400 text-sm">Operation</label>
              <select
                value={selectedNode.data.config?.operation || 'add'}
                onChange={(e) => updateNodeConfig({ operation: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
              >
                <option value="add">Add (+)</option>
                <option value="subtract">Subtract (-)</option>
                <option value="multiply">Multiply (*)</option>
                <option value="divide">Divide (/)</option>
                <option value="modulo">Modulo (%)</option>
                <option value="power">Power (**)</option>
              </select>
            </div>
            <div>
              <label className="text-gray-400 text-sm">First Value</label>
              <input
                type="text"
                value={selectedNode.data.config?.value1 || ''}
                onChange={(e) => updateNodeConfig({ value1: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
                placeholder="10 or {variableName}"
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm">Second Value</label>
              <input
                type="text"
                value={selectedNode.data.config?.value2 || ''}
                onChange={(e) => updateNodeConfig({ value2: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
                placeholder="5 or {variableName}"
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm">Store Result In</label>
              <input
                type="text"
                value={selectedNode.data.config?.resultVar || ''}
                onChange={(e) => updateNodeConfig({ resultVar: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
                placeholder="result"
              />
            </div>
          </>
        )}

        {/* String Operation Node */}
        {selectedNode.type === 'string_operation' && (
          <>
            <div>
              <label className="text-gray-400 text-sm">Operation</label>
              <select
                value={selectedNode.data.config?.operation || 'concat'}
                onChange={(e) => updateNodeConfig({ operation: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
              >
                <option value="concat">Concatenate</option>
                <option value="split">Split</option>
                <option value="join">Join Array</option>
                <option value="replace">Replace</option>
                <option value="match">Match Pattern</option>
                <option value="uppercase">Uppercase</option>
                <option value="lowercase">Lowercase</option>
                <option value="trim">Trim</option>
                <option value="substring">Substring</option>
                <option value="condition">Conditional Map</option>
                <option value="length">Get Length</option>
                <option value="includes">Contains Text</option>
                <option value="startsWith">Starts With</option>
                <option value="endsWith">Ends With</option>
              </select>
            </div>
            <div>
              <label className="text-gray-400 text-sm">Input String</label>
              <input
                type="text"
                value={selectedNode.data.config?.input || ''}
                onChange={(e) => updateNodeConfig({ input: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
                placeholder="text or {variableName}"
              />
            </div>
            {['concat', 'replace'].includes(selectedNode.data.config?.operation) && (
              <div>
                <label className="text-gray-400 text-sm">{selectedNode.data.config?.operation === 'concat' ? 'String to Add' : 'Search For'}</label>
                <input
                  type="text"
                  value={selectedNode.data.config?.param1 || ''}
                  onChange={(e) => updateNodeConfig({ param1: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
                />
              </div>
            )}
            {selectedNode.data.config?.operation === 'replace' && (
              <div>
                <label className="text-gray-400 text-sm">Replace With</label>
                <input
                  type="text"
                  value={selectedNode.data.config?.param2 || ''}
                  onChange={(e) => updateNodeConfig({ param2: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
                />
              </div>
            )}
            <div>
              <label className="text-gray-400 text-sm">Store Result In</label>
              <input
                type="text"
                value={selectedNode.data.config?.resultVar || ''}
                onChange={(e) => updateNodeConfig({ resultVar: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
                placeholder="result"
              />
            </div>
            
            {/* Conditions Configuration for Conditional Map */}
            {selectedNode.data.config?.operation === 'condition' && (
              <div>
                <label className="text-gray-400 text-sm">Conditional Mappings</label>
                <div className="mt-2 space-y-2">
                  {(selectedNode.data.config?.conditions || []).map((condition, index) => (
                    <div key={index} className="bg-gray-800 p-3 rounded-lg border border-gray-600">
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <div>
                          <label className="text-gray-500 text-xs">If Value</label>
                          <input
                            type="text"
                            value={condition.if || ''}
                            onChange={(e) => {
                              const newConditions = [...(selectedNode.data.config?.conditions || [])];
                              newConditions[index] = { ...newConditions[index], if: e.target.value };
                              updateNodeConfig({ conditions: newConditions });
                            }}
                            className="w-full mt-1 px-2 py-1 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-blue-500 text-sm"
                            placeholder="0 or 1,2,3"
                          />
                        </div>
                        <div>
                          <label className="text-gray-500 text-xs">Then Result</label>
                          <input
                            type="text"
                            value={condition.then || ''}
                            onChange={(e) => {
                              const newConditions = [...(selectedNode.data.config?.conditions || [])];
                              newConditions[index] = { ...newConditions[index], then: e.target.value };
                              updateNodeConfig({ conditions: newConditions });
                            }}
                            className="w-full mt-1 px-2 py-1 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-blue-500 text-sm"
                            placeholder="☀️"
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-gray-500 text-xs">
                          Supports comma-separated values (e.g., "1,2,3")
                        </div>
                        <button
                          onClick={() => {
                            const newConditions = (selectedNode.data.config?.conditions || []).filter((_, i) => i !== index);
                            updateNodeConfig({ conditions: newConditions });
                          }}
                          className="text-red-400 hover:text-red-300 text-xs"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      const newConditions = [...(selectedNode.data.config?.conditions || []), { if: '', then: '' }];
                      updateNodeConfig({ conditions: newConditions });
                    }}
                    className="w-full py-2 px-3 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg border border-gray-600 text-sm transition-colors"
                  >
                    + Add Condition
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Array Operation Node */}
        {selectedNode.type === 'array_operation' && (
          <>
            <div>
              <label className="text-gray-400 text-sm">Operation</label>
              <select
                value={selectedNode.data.config?.operation || 'push'}
                onChange={(e) => updateNodeConfig({ operation: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
              >
                <option value="push">Push</option>
                <option value="pop">Pop</option>
                <option value="shift">Shift</option>
                <option value="unshift">Unshift</option>
                <option value="length">Get Length</option>
                <option value="join">Join</option>
                <option value="slice">Slice</option>
              </select>
            </div>
            <div>
              <label className="text-gray-400 text-sm">Array Variable</label>
              <input
                type="text"
                value={selectedNode.data.config?.arrayVar || ''}
                onChange={(e) => updateNodeConfig({ arrayVar: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
                placeholder="myArray"
              />
            </div>
            {['push', 'unshift'].includes(selectedNode.data.config?.operation) && (
              <div>
                <label className="text-gray-400 text-sm">Value to Add</label>
                <input
                  type="text"
                  value={selectedNode.data.config?.value || ''}
                  onChange={(e) => updateNodeConfig({ value: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
                />
              </div>
            )}
            <div>
              <label className="text-gray-400 text-sm">Store Result In</label>
              <input
                type="text"
                value={selectedNode.data.config?.resultVar || ''}
                onChange={(e) => updateNodeConfig({ resultVar: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
                placeholder="result"
              />
            </div>
          </>
        )}

        {/* Embed Builder Node */}
        {selectedNode.type === 'embed_builder' && (
          <>
            <div>
              <label className="text-gray-400 text-sm">Title</label>
              <input
                type="text"
                value={selectedNode.data.config?.title || ''}
                onChange={(e) => updateNodeConfig({ title: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm">Description</label>
              <textarea
                value={selectedNode.data.config?.description || ''}
                onChange={(e) => updateNodeConfig({ description: e.target.value })}
                rows={3}
                className="w-full mt-1 px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm">Color (hex)</label>
              <input
                type="text"
                value={selectedNode.data.config?.color || '#0099ff'}
                onChange={(e) => updateNodeConfig({ color: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
                placeholder="#0099ff"
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm">Thumbnail URL</label>
              <input
                type="text"
                value={selectedNode.data.config?.thumbnail || ''}
                onChange={(e) => updateNodeConfig({ thumbnail: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm">Store Embed In</label>
              <input
                type="text"
                value={selectedNode.data.config?.embedVar || ''}
                onChange={(e) => updateNodeConfig({ embedVar: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
                placeholder="myEmbed"
              />
            </div>
            
            {/* Fields Configuration */}
            <div>
              <label className="text-gray-400 text-sm">Fields</label>
              <div className="mt-2 space-y-2">
                {(selectedNode.data.config?.fields || []).map((field, index) => (
                  <div key={index} className="bg-gray-800 p-3 rounded-lg border border-gray-600">
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div>
                        <label className="text-gray-500 text-xs">Name</label>
                        <input
                          type="text"
                          value={field.name || ''}
                          onChange={(e) => {
                            const newFields = [...(selectedNode.data.config?.fields || [])];
                            newFields[index] = { ...newFields[index], name: e.target.value };
                            updateNodeConfig({ fields: newFields });
                          }}
                          className="w-full mt-1 px-2 py-1 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-blue-500 text-sm"
                          placeholder="Field Name"
                        />
                      </div>
                      <div>
                        <label className="text-gray-500 text-xs">Value</label>
                        <input
                          type="text"
                          value={field.value || ''}
                          onChange={(e) => {
                            const newFields = [...(selectedNode.data.config?.fields || [])];
                            newFields[index] = { ...newFields[index], value: e.target.value };
                            updateNodeConfig({ fields: newFields });
                          }}
                          className="w-full mt-1 px-2 py-1 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-blue-500 text-sm"
                          placeholder="Field Value"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 text-gray-500 text-xs">
                        <input
                          type="checkbox"
                          checked={field.inline || false}
                          onChange={(e) => {
                            const newFields = [...(selectedNode.data.config?.fields || [])];
                            newFields[index] = { ...newFields[index], inline: e.target.checked };
                            updateNodeConfig({ fields: newFields });
                          }}
                          className="rounded"
                        />
                        Inline
                      </label>
                      <button
                        onClick={() => {
                          const newFields = (selectedNode.data.config?.fields || []).filter((_, i) => i !== index);
                          updateNodeConfig({ fields: newFields });
                        }}
                        className="text-red-400 hover:text-red-300 text-xs"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => {
                    const newFields = [...(selectedNode.data.config?.fields || []), { name: '', value: '', inline: false }];
                    updateNodeConfig({ fields: newFields });
                  }}
                  className="w-full py-2 px-3 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg border border-gray-600 text-sm transition-colors"
                >
                  + Add Field
                </button>
              </div>
            </div>
            
            {/* Footer Configuration */}
            <div>
              <label className="text-gray-400 text-sm">Footer Text</label>
              <input
                type="text"
                value={selectedNode.data.config?.footer?.text || ''}
                onChange={(e) => updateNodeConfig({ 
                  footer: { 
                    ...selectedNode.data.config?.footer, 
                    text: e.target.value 
                  } 
                })}
                className="w-full mt-1 px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
                placeholder="Footer text"
              />
            </div>
            
            {/* Timestamp Configuration */}
            <div>
              <label className="flex items-center gap-2 text-gray-400 text-sm">
                <input
                  type="checkbox"
                  checked={selectedNode.data.config?.timestamp || false}
                  onChange={(e) => updateNodeConfig({ timestamp: e.target.checked })}
                  className="rounded"
                />
                Include Timestamp
              </label>
            </div>
          </>
        )}

        {/* For Loop Node */}
        {selectedNode.type === 'for_loop' && (
          <>
            <div>
              <label className="text-gray-400 text-sm">Loop Variable</label>
              <input
                type="text"
                value={selectedNode.data.config?.variable || 'i'}
                onChange={(e) => updateNodeConfig({ variable: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm">Start Value</label>
              <input
                type="number"
                value={selectedNode.data.config?.start || '0'}
                onChange={(e) => updateNodeConfig({ start: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm">End Value</label>
              <input
                type="number"
                value={selectedNode.data.config?.end || '10'}
                onChange={(e) => updateNodeConfig({ end: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
              />
            </div>
          </>
        )}

        {/* Database Node */}
        {selectedNode.type === 'database' && (
          <>
            <div>
              <label className="text-gray-400 text-sm">Operation</label>
              <select
                value={selectedNode.data.config?.operation || 'get'}
                onChange={(e) => updateNodeConfig({ operation: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
              >
                <option value="get">Get</option>
                <option value="set">Set</option>
                <option value="delete">Delete</option>
              </select>
            </div>
            <div>
              <label className="text-gray-400 text-sm">Key</label>
              <input
                type="text"
                value={selectedNode.data.config?.key || ''}
                onChange={(e) => updateNodeConfig({ key: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
                placeholder="user_score"
              />
            </div>
            {selectedNode.data.config?.operation === 'set' && (
              <div>
                <label className="text-gray-400 text-sm">Value</label>
                <input
                  type="text"
                  value={selectedNode.data.config?.value || ''}
                  onChange={(e) => updateNodeConfig({ value: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
                />
              </div>
            )}
            {selectedNode.data.config?.operation === 'get' && (
              <div>
                <label className="text-gray-400 text-sm">Store Result In</label>
                <input
                  type="text"
                  value={selectedNode.data.config?.resultVar || ''}
                  onChange={(e) => updateNodeConfig({ resultVar: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
                  placeholder="userData"
                />
              </div>
            )}
          </>
        )}

        {/* JSON Node */}
        {selectedNode.type === 'json' && (
          <>
            <div>
              <label className="text-gray-400 text-sm">Operation</label>
              <select
                value={selectedNode.data.config?.operation || 'parse'}
                onChange={(e) => updateNodeConfig({ operation: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
              >
                <option value="parse">Parse (JSON string → Object)</option>
                <option value="stringify">Stringify (Object → JSON string)</option>
                <option value="extract">Extract (Get value from JSON path)</option>
              </select>
            </div>
            <div>
              <label className="text-gray-400 text-sm">Input Variable</label>
              <input
                type="text"
                value={selectedNode.data.config?.inputVar || ''}
                onChange={(e) => updateNodeConfig({ inputVar: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
                placeholder="jsonData"
              />
              <p className="text-gray-500 text-xs mt-1">
                Variable containing the JSON data
              </p>
            </div>
            {selectedNode.data.config?.operation === 'extract' && (
              <div>
                <label className="text-gray-400 text-sm">JSON Path</label>
                <input
                  type="text"
                  value={selectedNode.data.config?.path || ''}
                  onChange={(e) => updateNodeConfig({ path: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500 font-mono text-sm"
                  placeholder="data.weather.temp or items[0].name"
                />
                <p className="text-gray-500 text-xs mt-1">
                  Use dot notation (a.b.c) or brackets (a[0].b)
                </p>
              </div>
            )}
            <div>
              <label className="text-gray-400 text-sm">Output Variable</label>
              <input
                type="text"
                value={selectedNode.data.config?.outputVar || ''}
                onChange={(e) => updateNodeConfig({ outputVar: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
                placeholder="result"
              />
              <p className="text-gray-500 text-xs mt-1">
                Variable to store the result
              </p>
            </div>
            {selectedNode.data.config?.operation === 'parse' && (
              <div className="text-xs text-gray-400 bg-gray-700 p-2 rounded">
                <strong>Parse:</strong> Converts JSON string to JavaScript object
              </div>
            )}
            {selectedNode.data.config?.operation === 'stringify' && (
              <div className="text-xs text-gray-400 bg-gray-700 p-2 rounded">
                <strong>Stringify:</strong> Converts JavaScript object to JSON string
              </div>
            )}
            {selectedNode.data.config?.operation === 'extract' && (
              <div className="text-xs text-gray-400 bg-gray-700 p-2 rounded">
                <strong>Extract:</strong> Gets a specific value from JSON using path<br/>
                Examples: <code className="text-blue-300">data.temp</code>, <code className="text-blue-300">items[0]</code>
              </div>
            )}
          </>
        )}

        {/* Comparison Node */}
        {selectedNode.type === 'comparison' && (
          <>
            <div className="text-xs text-gray-400 bg-gray-700 p-2 rounded mb-3">
              <strong>ℹ️ Comparison Node:</strong> Compare two values and branch based on the result (true/false paths)
            </div>
            <div>
              <label className="text-gray-400 text-sm">Operator</label>
              <select
                value={selectedNode.data.config?.operator || '=='}
                onChange={(e) => updateNodeConfig({ operator: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
              >
                <option value="==">Equal (==)</option>
                <option value="!=">Not Equal (!=)</option>
                <option value=">">Greater Than (&gt;)</option>
                <option value="<">Less Than (&lt;)</option>
                <option value=">=">Greater or Equal (&gt;=)</option>
                <option value="<=">Less or Equal (&lt;=)</option>
                <option value="includes">Contains (includes)</option>
                <option value="startsWith">Starts With</option>
                <option value="endsWith">Ends With</option>
              </select>
            </div>
            <div>
              <label className="text-gray-400 text-sm">Left Value</label>
              <input
                type="text"
                value={selectedNode.data.config?.left || ''}
                onChange={(e) => updateNodeConfig({ left: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
                placeholder="e.g., {count} or 10"
              />
              <p className="text-gray-500 text-xs mt-1">First value to compare</p>
            </div>
            <div>
              <label className="text-gray-400 text-sm">Right Value</label>
              <input
                type="text"
                value={selectedNode.data.config?.right || ''}
                onChange={(e) => updateNodeConfig({ right: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
                placeholder="e.g., {maxCount} or 100"
              />
              <p className="text-gray-500 text-xs mt-1">Second value to compare</p>
            </div>
            <div className="text-xs text-gray-400 bg-gray-750 p-2 rounded">
              💡 <strong>Example:</strong> Compare {'{userAge}'} &gt; 18 to check if user is an adult
            </div>
          </>
        )}

        {/* Object Operation Node */}
        {selectedNode.type === 'object_operation' && (
          <>
            <div className="text-xs text-gray-400 bg-gray-700 p-2 rounded mb-3">
              <strong>ℹ️ Object Node:</strong> Create and manipulate JavaScript objects (key-value pairs)
            </div>
            <div>
              <label className="text-gray-400 text-sm">Operation</label>
              <select
                value={selectedNode.data.config?.operation || 'create'}
                onChange={(e) => updateNodeConfig({ operation: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
              >
                <option value="create">Create Object</option>
                <option value="get">Get Property</option>
                <option value="set">Set Property</option>
                <option value="delete">Delete Property</option>
                <option value="keys">Get Keys</option>
                <option value="values">Get Values</option>
                <option value="merge">Merge Objects</option>
              </select>
            </div>
            {selectedNode.data.config?.operation === 'create' && (
              <div>
                <label className="text-gray-400 text-sm">Properties (JSON)</label>
                <textarea
                  value={selectedNode.data.config?.properties || ''}
                  onChange={(e) => updateNodeConfig({ properties: e.target.value })}
                  rows={4}
                  className="w-full mt-1 px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500 font-mono text-xs"
                  placeholder='{"name": "{username}", "score": "{points}"}'
                />
                <p className="text-gray-500 text-xs mt-1">Create object with key-value pairs</p>
              </div>
            )}
            {['get', 'set', 'delete'].includes(selectedNode.data.config?.operation) && (
              <>
                <div>
                  <label className="text-gray-400 text-sm">Object Variable</label>
                  <input
                    type="text"
                    value={selectedNode.data.config?.objectVar || ''}
                    onChange={(e) => updateNodeConfig({ objectVar: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
                    placeholder="myObject"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Property Key</label>
                  <input
                    type="text"
                    value={selectedNode.data.config?.key || ''}
                    onChange={(e) => updateNodeConfig({ key: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
                    placeholder="propertyName"
                  />
                </div>
              </>
            )}
            {selectedNode.data.config?.operation === 'set' && (
              <div>
                <label className="text-gray-400 text-sm">Property Value</label>
                <input
                  type="text"
                  value={selectedNode.data.config?.value || ''}
                  onChange={(e) => updateNodeConfig({ value: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
                  placeholder="New value or {variable}"
                />
              </div>
            )}
            <div>
              <label className="text-gray-400 text-sm">Store Result In</label>
              <input
                type="text"
                value={selectedNode.data.config?.outputVar || ''}
                onChange={(e) => updateNodeConfig({ outputVar: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
                placeholder="result"
              />
            </div>
          </>
        )}

        {/* Discord Action Node */}
        {selectedNode.type === 'discord_action' && (
          <>
            <div className="text-xs text-gray-400 bg-gray-700 p-2 rounded mb-3">
              <strong>ℹ️ Discord Action:</strong> Perform Discord-specific actions like sending DMs, adding reactions, checking roles
            </div>
            <div>
              <label className="text-gray-400 text-sm">Action Type</label>
              <select
                value={selectedNode.data.config?.actionType || selectedNode.data.config?.action || 'send_dm'}
                onChange={(e) => updateNodeConfig({ actionType: e.target.value, action: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
              >
                <option value="send_message">Send Message</option>
                <option value="send_dm">Send DM to User</option>
                <option value="add_reaction">Add Reaction</option>
                <option value="add_multiple_reactions">Add Multiple Reactions</option>
                <option value="setup_single_choice_voting">Setup Single-Choice Voting</option>
                <option value="collect_reactions">Collect Reactions</option>
                <option value="check_role">Check User Role</option>
                <option value="add_role">Add Role to User</option>
                <option value="remove_role">Remove Role from User</option>
                <option value="kick_member">Kick Member</option>
                <option value="ban_member">Ban Member</option>
                <option value="timeout_member">Timeout Member</option>
                <option value="create_channel">Create Channel</option>
                <option value="delete_channel">Delete Channel</option>
                <option value="create_thread">Create Thread</option>
                <option value="delete_message">Delete Message</option>
              </select>
            </div>
            {selectedNode.data.config?.action === 'send_dm' && (
              <>
                <div>
                  <label className="text-gray-400 text-sm">User ID</label>
                  <input
                    type="text"
                    value={selectedNode.data.config?.userId || ''}
                    onChange={(e) => updateNodeConfig({ userId: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
                    placeholder="{user_id}"
                  />
                  <p className="text-gray-500 text-xs mt-1">Discord user ID to send DM to</p>
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Message</label>
                  <textarea
                    value={selectedNode.data.config?.message || ''}
                    onChange={(e) => updateNodeConfig({ message: e.target.value })}
                    rows={3}
                    className="w-full mt-1 px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
                    placeholder="Your DM message here. Use {variables} as needed."
                  />
                </div>
              </>
            )}
            {selectedNode.data.config?.action === 'add_reaction' && (
              <div>
                <label className="text-gray-400 text-sm">Emoji</label>
                <input
                  type="text"
                  value={selectedNode.data.config?.emoji || ''}
                  onChange={(e) => updateNodeConfig({ emoji: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
                  placeholder="👍 or :thumbsup:"
                />
                <p className="text-gray-500 text-xs mt-1">Emoji to add as reaction</p>
              </div>
            )}
            {(selectedNode.data.config?.actionType === 'add_multiple_reactions' || selectedNode.data.config?.action === 'add_multiple_reactions') && (
              <div>
                <label className="text-gray-400 text-sm">Emojis Variable</label>
                <input
                  type="text"
                  value={selectedNode.data.config?.emojis || ''}
                  onChange={(e) => updateNodeConfig({ emojis: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
                  placeholder="reaction_emojis or {reaction_emojis}"
                />
                <p className="text-gray-500 text-xs mt-1">Variable containing array of emojis</p>
              </div>
            )}
            {(selectedNode.data.config?.actionType === 'setup_single_choice_voting' || selectedNode.data.config?.action === 'setup_single_choice_voting') && (
              <>
                <div>
                  <label className="text-gray-400 text-sm">Emojis Variable</label>
                  <input
                    type="text"
                    value={selectedNode.data.config?.emojis || ''}
                    onChange={(e) => updateNodeConfig({ emojis: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
                    placeholder="reaction_emojis or {reaction_emojis}"
                  />
                  <p className="text-gray-500 text-xs mt-1">Variable containing array of poll emojis</p>
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Duration Variable (ms)</label>
                  <input
                    type="text"
                    value={selectedNode.data.config?.duration || ''}
                    onChange={(e) => updateNodeConfig({ duration: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
                    placeholder="duration_ms or {duration_ms}"
                  />
                  <p className="text-gray-500 text-xs mt-1">Variable containing poll duration in milliseconds</p>
                </div>
              </>
            )}
            {(selectedNode.data.config?.actionType === 'check_role' || selectedNode.data.config?.action === 'check_role') && (
              <>
                <div>
                  <label className="text-gray-400 text-sm">Role ID</label>
                  <input
                    type="text"
                    value={selectedNode.data.config?.roleId || ''}
                    onChange={(e) => updateNodeConfig({ roleId: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
                    placeholder="123456789012345678"
                  />
                  <p className="text-gray-500 text-xs mt-1">Discord role ID to check</p>
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Store Result In</label>
                  <input
                    type="text"
                    value={selectedNode.data.config?.outputVar || ''}
                    onChange={(e) => updateNodeConfig({ outputVar: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
                    placeholder="hasRole"
                  />
                  <p className="text-gray-500 text-xs mt-1">Variable will be true/false</p>
                </div>
              </>
            )}
          </>
        )}

        {/* Action Node */}
        {selectedNode.type === 'action' && (
          <>
            <div className="text-xs text-gray-400 bg-gray-700 p-2 rounded mb-3">
              <strong>ℹ️ Action Node:</strong> Perform general actions like logging, waiting, or setting state
            </div>
            <div>
              <label className="text-gray-400 text-sm">Action Type</label>
              <select
                value={selectedNode.data.config?.actionType || 'log'}
                onChange={(e) => updateNodeConfig({ actionType: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
              >
                <option value="log">Log Message</option>
                <option value="wait">Wait/Delay</option>
                <option value="set_state">Set State</option>
              </select>
            </div>
            {selectedNode.data.config?.actionType === 'log' && (
              <div>
                <label className="text-gray-400 text-sm">Log Message</label>
                <input
                  type="text"
                  value={selectedNode.data.config?.message || ''}
                  onChange={(e) => updateNodeConfig({ message: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
                  placeholder="Debug: {variableName}"
                />
                <p className="text-gray-500 text-xs mt-1">Message to log to console (useful for debugging)</p>
              </div>
            )}
            {selectedNode.data.config?.actionType === 'wait' && (
              <div>
                <label className="text-gray-400 text-sm">Duration (milliseconds)</label>
                <input
                  type="text"
                  value={selectedNode.data.config?.duration || ''}
                  onChange={(e) => updateNodeConfig({ duration: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
                  placeholder="1000 (1 second) or {duration_ms}"
                />
                <p className="text-gray-500 text-xs mt-1">1000 = 1 second, 60000 = 1 minute</p>
              </div>
            )}
            {selectedNode.data.config?.actionType === 'set_state' && (
              <>
                <div>
                  <label className="text-gray-400 text-sm">State Key</label>
                  <input
                    type="text"
                    value={selectedNode.data.config?.key || ''}
                    onChange={(e) => updateNodeConfig({ key: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
                    placeholder="myStateKey"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-sm">State Value</label>
                  <input
                    type="text"
                    value={selectedNode.data.config?.value || ''}
                    onChange={(e) => updateNodeConfig({ value: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
                    placeholder="Value or {variable}"
                  />
                </div>
              </>
            )}
          </>
        )}

        {/* Data Node */}
        {selectedNode.type === 'data' && (
          <>
            <div className="text-xs text-gray-400 bg-gray-700 p-2 rounded mb-3">
              <strong>ℹ️ Data Node:</strong> Retrieve Discord context data like server name, channel info, etc.
            </div>
            <div>
              <label className="text-gray-400 text-sm">Data Type</label>
              <select
                value={selectedNode.data.config?.dataType || 'server_name'}
                onChange={(e) => updateNodeConfig({ dataType: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
              >
                <option value="server_name">Server Name</option>
                <option value="channel_name">Channel Name</option>
                <option value="channel_id">Channel ID</option>
                <option value="server_id">Server ID</option>
                <option value="timestamp">Current Timestamp</option>
                <option value="member_count">Member Count</option>
              </select>
            </div>
            <div>
              <label className="text-gray-400 text-sm">Store In Variable</label>
              <input
                type="text"
                value={selectedNode.data.config?.name || ''}
                onChange={(e) => updateNodeConfig({ name: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
                placeholder="serverName"
              />
              <p className="text-gray-500 text-xs mt-1">Variable name to store the data</p>
            </div>
            <div className="text-xs text-gray-400 bg-gray-750 p-2 rounded">
              💡 <strong>Example:</strong> Get server name and use it in a welcome message
            </div>
          </>
        )}

        {/* While Loop Node */}
        {selectedNode.type === 'while_loop' && (
          <>
            <div className="text-xs text-gray-400 bg-gray-700 p-2 rounded mb-3">
              <strong>⚠️ While Loop:</strong> Repeats while condition is true. Be careful to avoid infinite loops!
            </div>
            <div>
              <label className="text-gray-400 text-sm">Condition</label>
              <input
                type="text"
                value={selectedNode.data.config?.condition || ''}
                onChange={(e) => updateNodeConfig({ condition: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
                placeholder="variables['counter'] < 10"
              />
              <p className="text-gray-500 text-xs mt-1">Loop continues while this is true</p>
            </div>
            <div>
              <label className="text-gray-400 text-sm">Max Iterations (Safety)</label>
              <input
                type="number"
                value={selectedNode.data.config?.maxIterations || '1000'}
                onChange={(e) => updateNodeConfig({ maxIterations: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
                placeholder="1000"
              />
              <p className="text-gray-500 text-xs mt-1">Prevents infinite loops</p>
            </div>
            <div className="text-xs text-yellow-400 bg-yellow-900 bg-opacity-20 p-2 rounded">
              ⚠️ <strong>Important:</strong> Make sure your loop condition can become false, otherwise it will hit the max iteration limit!
            </div>
          </>
        )}

        {/* Embed Response Node */}
        {selectedNode.type === 'embed_response' && (
          <>
            <div className="text-xs text-gray-400 bg-gray-700 p-2 rounded mb-3">
              <strong>ℹ️ Embed Response:</strong> Sends a Discord embed (must connect from an Embed Builder node)
            </div>
            <div>
              <label className="text-gray-400 text-sm">Embed Variable</label>
              <input
                type="text"
                value={selectedNode.data.config?.embedVar || ''}
                onChange={(e) => updateNodeConfig({ embedVar: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
                placeholder="myEmbed"
              />
              <p className="text-gray-500 text-xs mt-1">Variable containing the embed from Embed Builder node</p>
            </div>
            <div>
              <label className="text-gray-400 text-sm flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedNode.data.config?.ephemeral || false}
                  onChange={(e) => updateNodeConfig({ ephemeral: e.target.checked })}
                  className="rounded"
                />
                <span>Ephemeral (Only visible to command user)</span>
              </label>
              <p className="text-gray-500 text-xs mt-1">When checked, only the user who ran the command can see the response</p>
            </div>
            <div className="text-xs text-gray-400 bg-gray-750 p-2 rounded">
              💡 <strong>Tip:</strong> Connect this to an Embed Builder node's output
            </div>
          </>
        )}

        {/* Delete Button */}
        <button
          onClick={onDelete}
          className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Delete Node
        </button>
      </div>
    </div>
  );
}

export default NodeConfigPanel;

