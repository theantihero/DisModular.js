/**
 * Variable Node Component
 * Node that stores and manages variables
 * @author fkndean_
 * @date 2025-10-14
 */

import { Handle, Position } from 'reactflow';
import { useNodeHover } from '../../utils/nodeHover';

/**
 * Variable Node
 */
export function VariableNode({ data, id }) {
  const varName = data.config?.name || 'variable';
  const varType = data.config?.type || 'string';
  const hoverHandlers = useNodeHover(id);

  return (
    <div className="bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg shadow-lg p-4 min-w-[180px] border-2 border-purple-700">
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-purple-400 !border-2 !border-white"
        style={{ left: -6 }}
        {...hoverHandlers}
      />

      <div className="flex items-center gap-2 mb-2">
        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
        <div className="text-white font-semibold text-sm">VARIABLE</div>
      </div>
      
      <div className="text-white font-medium mb-1">{data.label || 'Set Variable'}</div>
      
      <div className="text-purple-100 text-xs mt-2 space-y-1">
        <div className="px-2 py-1 bg-purple-700 bg-opacity-30 rounded">
          {varName}
        </div>
        <div className="text-purple-200 text-xs italic">{varType}</div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-purple-400 !border-2 !border-white"
        style={{ right: -6 }}
        {...hoverHandlers}
      />
    </div>
  );
}

export default VariableNode;

