/**
 * Object Operation Node Component
 * Performs operations on objects
 * @author fkndean_
 * @date 2025-10-14
 */

import { _Handle, Position } from 'reactflow';
import { useNodeHover } from '../../utils/nodeHover';

export function ObjectOperationNode({ data, id }) {
  const operation = data.config?.operation || 'create';
  const hoverHandlers = useNodeHover(id);
  const operations = {
    create: 'Create Object',
    get: 'Get Property',
    set: 'Set Property',
    delete: 'Delete Property',
    keys: 'Get Keys',
    values: 'Get Values',
    merge: 'Merge Objects'
  };

  return (
    <div className="bg-lime-600 text-white rounded-lg shadow-lg border-2 border-lime-700 min-w-[180px]">
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-lime-400" style={{ top: -6 }} {...hoverHandlers} />
      
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 mb-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <div className="font-semibold">{data.label || 'Object'}</div>
        </div>
        
        <div className="text-xs bg-lime-700 px-2 py-1 rounded">
          {operations[operation]}
        </div>
      </div>
      
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-lime-400" style={{ bottom: -6 }} {...hoverHandlers} />
    </div>
  );
}

export default ObjectOperationNode;

