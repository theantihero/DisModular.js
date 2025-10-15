/**
 * Trigger Node Component
 * Node that triggers plugin execution
 * @author fkndean_
 * @date 2025-10-14
 */

import { Handle, Position } from 'reactflow';
import { useNodeHover } from '../../utils/nodeHover';

/**
 * Trigger Node
 */
export function TriggerNode({ data, id }) {
  const hoverHandlers = useNodeHover(id);
  return (
    <div className="bg-gradient-to-br from-green-400 to-green-600 rounded-lg shadow-lg p-4 min-w-[200px] border-2 border-green-700">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-3 h-3 rounded-full bg-white animate-pulse"></div>
        <div className="text-white font-semibold text-sm">TRIGGER</div>
      </div>
      
      <div className="text-white font-medium mb-1">{data.label || 'Command Trigger'}</div>
      
      {data.config?.command && (
        <div className="text-green-100 text-xs mt-2 px-2 py-1 bg-green-700 bg-opacity-30 rounded">
          /{data.config.command}
        </div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-green-400 !border-2 !border-white"
        style={{ right: -6 }}
        {...hoverHandlers}
      />
    </div>
  );
}

export default TriggerNode;

