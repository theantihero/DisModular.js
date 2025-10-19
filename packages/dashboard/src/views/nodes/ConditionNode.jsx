/**
 * Condition Node Component
 * Node that implements if/else logic
 * @author fkndean_
 * @date 2025-10-14
 */

import { _Handle, Position } from 'reactflow';
import { useState } from 'react';
import { useNodeHover } from '../../utils/nodeHover';

/**
 * Condition Node
 */
export function ConditionNode({ data, id }) {
  const condition = data.config?.condition || 'true';
  const conditionType = data.config?.conditionType || 'expression';
  
  // State for interactive features
  const [isHovered, setIsHovered] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Node hover handlers
  const hoverHandlers = useNodeHover(id);
  
  // Parse condition for better display based on conditionType
  const parseCondition = (cond, type) => {
    // Handle simple boolean values
    if (!cond || cond === 'true') return { type: 'simple', text: 'Always True' };
    if (cond === 'false') return { type: 'simple', text: 'Always False' };
    
    // Use the configured conditionType to determine display
    switch (type) {
      case 'expression':
        return { type: 'custom', text: 'Custom Expression' };
      case 'comparison':
        return { type: 'comparison', text: 'Value Comparison' };
      case 'variable':
        return { type: 'variable', text: 'Variable Check' };
      case 'multiple':
        return { type: 'complex', text: 'Multiple Conditions' };
      default:
        // Fallback to content-based detection if type is not specified
        if (cond.includes('&&')) return { type: 'complex', text: 'Multiple Conditions (AND)' };
        if (cond.includes('||')) return { type: 'complex', text: 'Multiple Conditions (OR)' };
        if (cond.includes('>') || cond.includes('<') || cond.includes('===') || cond.includes('!==')) {
          return { type: 'comparison', text: 'Value Comparison' };
        }
        if (cond.includes('variables[')) return { type: 'variable', text: 'Variable Check' };
        return { type: 'custom', text: 'Custom Expression' };
    }
  };
  
  const parsed = parseCondition(condition, conditionType);
  const truncated = condition.length > 40 ? condition.substring(0, 40) + '...' : condition;
  const shouldShowExpand = condition.length > 40;

  return (
    <div 
      className={`bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg shadow-lg p-4 min-w-[220px] max-w-[280px] border-2 border-yellow-700 transition-all duration-200 ${
        isHovered ? 'shadow-xl scale-105' : 'shadow-lg'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-yellow-400 !border-2 !border-white"
        style={{ left: -6 }}
        {...hoverHandlers}
      />

      <div className="flex items-center gap-2 mb-3">
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div className="text-white font-semibold text-sm">IF/ELSE</div>
      </div>
      
      <div className="text-white font-medium mb-2 text-center">{data.label || 'Condition'}</div>
      
      {/* Condition Type Indicator */}
      <div className="mb-2">
        <div className={`text-xs px-2 py-1 rounded-full text-center font-medium ${
          parsed.type === 'simple' ? 'bg-green-500 text-white' :
          parsed.type === 'comparison' ? 'bg-blue-500 text-white' :
          parsed.type === 'variable' ? 'bg-purple-500 text-white' :
          parsed.type === 'complex' ? 'bg-orange-500 text-white' :
          'bg-gray-500 text-white'
        }`}>
          {parsed.text}
        </div>
      </div>
      
      {/* Full Condition Display */}
      <div 
        className="text-yellow-100 text-xs px-2 py-2 bg-yellow-800 bg-opacity-40 rounded font-mono leading-relaxed cursor-pointer transition-all duration-200 hover:bg-opacity-60"
        title={condition}
        onClick={() => shouldShowExpand && setIsExpanded(!isExpanded)}
      >
        {isExpanded ? condition : truncated}
        {shouldShowExpand && (
          <div className="text-yellow-200 text-xs mt-1 opacity-70">
            {isExpanded ? 'Click to collapse' : 'Click to expand'}
          </div>
        )}
      </div>

      {/* Output Handles */}
      <div className="relative mt-4">
        <Handle
          type="source"
          position={Position.Bottom}
          id="true"
          className="!w-4 !h-4 !bg-green-400 !border-2 !border-white hover:!bg-green-300 transition-colors"
          style={{ left: '25%', bottom: -8 }}
          {...hoverHandlers}
        />
        
        <Handle
          type="source"
          position={Position.Bottom}
          id="false"
          className="!w-4 !h-4 !bg-red-400 !border-2 !border-white hover:!bg-red-300 transition-colors"
          style={{ left: '75%', bottom: -8 }}
          {...hoverHandlers}
        />
      </div>
    </div>
  );
}

export default ConditionNode;