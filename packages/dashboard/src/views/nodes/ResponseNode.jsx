/**
 * Response Node Component
 * Node that sends a response to the user
 * @author fkndean_
 * @date 2025-10-14
 */

import { _Handle, Position } from 'reactflow';
import { useNodeHover } from '../../utils/nodeHover';
import { useTheme } from '../../hooks/useTheme';

/**
 * Response Node
 */
export function ResponseNode({ data, id }) {
  const message = data.config?.message || 'Hello!';
  const truncated = message.length > 50 ? message.substring(0, 50) + '...' : message;
  const hoverHandlers = useNodeHover(id);
  const { theme } = useTheme();

  const getNodeStyles = () => {
    if (theme === 'space') {
      return {
        container: 'holographic cosmic-border animate-cosmic-glow rounded-lg shadow-lg p-4 min-w-[200px]',
        handle: '!w-3 !h-3 !bg-hologram-500 !border-2 !border-white',
        message: 'text-hologram-300 text-xs mt-2 px-2 py-1 bg-hologram-500/20 rounded border border-hologram-500/30'
      };
    }
    return {
      container: 'bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg shadow-lg p-4 min-w-[200px] border-2 border-blue-700',
      handle: '!w-3 !h-3 !bg-blue-400 !border-2 !border-white',
      message: 'text-blue-100 text-xs mt-2 px-2 py-1 bg-blue-700 bg-opacity-30 rounded'
    };
  };

  const styles = getNodeStyles();

  return (
    <div className={styles.container}>
      <Handle
        type="target"
        position={Position.Left}
        className={styles.handle}
        style={{ left: -6 }}
        {...hoverHandlers}
      />

      <div className="flex items-center gap-2 mb-2">
        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <div className="text-white font-semibold text-sm">RESPONSE</div>
      </div>
      
      <div className="text-white font-medium mb-1">{data.label || 'Send Message'}</div>
      
      <div className={styles.message}>
        {truncated}
      </div>
    </div>
  );
}

export default ResponseNode;

