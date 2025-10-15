/**
 * HTTP Request Node Component
 * Makes HTTP requests to external APIs
 * @author fkndean_
 * @date 2025-10-14
 */

import { Handle, Position } from 'reactflow';
import { useNodeHover } from '../../utils/nodeHover';

/**
 * HTTPRequestNode Component
 * @param {Object} props - Node props
 */
export function HTTPRequestNode({ data, id }) {
  const method = data.config?.method || 'GET';
  const url = data.config?.url || '';
  const hoverHandlers = useNodeHover(id);

  return (
    <div className="bg-orange-600 text-white rounded-lg shadow-lg border-2 border-orange-700 min-w-[200px]">
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-orange-400" style={{ top: -6 }} {...hoverHandlers} />
      
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 mb-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
          </svg>
          <div className="font-semibold">{data.label || 'HTTP Request'}</div>
        </div>
        
        <div className="text-xs space-y-1">
          <div className="bg-orange-700 px-2 py-1 rounded font-mono">
            {method}
          </div>
          {url && (
            <div className="bg-orange-800 px-2 py-1 rounded truncate" title={url}>
              {url}
            </div>
          )}
        </div>
      </div>
      
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-orange-400" style={{ bottom: -6 }} {...hoverHandlers} />
    </div>
  );
}

export default HTTPRequestNode;

