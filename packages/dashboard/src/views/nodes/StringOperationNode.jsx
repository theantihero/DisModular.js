/**
 * String Operation Node Component
 * Performs operations on strings
 * @author fkndean_
 * @date 2025-10-14
 */

import { _Handle, Position } from 'reactflow';
import { useNodeHover } from '../../utils/nodeHover';

export function StringOperationNode({ data, id }) {
  const operation = data.config?.operation || 'concat';
  const input = data.config?.input || '';
  const conditions = data.config?.conditions || [];
  const resultVar = data.config?.resultVar || '';
  const hoverHandlers = useNodeHover(id);
  
  const operations = {
    concat: 'Concatenate',
    split: 'Split',
    replace: 'Replace',
    match: 'Match Pattern',
    uppercase: 'Uppercase',
    lowercase: 'Lowercase',
    trim: 'Trim',
    substring: 'Substring',
    join: 'Join Array',
    condition: 'Conditional Map',
    length: 'Get Length',
    includes: 'Contains Text',
    startsWith: 'Starts With',
    endsWith: 'Ends With'
  };

  return (
    <div className="bg-emerald-600 text-white rounded-lg shadow-lg border-2 border-emerald-700 min-w-[180px] max-w-[280px]">
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-emerald-400" style={{ top: -6 }} {...hoverHandlers} />
      
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 mb-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <div className="font-semibold">{data.label || 'String Operation'}</div>
        </div>
        
        <div className="text-xs space-y-1">
          <div className="bg-emerald-700 px-2 py-1 rounded">
            {operations[operation]}
          </div>
          
          {input && (
            <div className="bg-emerald-800 px-2 py-1 rounded text-emerald-100" title={input}>
              Input: {input.length > 20 ? `${input.substring(0, 20)}...` : input}
            </div>
          )}
          
          {operation === 'condition' && conditions.length > 0 && (
            <div className="space-y-1">
              <div className="text-emerald-200 text-xs font-medium">Mappings:</div>
              {conditions.slice(0, 3).map((condition, index) => (
                <div key={index} className="bg-emerald-800 px-2 py-1 rounded text-xs">
                  <div className="text-emerald-200">{condition.if} → {condition.then}</div>
                </div>
              ))}
              {conditions.length > 3 && (
                <div className="text-emerald-300 text-xs px-2">
                  +{conditions.length - 3} more mapping{conditions.length - 3 !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          )}
          
          {resultVar && (
            <div className="bg-emerald-900 px-2 py-1 rounded text-emerald-200 text-xs">
              → {resultVar}
            </div>
          )}
        </div>
      </div>
      
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-emerald-400" style={{ bottom: -6 }} {...hoverHandlers} />
    </div>
  );
}

export default StringOperationNode;

