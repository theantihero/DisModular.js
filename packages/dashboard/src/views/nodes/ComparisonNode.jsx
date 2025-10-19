/**
 * Comparison Node Component
 * Compares values and outputs boolean
 * @author fkndean_
 * @date 2025-10-14
 */

import { Handle, Position } from 'reactflow';
import { useNodeHover } from '../../utils/nodeHover';

export function ComparisonNode({ data, id }) {
  const operator = data.config?.operator || '==';
  const hoverHandlers = useNodeHover(id);
  const operators = {
    '==': 'Equals',
    '!=': 'Not Equals',
    '>': 'Greater Than',
    '<': 'Less Than',
    '>=': 'Greater or Equal',
    '<=': 'Less or Equal',
    'includes': 'Includes',
    'startsWith': 'Starts With',
    'endsWith': 'Ends With'
  };

  return (
    <div className="bg-yellow-600 text-white rounded-lg shadow-lg border-2 border-yellow-700 min-w-[160px]">
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-yellow-400" style={{ top: -6 }} {...hoverHandlers} />
      
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 mb-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <div className="font-semibold">{data.label || 'Compare'}</div>
        </div>
        
        <div className="text-xs bg-yellow-700 px-2 py-1 rounded text-center font-mono">
          {operators[operator]}
        </div>
      </div>
      
      <Handle type="source" position={Position.Bottom} id="true" className="w-3 h-3 bg-green-400" style={{ left: '30%', bottom: -6 }} {...hoverHandlers} />
      <Handle type="source" position={Position.Bottom} id="false" className="w-3 h-3 bg-red-400" style={{ left: '70%', bottom: -6 }} {...hoverHandlers} />
    </div>
  );
}

export default ComparisonNode;

