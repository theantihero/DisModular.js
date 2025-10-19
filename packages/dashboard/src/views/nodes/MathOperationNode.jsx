/**
 * Math Operation Node Component
 * Performs mathematical operations
 * @author fkndean_
 * @date 2025-10-14
 */

import { _Handle, Position } from 'reactflow';
import { useNodeHover } from '../../utils/nodeHover';

export function MathOperationNode({ data, id }) {
  const operation = data.config?.operation || 'add';
  const hoverHandlers = useNodeHover(id);
  const symbols = {
    add: '+', subtract: '-', multiply: '×', divide: '÷',
    modulo: '%', power: '^', sqrt: '√', abs: '|x|'
  };

  return (
    <div className="bg-amber-600 text-white rounded-lg shadow-lg border-2 border-amber-700 min-w-[160px]">
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-amber-400" style={{ top: -6 }} {...hoverHandlers} />
      
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 mb-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <div className="font-semibold">{data.label || 'Math'}</div>
        </div>
        
        <div className="text-xs bg-amber-700 px-2 py-1 rounded text-center font-bold text-lg">
          {symbols[operation]}
        </div>
      </div>
      
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-amber-400" style={{ bottom: -6 }} {...hoverHandlers} />
    </div>
  );
}

export default MathOperationNode;

