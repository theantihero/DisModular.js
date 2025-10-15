/**
 * Database Node Component
 * Performs database operations on plugin state
 * @author fkndean_
 * @date 2025-10-14
 */

import { Handle, Position } from 'reactflow';
import { useNodeHover } from '../../utils/nodeHover';

export function DatabaseNode({ data, id }) {
  const operation = data.config?.operation || 'get';
  const key = data.config?.key || '';
  const hoverHandlers = useNodeHover(id);
  const operations = {
    get: 'Get Value',
    set: 'Set Value',
    delete: 'Delete Key',
    list: 'List Keys',
    exists: 'Key Exists'
  };

  return (
    <div className="bg-slate-600 text-white rounded-lg shadow-lg border-2 border-slate-700 min-w-[180px]">
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-slate-400" style={{ top: -6 }} {...hoverHandlers} />
      
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 mb-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
          </svg>
          <div className="font-semibold">{data.label || 'Database'}</div>
        </div>
        
        <div className="text-xs space-y-1">
          <div className="bg-slate-700 px-2 py-1 rounded">
            {operations[operation]}
          </div>
          {key && (
            <div className="bg-slate-800 px-2 py-1 rounded font-mono truncate">
              {key}
            </div>
          )}
        </div>
      </div>
      
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-slate-400" style={{ bottom: -6 }} {...hoverHandlers} />
    </div>
  );
}

export default DatabaseNode;

