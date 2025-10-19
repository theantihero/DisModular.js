/**
 * Sandbox Executor - Isolated VM Plugin Execution
 * Safely executes plugin code in an isolated environment
 * @author fkndean_
 * @date 2025-10-14
 */

import ivm from 'isolated-vm';
import { Logger, serializeState as sharedSerializeState, validateSerialization } from '@dismodular/shared';

const logger = new Logger('SandboxExecutor');

export class SandboxExecutor {
  /**
   * Initialize Sandbox Executor
   * @param {Object} options - Sandbox options
   * @param {number} options.memoryLimit - Memory limit in MB (default: 128)
   * @param {number} options.timeout - Execution timeout in ms (default: 5000)
   */
  constructor(options = {}) {
    this.memoryLimit = options.memoryLimit || 128;
    this.timeout = options.timeout || 5000;
  }

  /**
   * Execute plugin code in isolated sandbox
   * @param {string} code - Plugin code to execute
   * @param {Object} context - Context to pass to plugin
   * @returns {Promise<any>} Execution result
   */
  async execute(code, context) {
    let isolate;
    
    try {
      // Create isolated VM instance
      isolate = new ivm.Isolate({ memoryLimit: this.memoryLimit });
      const vmContext = await isolate.createContext();

      // Inject safe API into sandbox
      const jail = vmContext.global;
      await jail.set('global', jail.derefInto());

      // Serialize context to avoid circular references
      const safeContext = this.serializeContext(context);

      // Set up safe API with proper handling of functions and data
      await this.injectSafeAPI(jail, isolate, vmContext, context, safeContext);

      // Create response handler using Callbacks
      let pluginResponse = null;
      const responsePromise = new Promise((resolve, reject) => {
        const resolveCb = new ivm.Callback(function(response) {
          pluginResponse = response;
          resolve(response);
        });
        
        jail.setSync('__resolveCb', resolveCb);
        
        const rejectCb = new ivm.Callback(function(error) {
          reject(error);
        });
        
        jail.setSync('__rejectCb', rejectCb);
      });

      // Wrap code with async handler and helper functions
      const wrappedCode = `
        // Setup console object with callback functions (can be called directly)
        global.console = {
          log: function(...args) {
            try {
              __consoleLogCb(JSON.stringify(args));
            } catch (e) {
              __consoleLogCb(JSON.stringify(['[Serialization Error]', e.message]));
            }
          },
          warn: function(...args) {
            try {
              __consoleWarnCb(JSON.stringify(args));
            } catch (e) {
              __consoleWarnCb(JSON.stringify(['[Serialization Error]', e.message]));
            }
          },
          error: function(...args) {
            try {
              __consoleErrorCb(JSON.stringify(args));
            } catch (e) {
              __consoleErrorCb(JSON.stringify(['[Serialization Error]', e.message]));
            }
          }
        };
        
        // Create callable wrapper functions for response handling
        const __resolve = (value) => {
          __resolveCb(value);
        };
        const __reject = (error) => {
          __rejectCb(error);
        };
        
        (async function() {
          try {
            ${code}
          } catch (error) {
            __reject(error.message);
          }
        })();
      `;

      // Execute code with timeout
      const script = await isolate.compileScript(wrappedCode);
      await script.run(vmContext, { timeout: this.timeout });

      // Wait for response with timeout
      const result = await Promise.race([
        responsePromise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Execution timeout')), this.timeout)
        )
      ]);

      // Send reply to Discord if available
      if (pluginResponse && context.reply) {
        await context.reply(pluginResponse);
      }

      return result;
    } catch (error) {
      // Only log non-timeout errors, or all errors in production
      const isTimeout = error.message?.includes('timeout') || error.message?.includes('timed out');
      const isTestRun = process.argv.some(arg => arg.includes('--test') || arg.includes('test'));
      
      // Log error unless it's a timeout during testing (expected behavior)
      if (!isTestRun || !isTimeout) {
      logger.error('Sandbox execution failed:', error);
      }
      throw new Error(`Plugin execution failed: ${error.message}`);
    } finally {
      if (isolate) {
        isolate.dispose();
      }
    }
  }

  /**
   * Inject safe API into sandbox context
   * @param {Object} jail - Sandbox global object
   * @param {Object} isolate - Isolated VM instance
   * @param {Object} vmContext - VM context
   * @param {Object} context - Execution context
   * @param {Object} safeContext - Serialized safe context
   */
  async injectSafeAPI(jail, isolate, vmContext, context, safeContext) {
    // Create simple callback functions using Callback instead of Reference
    // These can be called directly from the sandbox
    const consoleLog = new ivm.Callback((argsJson) => {
      try {
        const args = JSON.parse(argsJson);
        logger.info('[Plugin]', ...args);
      } catch (e) {
        logger.info('[Plugin]', argsJson);
      }
    });

    const consoleWarn = new ivm.Callback((argsJson) => {
      try {
        const args = JSON.parse(argsJson);
        logger.warn('[Plugin]', ...args);
      } catch (e) {
        logger.warn('[Plugin]', argsJson);
      }
    });

    const consoleError = new ivm.Callback((argsJson) => {
      try {
        const args = JSON.parse(argsJson);
        logger.error('[Plugin]', ...args);
      } catch (e) {
        logger.error('[Plugin]', argsJson);
      }
    });

    // Inject callbacks - these can be called directly as functions
    await jail.set('__consoleLogCb', consoleLog);
    await jail.set('__consoleWarnCb', consoleWarn);
    await jail.set('__consoleErrorCb', consoleError);

    // Inject safe Discord context data (using ExternalCopy for plain objects)
    // Build options object from interaction
    const options = {};
    if (context.interaction?.options) {
      // Get all option values
      const optionData = context.interaction.options.data || [];
      optionData.forEach(opt => {
        options[opt.name] = opt.value;
      });
    }

    // Get avatar URL safely
    let avatarURL = null;
    try {
      if (typeof context.interaction?.user?.displayAvatarURL === 'function') {
        avatarURL = context.interaction.user.displayAvatarURL();
      } else if (context.interaction?.user?.avatar) {
        avatarURL = context.interaction.user.avatar;
      }
    } catch (e) {
      // Ignore avatar URL errors
    }

    // Inject editReply using the same polling mechanism as fetch
    const editReplyResults = new Map();
    let editReplyId = 0;
    
    // Inject react method using the same polling mechanism
    const reactResults = new Map();
    let reactId = 0;
    
    if (context.interaction) {
      const editReplyStart = new ivm.Callback((contentJson) => {
        const id = editReplyId++;
        let content;
        try {
          content = JSON.parse(contentJson);
        } catch (e) {
          logger.error(`[EditReply ${id}] Failed to parse content:`, e.message);
          content = { content: '[Serialization Error]' };
        }
        
        logger.info(`[EditReply ${id}] Sending reply...`);
        
        (async () => {
          try {
            const result = await context.interaction.editReply(content);
            logger.info(`[EditReply ${id}] Reply sent successfully`);
            logger.info(`[EditReply ${id}] Result structure:`, {
              id: result.id,
              channelId: result.channelId,
              channel: result.channel ? { id: result.channel.id } : null,
              content: result.content
            });
            try {
              editReplyResults.set(id, JSON.stringify({
                ok: true,
                id: result.id,
                channelId: result.channelId || result.channel?.id,
                content: result.content,
                channel: result.channel ? {
                  id: result.channel.id
                } : null
              }));
            } catch (e) {
              logger.error(`[EditReply ${id}] Failed to serialize result:`, e.message);
              editReplyResults.set(id, JSON.stringify({
                ok: true,
                id: result.id || 'unknown',
                channelId: 'unknown',
                content: '[Serialization Error]'
              }));
            }
          } catch (error) {
            logger.error(`[EditReply ${id}] Error:`, error.message);
            try {
              editReplyResults.set(id, JSON.stringify({
                ok: false,
                error: error.message
              }));
            } catch (e) {
              editReplyResults.set(id, JSON.stringify({
                ok: false,
                error: 'Serialization error'
              }));
            }
          }
        })();
        
        return id;
      });
      
      const editReplyCheck = new ivm.Callback((id) => {
        return editReplyResults.has(id);
      });
      
      const editReplyGet = new ivm.Callback((id) => {
        const result = editReplyResults.get(id);
        if (result) {
          editReplyResults.delete(id);
          return result;
        }
        return JSON.stringify({ ok: false, error: 'EditReply not found' });
      });
      
      await jail.set('__editReplyStart', editReplyStart);
      await jail.set('__editReplyCheck', editReplyCheck);
      await jail.set('__editReplyGet', editReplyGet);
      
      // Inject react method
      const reactStart = new ivm.Callback((messageIdJson, emojiJson) => {
        const id = reactId++;
        let messageId, emoji;
        try {
          messageId = JSON.parse(messageIdJson);
          emoji = JSON.parse(emojiJson);
        } catch (e) {
          logger.error(`[React ${id}] Failed to parse parameters:`, e.message);
          return id; // Return ID but don't process
        }
        
        logger.info(`[React ${id}] Adding reaction ${emoji} to message ${messageId}`);
        
        (async () => {
          try {
            // Get the message from the channel
            const channel = context.interaction.channel;
            const message = await channel.messages.fetch(messageId);
            await message.react(emoji);
            logger.info(`[React ${id}] Reaction added successfully`);
            try {
              reactResults.set(id, JSON.stringify({ ok: true }));
            } catch (e) {
              logger.error(`[React ${id}] Failed to serialize success result:`, e.message);
              reactResults.set(id, JSON.stringify({ ok: true }));
            }
          } catch (error) {
            logger.error(`[React ${id}] Error:`, error.message);
            try {
              reactResults.set(id, JSON.stringify({ ok: false, error: error.message }));
            } catch (e) {
              reactResults.set(id, JSON.stringify({ ok: false, error: 'Serialization error' }));
            }
          }
        })();
        
        return id;
      });
      
      const reactCheck = new ivm.Callback((id) => {
        return reactResults.has(id);
      });
      
      const reactGet = new ivm.Callback((id) => {
        const result = reactResults.get(id);
        if (result) {
          reactResults.delete(id);
          return result;
        }
        return JSON.stringify({ ok: false, error: 'React not found' });
      });
      
      await jail.set('__reactStart', reactStart);
      await jail.set('__reactCheck', reactCheck);
      await jail.set('__reactGet', reactGet);

      // Inject reaction collector for single-choice voting
      const setupSingleChoiceCollector = new ivm.Callback((messageIdJson, emojisJson, durationMs) => {
        let messageId, pollEmojis;
        try {
          messageId = JSON.parse(messageIdJson);
          pollEmojis = JSON.parse(emojisJson);
        } catch (e) {
          logger.error(`[ReactionCollector] Failed to parse parameters:`, e.message);
          return;
        }
        const duration = durationMs;

        logger.info(`[ReactionCollector] Setting up single-choice collector for message ${messageId}`);

        (async () => {
          try {
            const channel = context.interaction.channel;
            const message = await channel.messages.fetch(messageId);
            
            // Instead of using Discord's reaction collector, listen directly to messageReactionAdd
            logger.info(`[ReactionCollector] Setting up direct reaction listener for message ${messageId}`);
            logger.info(`[ReactionCollector] Poll emojis: ${JSON.stringify(pollEmojis)}`);
            
            // Track users who are currently voting to prevent race conditions
            const votingUsers = new Set();
            
            // Create a direct reaction listener
            const reactionHandler = async (reaction, user) => {
              // Check if this is for our message and our emojis
              if (reaction.message.id !== messageId) return;
              
              const emojiString = reaction.emoji.id ? reaction.emoji.name : reaction.emoji.toString();
              logger.info(`[ReactionCollector] Direct listener: user=${user.tag}, emoji=${emojiString}, isBot=${user.bot}`);
              
              // Skip bots and non-poll emojis
              if (user.bot || !pollEmojis.includes(emojiString)) return;
              
              logger.info(`[ReactionCollector] Processing reaction from ${user.tag} for ${emojiString}`);
              
              // Skip if user is already being processed
              if (votingUsers.has(user.id)) {
                logger.info(`[ReactionCollector] Skipping ${user.tag} - already processing`);
                return;
              }
              
              votingUsers.add(user.id);
              
              try {
                // Refresh message to get latest reactions
                await message.fetch();
                
                // Remove all OTHER reactions from this user
                for (const emoji of pollEmojis) {
                  if (emoji !== emojiString) {
                    const otherReaction = message.reactions.cache.find(r => {
                      const otherEmojiString = r.emoji.id ? r.emoji.name : r.emoji.toString();
                      return otherEmojiString === emoji;
                    });
                    if (otherReaction) {
                      try {
                        await otherReaction.users.remove(user.id);
                        logger.info(`[ReactionCollector] Removed ${emoji} from ${user.tag}`);
                      } catch (err) {
                        logger.error(`[ReactionCollector] Failed to remove reaction:`, err.message);
                      }
                    }
                  }
                }
              } catch (err) {
                logger.error(`[ReactionCollector] Failed to fetch message:`, err.message);
              } finally {
                votingUsers.delete(user.id);
              }
            };
            
            // Add the listener
            context.client.on('messageReactionAdd', reactionHandler);
            
            // Add debugging for ALL reaction events
            const debugHandler = (reaction, user) => {
              logger.info(`[ReactionCollector] DEBUG: Any reaction event - messageId=${reaction.message.id}, user=${user.tag}, emoji=${reaction.emoji.toString()}`);
            };
            context.client.on('messageReactionAdd', debugHandler);
            context.client.on('messageReactionRemove', debugHandler);
            
            // Set up cleanup after duration
            setTimeout(async () => {
              logger.info(`[ReactionCollector] Cleaning up reaction listener for message ${messageId}`);
              
              // Remove the listeners
              context.client.removeListener('messageReactionAdd', reactionHandler);
              context.client.removeListener('messageReactionAdd', debugHandler);
              context.client.removeListener('messageReactionRemove', debugHandler);
              
              // Update original poll message with results
              try {
                // Refresh message to get final reaction counts
                await message.fetch();
                
                // Calculate results
                const results = [];
                let totalVotes = 0;
                
                for (const emoji of pollEmojis) {
                  const reaction = message.reactions.cache.find(r => {
                    const reactionEmojiString = r.emoji.id ? r.emoji.name : r.emoji.toString();
                    return reactionEmojiString === emoji;
                  });
                  const count = reaction ? reaction.count - 1 : 0; // Subtract 1 for bot's reaction
                  totalVotes += count;
                  results.push({ emoji, count });
                }
                
                // Find winner
                const winner = results.reduce((max, current) => 
                  current.count > max.count ? current : max, results[0]);
                
                // Create results text
                let resultsText = '';
                if (totalVotes === 0) {
                  resultsText = 'No votes were cast.';
                } else {
                  resultsText = results.map(r => {
                    const percentage = totalVotes > 0 ? Math.round((r.count / totalVotes) * 100) : 0;
                    return `${r.emoji} **${r.count} vote${r.count !== 1 ? 's' : ''}** (${percentage}%)`;
                  }).join('\n');
                  
                  if (winner.count > 0) {
                    const winnerPercentage = Math.round((winner.count / totalVotes) * 100);
                    resultsText += `\n\n🏆 **Winner: ${winner.emoji}** with ${winner.count} vote${winner.count !== 1 ? 's' : ''} (${winnerPercentage}%)`;
                  }
                }
                
                // Update the original message
                await message.edit({
                  embeds: [{
                    ...message.embeds[0],
                    footer: {
                      text: `⏰ Poll ended • ${totalVotes} total vote${totalVotes !== 1 ? 's' : ''}`
                    },
                    fields: [
                      ...message.embeds[0].fields.slice(0, 1), // Keep original options field
                      {
                        name: '📊 Results',
                        value: resultsText,
                        inline: false
                      }
                    ]
                  }]
                });
                
                logger.info(`[ReactionCollector] Updated poll message with results`);
              } catch (err) {
                logger.error(`[ReactionCollector] Failed to update poll message:`, err.message);
                
                // Fallback: send a simple end message
                try {
                  await context.interaction.followUp({
                    content: '⏰ Poll has ended! Check the reactions above for results.',
                    ephemeral: false
                  });
                } catch (fallbackErr) {
                  logger.error(`[ReactionCollector] Failed to send fallback message:`, fallbackErr.message);
                }
              }
            }, duration);

          } catch (error) {
            logger.error(`[ReactionCollector] Error:`, error.message);
          }
        })();
      });

      await jail.set('__setupSingleChoiceCollector', setupSingleChoiceCollector);
    }
    
    // Use the safe interaction data from serialized context
    const safeInteractionData = safeContext.interaction || {};
    
    // Add avatar URL if available
    if (safeInteractionData.user) {
      safeInteractionData.user.avatar = avatarURL;
    }
    
    await jail.set('__interactionData', new ivm.ExternalCopy(safeInteractionData).copyInto());
    
    // Build the interaction object inside the VM with the editReply method
    await vmContext.eval(`
      global.interaction = __interactionData;
      if (typeof __editReplyStart !== 'undefined') {
        global.interaction.editReply = async function(content) {
          console.log('[VM EditReply] Calling editReply...');
          const replyId = __editReplyStart(JSON.stringify(content));
          console.log('[VM EditReply] Started with ID:', replyId);
          
          // Poll for the result
          console.log('[VM EditReply] Polling for result...');
          while (!__editReplyCheck(replyId)) {
            const start = Date.now();
            while (Date.now() - start < 50) { /* busy wait 50ms */ }
          }
          
          const resultJson = __editReplyGet(replyId);
          let result;
          try {
            result = JSON.parse(resultJson);
          } catch (e) {
            console.error('[VM EditReply] Failed to parse result:', e.message);
            throw new Error('Failed to parse editReply result');
          }
          
          console.log('[VM EditReply] Result received, ok:', result.ok);
          
          if (!result.ok && result.error) {
            throw new Error(result.error);
          }
          
          // Add react method to the returned message object
          if (typeof __reactStart !== 'undefined') {
            result.react = async function(emoji) {
              console.log('[VM React] Calling react with emoji:', emoji);
              const reactId = __reactStart(JSON.stringify(this.id), JSON.stringify(emoji));
              console.log('[VM React] Started with ID:', reactId);
              
              // Poll for the result
              console.log('[VM React] Polling for result...');
              while (!__reactCheck(reactId)) {
                const start = Date.now();
                while (Date.now() - start < 50) { /* busy wait 50ms */ }
              }
              
              const resultJson = __reactGet(reactId);
              let reactResult;
              try {
                reactResult = JSON.parse(resultJson);
              } catch (e) {
                console.error('[VM React] Failed to parse result:', e.message);
                throw new Error('Failed to parse react result');
              }
              
              console.log('[VM React] Result received, ok:', reactResult.ok);
              
              if (!reactResult.ok && reactResult.error) {
                throw new Error(reactResult.error);
              }
              
              return reactResult;
            };

            // Add setupSingleChoiceVoting method to the returned message object
            if (typeof __setupSingleChoiceCollector !== 'undefined') {
              result.setupSingleChoiceVoting = function(emojis, durationMs) {
                console.log('[VM SingleChoice] Setting up single-choice voting');
                __setupSingleChoiceCollector(JSON.stringify(this.id), JSON.stringify(emojis), durationMs);
                console.log('[VM SingleChoice] Collector setup initiated');
              };
            }
          }
          
          return result;
        };
      }
    `);
    
    // Create options accessor functions as references
    if (options && Object.keys(options).length > 0) {
      const optionsData = new ivm.ExternalCopy(options).copyInto();
      await jail.set('__slashOptions', optionsData);
      
      // Inject helper code to access options
      const optionsHelperCode = `
        if (typeof global.interaction !== 'undefined' && global.interaction) {
          global.interaction.options = {
            getString: function(name) { return __slashOptions[name] || null; },
            getInteger: function(name) { return __slashOptions[name] ? parseInt(__slashOptions[name]) : null; },
            getBoolean: function(name) { return __slashOptions[name] === true || __slashOptions[name] === 'true'; }
          };
        }
      `;
      await vmContext.eval(optionsHelperCode);
    }

    // Inject message context (always define it, even if null)
    if (context.message) {
      const safeMessage = {
        content: context.message.content || null,
        author: {
          id: context.message.author?.id || null,
          username: context.message.author?.username || null,
          tag: context.message.author?.tag || null
        },
        guild: {
          id: context.message.guild?.id || null,
          name: context.message.guild?.name || null
        },
        channel: {
          id: context.message.channel?.id || null,
          name: context.message.channel?.name || null
        }
      };
      await jail.set('message', new ivm.ExternalCopy(safeMessage).copyInto());
    } else {
      // Set message to null for slash commands
      await jail.set('message', null);
    }

    // Inject plugin state - safely serialize to avoid Promise cloning issues
    const safeState = safeContext.state || {};
    await jail.set('state', new ivm.ExternalCopy(safeState).copyInto());

    // Inject fetch for HTTP requests using a simpler synchronous approach
    const nodeFetch = (await import('node-fetch')).default;
    
    // Store completed fetch results
    const fetchResults = new Map();
    let fetchId = 0;
    
    // Synchronous callback that starts a fetch
    const fetchStart = new ivm.Callback((url, optionsJson) => {
      const id = fetchId++;
      const options = optionsJson ? JSON.parse(optionsJson) : {};
      
      logger.info(`[Fetch ${id}] Calling: ${url}`);
      
          // Start the fetch and store the result when done
          (async () => {
            try {
              const response = await nodeFetch(url, options);
              logger.info(`[Fetch ${id}] Response status: ${response.status}`);
              const data = await response.json();
              logger.info(`[Fetch ${id}] Data received:`, Object.keys(data));
              
              try {
                fetchResults.set(id, JSON.stringify({
                  ok: response.ok,
                  status: response.status,
                  data: data
                }));
              } catch (serializeError) {
                logger.error(`[Fetch ${id}] Failed to serialize response data:`, serializeError.message);
                fetchResults.set(id, JSON.stringify({
                  ok: response.ok,
                  status: response.status,
                  data: '[Serialization Error]'
                }));
              }
            } catch (error) {
              logger.error(`[Fetch ${id}] Error:`, error.message);
              try {
                fetchResults.set(id, JSON.stringify({
                  ok: false,
                  error: error.message
                }));
              } catch (serializeError) {
                fetchResults.set(id, JSON.stringify({
                  ok: false,
                  error: 'Serialization error'
                }));
              }
            }
          })();
      
      return id;
    });
    
    // Synchronous callback that checks if result is ready
    const fetchCheck = new ivm.Callback((id) => {
      return fetchResults.has(id);
    });
    
    // Synchronous callback that gets the result
    const fetchGet = new ivm.Callback((id) => {
      const result = fetchResults.get(id);
      if (result) {
        fetchResults.delete(id);
        return result;
      }
      return JSON.stringify({ ok: false, error: 'Fetch not found' });
    });
    
    await jail.set('__fetchStart', fetchStart);
    await jail.set('__fetchCheck', fetchCheck);
    await jail.set('__fetchGet', fetchGet);
    
    await vmContext.eval(`
      global.fetch = async function(url, options) {
        console.log('[VM Fetch] Called with URL:', url);
        try {
          // Start the fetch and get an ID
          const fetchId = __fetchStart(url, JSON.stringify(options || {}));
          console.log('[VM Fetch] Started fetch with ID:', fetchId);
          
          // Poll for the result to be ready
          console.log('[VM Fetch] Polling for result...');
          while (!__fetchCheck(fetchId)) {
            // Wait a bit before checking again
            const start = Date.now();
            while (Date.now() - start < 50) { /* busy wait 50ms */ }
          }
          
          // Get the result
          const resultJson = __fetchGet(fetchId);
          let result;
          try {
            result = JSON.parse(resultJson);
          } catch (e) {
            console.error('[VM Fetch] Failed to parse result:', e.message);
            throw new Error('Failed to parse fetch result');
          }
          
          console.log('[VM Fetch] Result received, ok:', result.ok);
          
          if (!result.ok && result.error) {
            throw new Error(result.error);
          }
          
          return {
            ok: result.ok,
            status: result.status,
            json: async () => result.data
          };
        } catch (error) {
          console.error('HTTP Request failed in VM:', error.message || error);
          throw error;
        }
      };
      console.log('[VM] fetch function set');
    `);

    // Inject setTimeout for wait actions using eval to avoid cloning issues
    await vmContext.eval(`
      // Create a setTimeout implementation that works in the sandbox
      global.setTimeout = function(callback, delay) {
        return new Promise(resolve => {
          // Use busy waiting for all delays to avoid function cloning issues
          const start = Date.now();
          
          // Busy wait until the delay is reached
          while (Date.now() - start < delay) {
            // Small yield to prevent blocking the event loop
            // This is a simple busy wait that doesn't require external functions
          }
          
          try {
            callback();
          } catch (e) {
            // Ignore callback errors
          }
          resolve();
        });
      };
    `);
  }

  /**
   * Validate plugin code before execution
   * @param {string} code - Plugin code
   * @returns {Object} Validation result
   */
  validateCode(code) {
    const dangerousPatterns = [
      /require\(/gi,
      /import\s+/gi,
      /process\./gi,
      /child_process/gi,
      /fs\./gi,
      /eval\(/gi,
      /Function\(/gi,
      /__dirname/gi,
      /__filename/gi,
      /global\./gi
    ];

    const errors = [];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(code)) {
        errors.push(`Forbidden pattern detected: ${pattern.source}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Safely serialize state object to avoid Promise cloning issues and circular references
   * @param {Object} state - State object to serialize
   * @returns {Object} Serialized state object
   */
  serializeState(state) {
    try {
      // Validate the state before serialization
      const validation = validateSerialization(state, {
        maxDepth: 10,
        includeCircularRefs: true
      });

      // Only log validation issues if not in test mode
      const isTestMode = process.env.NODE_ENV === 'test' || 
                        process.argv.some(arg => arg.includes('--test') || arg.includes('test') || arg.includes('vitest')) ||
                        typeof global !== 'undefined' && global.testConfig;

      if (!validation.valid && !isTestMode) {
        logger.warn('State validation found issues:', validation.summary);
        // Log specific issues for debugging
        validation.issues.forEach(issue => {
          logger.warn(`Serialization issue at ${issue.path}: ${issue.message}`);
        });
      }

      // sharedSerializeState already returns a parsed object, not a JSON string
      return sharedSerializeState(state, {
        maxDepth: 10,
        includeCircularRefs: true,
        circularRefMarker: '[Circular Reference]'
      });
    } catch (error) {
      logger.error('Failed to serialize state:', error);
      return {};
    }
  }

  /**
   * Safely serialize Discord.js context objects to avoid circular references
   * @param {Object} context - Execution context with Discord.js objects
   * @returns {Object} Safe serialized context
   */
  serializeContext(context) {
    try {
      const safeContext = {};

      // Safely extract interaction data
      if (context.interaction) {
        safeContext.interaction = {
          id: context.interaction.id || null,
          commandName: context.interaction.commandName || null,
          createdTimestamp: context.interaction.createdTimestamp || null,
          user: context.interaction.user ? {
            id: context.interaction.user.id || null,
            username: context.interaction.user.username || null,
            tag: context.interaction.user.tag || null,
            bot: context.interaction.user.bot || false
          } : null,
          guild: context.interaction.guild ? {
            id: context.interaction.guild.id || null,
            name: context.interaction.guild.name || null
          } : null,
          channel: context.interaction.channel ? {
            id: context.interaction.channel.id || null,
            name: context.interaction.channel.name || null
          } : null
        };
      }

      // Safely extract guild data
      if (context.guild) {
        safeContext.guild = {
          id: context.guild.id || null,
          name: context.guild.name || null
        };
      }

      // Safe primitive values
      safeContext.guildId = context.guildId || null;
      safeContext.pluginId = context.pluginId || null;
      safeContext.pluginName = context.pluginName || null;

      // Serialize state safely
      if (context.state) {
        safeContext.state = this.serializeState(context.state);
      }

      // Don't serialize functions or complex objects
      // The reply function will be handled separately in injectSafeAPI

      return safeContext;
    } catch (error) {
      logger.error('Failed to serialize context:', error);
      return {
        guildId: context.guildId || null,
        pluginId: context.pluginId || null,
        pluginName: context.pluginName || null,
        state: {}
      };
    }
  }
}

export default SandboxExecutor;

