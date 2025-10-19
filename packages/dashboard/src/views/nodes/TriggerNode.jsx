/**
 * Trigger Node Component
 * Node that triggers plugin execution
 * @author fkndean_
 * @date 2025-10-14
 */

import { _Handle, Position } from 'reactflow';
import { useNodeHover } from '../../utils/nodeHover';
import { useTheme } from '../../hooks/useTheme';

/**
 * Trigger Node
 */
export function TriggerNode({ data, id }) {
  const hoverHandlers = useNodeHover(id);
  const { theme } = useTheme();
  
  const getNodeStyles = () => {
    if (theme === 'space') {
      return {
        container: 'holographic cosmic-border animate-cosmic-glow rounded-lg shadow-lg p-4 min-w-[200px]',
        pulse: 'w-3 h-3 rounded-full bg-energy-green animate-pulse',
        label: 'text-white font-semibold text-sm',
        command: 'text-energy-green text-xs mt-2 px-2 py-1 bg-energy-green/20 rounded border border-energy-green/30',
        handle: '!w-3 !h-3 !bg-energy-green !border-2 !border-white'
      };
    }
    return {
      container: 'bg-gradient-to-br from-green-400 to-green-600 rounded-lg shadow-lg p-4 min-w-[200px] border-2 border-green-700',
      pulse: 'w-3 h-3 rounded-full bg-white animate-pulse',
      label: 'text-white font-semibold text-sm',
      command: 'text-green-100 text-xs mt-2 px-2 py-1 bg-green-700 bg-opacity-30 rounded',
      handle: '!w-3 !h-3 !bg-green-400 !border-2 !border-white'
    };
  };

  const styles = getNodeStyles();
  
  return (
    <div className={styles.container}>
      <div className="flex items-center gap-2 mb-2">
        <div className={styles.pulse}></div>
        <div className={styles.label}>TRIGGER</div>
      </div>
      
      <div className="text-white font-medium mb-1">{data.label || 'Command Trigger'}</div>
      
      {data.config?.command && (
        <div className={styles.command}>
          /{data.config.command}
        </div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        className={styles.handle}
        style={{ right: -6 }}
        {...hoverHandlers}
      />
    </div>
  );
}

export default TriggerNode;

