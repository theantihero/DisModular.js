/**
 * Array Operation Node Component
 * Performs operations on arrays
 * @author fkndean_
 * @date 2025-10-14
 */

import { _Handle, Position } from 'reactflow';
import { useNodeHover } from '../../utils/nodeHover';

export function ArrayOperationNode({ data, id }) {
  const operation = data.config?.operation || 'create';
  const hoverHandlers = useNodeHover(id);
  const operations = {
    create: 'Create Array',
    push: 'Push Item',
    pop: 'Pop Item',
    filter: 'Filter Array',
    map: 'Map Array',
    length: 'Get Length',
    join: 'Join Array',
    slice: 'Slice Array'
  };

  return (
    <div className="bg-teal-600 text-white rounded-lg shadow-lg border-2 border-teal-700 min-w-[180px]">
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-teal-400" style={{ top: -6 }} {...hoverHandlers} />
      
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 mb-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
          <div className="font-semibold">{data.label || 'Array Operation'}</div>
        </div>
        
        <div className="text-xs bg-teal-700 px-2 py-1 rounded">
          {operations[operation]}
        </div>
      </div>
      
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-teal-400" style={{ bottom: -6 }} {...hoverHandlers} />
    </div>
  );
}

export default ArrayOperationNode;

