/* eslint-env browser, node */
/**
 * Discord Invite Utility
 * Generates Discord bot invite URLs with appropriate permissions
 * @author fkndean_
 * @date 2025-01-27
 */

/**
 * Generate Discord bot invite URL
 * @param {string} clientId - Discord client ID
 * @param {Object} options - Invite options
 * @returns {string} Discord invite URL
 */
export function generateBotInviteUrl(clientId, options = {}) {
  if (!clientId) {
    throw new Error('Discord client ID is required');
  }

  // Default permissions for a Discord bot
  const defaultPermissions = [
    'SEND_MESSAGES',           // Send messages
    'EMBED_LINKS',             // Embed links
    'USE_SLASH_COMMANDS',      // Use slash commands
    'READ_MESSAGE_HISTORY',    // Read message history
    'VIEW_CHANNEL',            // View channels
    'ADD_REACTIONS',           // Add reactions
    'MANAGE_MESSAGES',         // Manage messages (for moderation)
    'MANAGE_CHANNELS',         // Manage channels (for plugin functionality)
    'MANAGE_ROLES',            // Manage roles (for permission-based plugins)
    'MANAGE_WEBHOOKS',         // Manage webhooks (for advanced integrations)
    'READ_MESSAGE_HISTORY',    // Read message history
    'CONNECT',                 // Connect to voice channels
    'SPEAK',                   // Speak in voice channels
    'USE_VAD'                  // Use voice activity detection
  ];

  // Calculate permission integer
  const permissions = options.permissions || defaultPermissions;
  const permissionInteger = calculatePermissionInteger(permissions);

  // Build invite URL
  const baseUrl = 'https://discord.com/api/oauth2/authorize';
  // eslint-disable-next-line no-undef
  const params = new URLSearchParams({
    client_id: clientId,
    permissions: permissionInteger.toString(),
    scope: 'bot applications.commands',
    ...options.queryParams
  });

  return `${baseUrl}?${params.toString()}`;
}

/**
 * Calculate permission integer from permission names
 * @param {Array<string>} permissions - Array of permission names
 * @returns {number} Permission integer
 */
function calculatePermissionInteger(permissions) {
  const permissionMap = {
    'CREATE_INSTANT_INVITE': 0x00000001,
    'KICK_MEMBERS': 0x00000002,
    'BAN_MEMBERS': 0x00000004,
    'ADMINISTRATOR': 0x00000008,
    'MANAGE_CHANNELS': 0x00000010,
    'MANAGE_GUILD': 0x00000020,
    'ADD_REACTIONS': 0x00000040,
    'VIEW_AUDIT_LOG': 0x00000080,
    'PRIORITY_SPEAKER': 0x00000100,
    'STREAM': 0x00000200,
    'VIEW_CHANNEL': 0x00000400,
    'SEND_MESSAGES': 0x00000800,
    'SEND_TTS_MESSAGES': 0x00001000,
    'MANAGE_MESSAGES': 0x00002000,
    'EMBED_LINKS': 0x00004000,
    'ATTACH_FILES': 0x00008000,
    'READ_MESSAGE_HISTORY': 0x00010000,
    'MENTION_EVERYONE': 0x00020000,
    'USE_EXTERNAL_EMOJIS': 0x00040000,
    'VIEW_GUILD_INSIGHTS': 0x00080000,
    'CONNECT': 0x00100000,
    'SPEAK': 0x00200000,
    'MUTE_MEMBERS': 0x00400000,
    'DEAFEN_MEMBERS': 0x00800000,
    'MOVE_MEMBERS': 0x01000000,
    'USE_VAD': 0x02000000,
    'CHANGE_NICKNAME': 0x04000000,
    'MANAGE_NICKNAMES': 0x08000000,
    'MANAGE_ROLES': 0x10000000,
    'MANAGE_WEBHOOKS': 0x20000000,
    'MANAGE_EMOJIS_AND_STICKERS': 0x40000000,
    'USE_APPLICATION_COMMANDS': 0x80000000,
    'REQUEST_TO_SPEAK': 0x100000000,
    'MANAGE_EVENTS': 0x200000000,
    'MANAGE_THREADS': 0x400000000,
    'CREATE_PUBLIC_THREADS': 0x800000000,
    'CREATE_PRIVATE_THREADS': 0x1000000000,
    'USE_EXTERNAL_STICKERS': 0x2000000000,
    'SEND_MESSAGES_IN_THREADS': 0x4000000000,
    'USE_EMBEDDED_ACTIVITIES': 0x8000000000,
    'MODERATE_MEMBERS': 0x10000000000,
    'VIEW_CREATOR_MONETIZATION_ANALYTICS': 0x20000000000,
    'USE_SOUNDBOARD': 0x40000000000,
    'USE_SLASH_COMMANDS': 0x80000000000
  };

  let permissionInteger = 0;
  for (const permission of permissions) {
    if (permissionMap[permission]) {
      permissionInteger |= permissionMap[permission];
    }
  }

  return permissionInteger;
}

/**
 * Get invite URL for the current bot
 * @returns {string} Discord invite URL
 */
export function getBotInviteUrl() {
  const clientId = import.meta.env.VITE_DISCORD_CLIENT_ID;
  
  if (!clientId || clientId === 'your_client_id_here') {
    return '#';
  }

  return generateBotInviteUrl(clientId);
}

export default {
  generateBotInviteUrl,
  getBotInviteUrl
};
