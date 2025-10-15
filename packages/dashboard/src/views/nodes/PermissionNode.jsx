/**
 * Permission Node Component
 * Node that implements access control logic
 * @author fkndean_
 * @date 2025-10-15
 */

import { Handle, Position } from 'reactflow';

/**
 * Permission Node
 */
export function PermissionNode({ data }) {
  const checkType = data.config?.checkType || 'user_id';
  const values = data.config?.values || [];
  const mode = data.config?.mode || 'whitelist';
  
  return (
    <div className="bg-gradient-to-br from-red-400 to-red-600 rounded-lg shadow-lg p-4 min-w-[200px] border-2 border-red-700">
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-red-400 !border-2 !border-white"
      />
      
      <div className="flex items-center gap-2 mb-2">
        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <div className="text-white font-semibold text-sm">PERMISSION</div>
      </div>
      
      <div className="text-white font-medium mb-1">{data.label || 'Check Permission'}</div>
      
      <div className="text-red-100 text-xs mt-2 space-y-1">
        <div className="px-2 py-1 bg-red-700 bg-opacity-30 rounded">
          {checkType}: {mode}
        </div>
        <div className="text-red-200 text-xs">{values.length} rule(s)</div>
      </div>

      <div className="flex justify-between mt-3">
        <div className="relative">
          <Handle
            type="source"
            position={Position.Right}
            id="allowed"
            className="!w-3 !h-3 !bg-green-400 !border-2 !border-white"
          />
          <span className="text-white text-xs font-bold absolute -bottom-5 left-0 bg-green-600 px-2 py-0.5 rounded">
            ALLOWED
          </span>
        </div>
        <div className="relative">
          <Handle
            type="source"
            position={Position.Right}
            id="denied"
            style={{ right: '-8px', left: 'auto' }}
            className="!w-3 !h-3 !bg-red-400 !border-2 !border-white"
          />
          <span className="text-white text-xs font-bold absolute -bottom-5 right-0 bg-red-600 px-2 py-0.5 rounded">
            DENIED
          </span>
        </div>
      </div>
    </div>
  );
}

export default PermissionNode;
