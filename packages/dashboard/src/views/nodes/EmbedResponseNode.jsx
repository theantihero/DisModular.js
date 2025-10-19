/**
 * Embed Response Node Component
 * Sends Discord embed as a response
 * @author fkndean_
 * @date 2025-10-14
 */

import { _Handle, Position } from 'reactflow';
import { useNodeHover } from '../../utils/nodeHover';

/**
 * EmbedResponseNode Component
 * @param {Object} props - Node props
 */
export function EmbedResponseNode({ data, id }) {
  const embedVar = data.config?.embedVar || '';
  const hoverHandlers = useNodeHover(id);

  return (
    <div className="bg-indigo-600 text-white rounded-lg shadow-lg border-2 border-indigo-700 min-w-[180px]">
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-indigo-400" style={{ top: -6 }} {...hoverHandlers} />
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-indigo-400" style={{ bottom: -6 }} {...hoverHandlers} />
      
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 mb-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          <div className="font-semibold">{data.label || 'Send Embed'}</div>
        </div>
        
        {embedVar && (
          <div className="text-xs bg-indigo-700 px-2 py-1 rounded truncate">
            {`{${embedVar}}`}
          </div>
        )}
      </div>
    </div>
  );
}

export default EmbedResponseNode;

