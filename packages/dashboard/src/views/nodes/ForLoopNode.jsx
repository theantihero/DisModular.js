/**
 * For Loop Node Component
 * Iterates over an array
 * @author fkndean_
 * @date 2025-10-14
 */

import { Handle, Position } from 'reactflow';
import { useNodeHover } from '../../utils/nodeHover';

/**
 * ForLoopNode Component
 * @param {Object} props - Node props
 */
export function ForLoopNode({ data, id }) {
  const arrayVar = data.config?.arrayVar || '';
  const iteratorVar = data.config?.iteratorVar || 'item';
  const hoverHandlers = useNodeHover(id);

  return (
    <div className="bg-pink-600 text-white rounded-lg shadow-lg border-2 border-pink-700 min-w-[180px]">
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-pink-400" style={{ top: -6 }} {...hoverHandlers} />
      
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 mb-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <div className="font-semibold">{data.label || 'For Loop'}</div>
        </div>
        
        <div className="text-xs space-y-1">
          {arrayVar && (
            <div className="bg-pink-700 px-2 py-1 rounded font-mono">
              for {iteratorVar} in {`{${arrayVar}}`}
            </div>
          )}
        </div>
      </div>
      
      <Handle
        type="source"
        position={Position.Bottom}
        id="loop-body"
        className="w-3 h-3 bg-pink-400"
        style={{ left: '30%', bottom: -6 }}
        {...hoverHandlers}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="complete"
        className="w-3 h-3 bg-pink-400"
        style={{ left: '70%', bottom: -6 }}
        {...hoverHandlers}
      />
    </div>
  );
}

export default ForLoopNode;

