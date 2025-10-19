/**
 * Data Node Component
 * Node that retrieves data from Discord context
 * @author fkndean_
 * @date 2025-10-14
 */

import { _Handle, Position } from 'reactflow';

/**
 * Data Node
 */
export function DataNode({ data }) {
  const dataType = data.config?.dataType || 'text';
  const varName = data.config?.name || 'data';

  return (
    <div className="bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-lg shadow-lg p-4 min-w-[180px] border-2 border-cyan-700">
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-cyan-400 !border-2 !border-white"
      />

      <div className="flex items-center gap-2 mb-2">
        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <div className="text-white font-semibold text-sm">DATA</div>
      </div>
      
      <div className="text-white font-medium mb-1">{data.label || 'Get Data'}</div>
      
      <div className="text-cyan-100 text-xs mt-2 space-y-1">
        <div className="px-2 py-1 bg-cyan-700 bg-opacity-30 rounded">
          {varName}
        </div>
        <div className="text-cyan-200 text-xs italic capitalize">
          {dataType.replace('_', ' ')}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-cyan-400 !border-2 !border-white"
      />
    </div>
  );
}

export default DataNode;

