/**
 * Discord Action Node Component
 * Performs Discord-specific actions
 * @author fkndean_
 * @date 2025-10-14
 */

import { Handle, Position } from 'reactflow';
import { useNodeHover } from '../../utils/nodeHover';

export function DiscordActionNode({ data, id }) {
  const action = data.config?.actionType || data.config?.action || 'send_message';
  const hoverHandlers = useNodeHover(id);
  const actions = {
    send_message: 'Send Message',
    send_dm: 'Send DM',
    add_reaction: 'Add Reaction',
    add_multiple_reactions: 'Add Multiple Reactions',
    setup_single_choice_voting: 'Setup Single-Choice Voting',
    collect_reactions: 'Collect Reactions',
    check_role: 'Check Role',
    add_role: 'Add Role',
    remove_role: 'Remove Role',
    kick_member: 'Kick Member',
    ban_member: 'Ban Member',
    create_channel: 'Create Channel',
    delete_channel: 'Delete Channel',
    timeout_member: 'Timeout Member',
    create_thread: 'Create Thread'
  };

  return (
    <div className="bg-indigo-500 text-white rounded-lg shadow-lg border-2 border-indigo-600 min-w-[180px]">
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-indigo-300" style={{ top: -6 }} {...hoverHandlers} />
      
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 mb-2">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
          </svg>
          <div className="font-semibold">{data.label || 'Discord Action'}</div>
        </div>
        
        <div className="text-xs bg-indigo-600 px-2 py-1 rounded">
          {actions[action]}
        </div>
      </div>
      
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-indigo-300" style={{ bottom: -6 }} {...hoverHandlers} />
    </div>
  );
}

export default DiscordActionNode;

