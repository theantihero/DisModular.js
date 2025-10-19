/**
 * Embed Builder Node Component
 * Creates Discord embeds with full customization
 * @author fkndean_
 * @date 2025-10-14
 */

import { Handle, Position } from 'reactflow';
import { useNodeHover } from '../../utils/nodeHover';

/**
 * EmbedBuilderNode Component
 * @param {Object} props - Node props
 */
export function EmbedBuilderNode({ data, id }) {
  const title = data.config?.title || '';
  const description = data.config?.description || '';
  const color = data.config?.color || '#5865F2';
  const fields = data.config?.fields || [];
  const footer = data.config?.footer?.text || '';
  const timestamp = data.config?.timestamp;
  const hoverHandlers = useNodeHover(id);

  return (
    <div className="bg-purple-600 text-white rounded-lg shadow-lg border-2 border-purple-700 min-w-[200px] max-w-[300px]">
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-purple-400" style={{ top: -6 }} {...hoverHandlers} />
      
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 mb-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <div className="font-semibold">{data.label || 'Embed Builder'}</div>
        </div>
        
        <div className="text-xs space-y-1">
          {title && (
            <div className="bg-purple-700 px-2 py-1 rounded truncate" title={title}>
              <strong>{title}</strong>
            </div>
          )}
          
          {description && (
            <div className="bg-purple-800 px-2 py-1 rounded text-purple-100" title={description}>
              {description.length > 50 ? `${description.substring(0, 50)}...` : description}
            </div>
          )}
          
          {fields.length > 0 && (
            <div className="space-y-1">
              {fields.slice(0, 3).map((field, index) => (
                <div key={index} className="bg-purple-800 px-2 py-1 rounded">
                  <div className="text-purple-200 font-medium">{field.name}</div>
                  <div className="text-purple-100 text-xs">{field.value}</div>
                </div>
              ))}
              {fields.length > 3 && (
                <div className="text-purple-300 text-xs px-2">
                  +{fields.length - 3} more field{fields.length - 3 !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded border border-purple-400" 
                style={{ backgroundColor: color }}
              ></div>
              <span className="text-purple-200">Custom Embed</span>
            </div>
            {(footer || timestamp) && (
              <div className="text-purple-300 text-xs">
                {footer && '📄'}
                {timestamp && '🕒'}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-purple-400" style={{ bottom: -6 }} {...hoverHandlers} />
    </div>
  );
}

export default EmbedBuilderNode;

