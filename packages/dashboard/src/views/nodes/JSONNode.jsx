/**
 * JSON Node Component
 * Parse or stringify JSON data
 * @author fkndean_
 * @date 2025-10-14
 */

import { Handle, Position } from 'reactflow';
import { useNodeHover } from '../../utils/nodeHover';

export function JSONNode({ data, id }) {
  const operation = data.config?.operation || 'parse';
  const hoverHandlers = useNodeHover(id);
  
  const operationLabels = {
    parse: 'Parse',
    stringify: 'Stringify',
    extract: 'Extract'
  };
  
  const operationIcons = {
    parse: '📥',
    stringify: '📤',
    extract: '🔍'
  };

  return (
    <div className="bg-gradient-to-br from-gray-600 to-gray-700 text-white rounded-lg shadow-lg border-2 border-gray-700 min-w-[180px]">
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-gray-400" style={{ top: -6 }} {...hoverHandlers} />
      
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 mb-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
          <div className="font-semibold text-sm">JSON</div>
        </div>
        
        <div className="text-white font-medium mb-1">{data.label || 'JSON Operation'}</div>
        
        <div className="flex items-center gap-1 text-xs bg-gray-800 bg-opacity-50 px-2 py-1 rounded">
          <span>{operationIcons[operation] || '📄'}</span>
          <span>{operationLabels[operation] || operation}</span>
        </div>
        
        {operation === 'extract' && data.config?.path && (
          <div className="text-xs text-gray-300 mt-1 font-mono truncate" title={data.config.path}>
            {data.config.path}
          </div>
        )}
      </div>
      
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-gray-400" style={{ bottom: -6 }} {...hoverHandlers} />
    </div>
  );
}

export default JSONNode;

