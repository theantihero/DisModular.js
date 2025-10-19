/**
 * While Loop Node Component
 * Loops while condition is true
 * @author fkndean_
 * @date 2025-10-14
 */

import { _Handle, Position } from 'reactflow';
import { useNodeHover } from '../../utils/nodeHover';

export function WhileLoopNode({ data, id }) {
  const condition = data.config?.condition || '';
  const hoverHandlers = useNodeHover(id);

  return (
    <div className="bg-pink-500 text-white rounded-lg shadow-lg border-2 border-pink-600 min-w-[180px]">
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-pink-300" style={{ top: -6 }} {...hoverHandlers} />
      
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 mb-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <div className="font-semibold">{data.label || 'While Loop'}</div>
        </div>
        
        {condition && (
          <div className="text-xs bg-pink-600 px-2 py-1 rounded font-mono truncate">
            while {condition}
          </div>
        )}
      </div>
      
      <Handle type="source" position={Position.Bottom} id="loop-body" className="w-3 h-3 bg-pink-300" style={{ left: '30%', bottom: -6 }} {...hoverHandlers} />
      <Handle type="source" position={Position.Bottom} id="complete" className="w-3 h-3 bg-pink-300" style={{ left: '70%', bottom: -6 }} {...hoverHandlers} />
    </div>
  );
}

export default WhileLoopNode;

