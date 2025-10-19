/**
 * Action Node Component
 * Node that performs various actions
 * @author fkndean_
 * @date 2025-10-14
 */

import { _Handle, Position } from 'reactflow';
import { useNodeHover } from '../../utils/nodeHover';

/**
 * Action Node
 */
export function ActionNode({ data, id }) {
  const actionType = data.config?.actionType || 'log';
  const hoverHandlers = useNodeHover(id);
  
  const actionIcons = {
    log: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    ),
    wait: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    ),
    set_state: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
    )
  };

  return (
    <div className="bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg shadow-lg p-4 min-w-[180px] border-2 border-orange-700">
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-orange-400 !border-2 !border-white"
        style={{ left: -6 }}
        {...hoverHandlers}
      />

      <div className="flex items-center gap-2 mb-2">
        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {actionIcons[actionType] || actionIcons.log}
        </svg>
        <div className="text-white font-semibold text-sm">ACTION</div>
      </div>
      
      <div className="text-white font-medium mb-1">{data.label || 'Do Something'}</div>
      
      <div className="text-orange-100 text-xs mt-2 px-2 py-1 bg-orange-700 bg-opacity-30 rounded capitalize">
        {actionType.replace('_', ' ')}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-orange-400 !border-2 !border-white"
        style={{ right: -6 }}
        {...hoverHandlers}
      />
    </div>
  );
}

export default ActionNode;

