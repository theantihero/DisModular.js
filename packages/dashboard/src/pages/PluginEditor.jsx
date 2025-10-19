/* eslint-env browser, node */
/**
 * Plugin Editor Page
 * Visual node-based plugin creation interface
 * @author fkndean_
 * @date 2025-10-14
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useNavigate, useParams } from 'react-router-dom';
import { usePluginStore } from '../viewmodels/PluginViewModel';
import { useTheme } from '../hooks/useTheme';
import { ToastContainer } from '../components/Toast';
import { ContextMenu } from '../components/ContextMenu';
import { NodeConfigPanel } from '../components/NodeConfigPanel';
import { CommandOptionsManager } from '../components/CommandOptionsManager';
import { CustomEdge } from '../components/CustomEdge';
import { useToast } from '../hooks/useToast';
import { getAutoLayout } from '../utils/layoutUtils';
import { validateConnection, validateGraph } from '../utils/connectionValidation';
import { toPng } from 'html-to-image';
import {
  TriggerNode,
  ResponseNode,
  VariableNode,
  ConditionNode,
  PermissionNode,
  ActionNode,
  DataNode,
  HTTPRequestNode,
  EmbedBuilderNode,
  EmbedResponseNode,
  DiscordActionNode,
  ForLoopNode,
  WhileLoopNode,
  ComparisonNode,
  ArrayOperationNode,
  StringOperationNode,
  ObjectOperationNode,
  MathOperationNode,
  DatabaseNode,
  JSONNode
} from '../views/nodes';

const nodeTypes = {
  trigger: TriggerNode,
  response: ResponseNode,
  variable: VariableNode,
  condition: ConditionNode,
  permission: PermissionNode,
  action: ActionNode,
  data: DataNode,
  http_request: HTTPRequestNode,
  embed_builder: EmbedBuilderNode,
  embed_response: EmbedResponseNode,
  discord_action: DiscordActionNode,
  for_loop: ForLoopNode,
  while_loop: WhileLoopNode,
  comparison: ComparisonNode,
  array_operation: ArrayOperationNode,
  string_operation: StringOperationNode,
  object_operation: ObjectOperationNode,
  math_operation: MathOperationNode,
  database: DatabaseNode,
  json: JSONNode
};

const edgeTypes = {
  custom: CustomEdge,
};

/**
 * Plugin Editor Component
 */
export function PluginEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const reactFlowWrapper = useRef(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  
  const [pluginName, setPluginName] = useState('');
  const [pluginDescription, setPluginDescription] = useState('');
  const [pluginType, setPluginType] = useState('slash');
  const [commandName, setCommandName] = useState('');
  const [commandOptions, setCommandOptions] = useState([]);
  const [_showNodeMenu, _setShowNodeMenu] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  
  // Compute selectedNode from nodes array to avoid stale state during typing
  const selectedNode = selectedNodeId ? nodes.find(n => n.id === selectedNodeId) : null;
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);
  const [copiedNodes, setCopiedNodes] = useState([]);
  const toast = useToast();
  const { theme, toggleTheme } = useTheme();

  const { createPlugin, updatePlugin, compilePlugin, getPluginById } = usePluginStore();

  // Load plugin data when editing
  useEffect(() => {
    if (id) {
      loadPlugin();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      // eslint-disable-next-line no-undef
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const ctrlKey = isMac ? event.metaKey : event.ctrlKey;

      // Ctrl/Cmd + S: Save
      if (ctrlKey && event.key === 's') {
        event.preventDefault();
        handleSave();
      }

      // Ctrl/Cmd + C: Copy selected nodes
      if (ctrlKey && event.key === 'c') {
        const selected = nodes.filter(n => n.selected);
        if (selected.length > 0) {
          event.preventDefault();
          setCopiedNodes(selected.map(n => ({ ...n, id: undefined })));
          toast.info(`Copied ${selected.length} node(s)`);
        }
      }

      // Ctrl/Cmd + V: Paste
      if (ctrlKey && event.key === 'v') {
        event.preventDefault();
        if (copiedNodes.length > 0) {
          const newNodes = copiedNodes.map(node => ({
            ...node,
            id: `${node.type}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            position: {
              x: 100 + Math.random() * 100,
              y: 100 + Math.random() * 100
            }
          }));
          setNodes((nds) => [...nds, ...newNodes]);
          toast.success(`Pasted ${newNodes.length} node(s)`);
        }
      }

      // Ctrl/Cmd + D: Duplicate selected nodes
      if (ctrlKey && event.key === 'd') {
        event.preventDefault();
        const selected = nodes.filter(n => n.selected);
        if (selected.length > 0) {
          const duplicated = selected.map(node => ({
            ...node,
            id: `${node.type}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            position: {
              x: node.position.x + 50,
              y: node.position.y + 50
            }
          }));
          setNodes((nds) => [...nds, ...duplicated]);
          toast.success(`Duplicated ${duplicated.length} node(s)`);
        }
      }

      // Ctrl/Cmd + A: Select all
      if (ctrlKey && event.key === 'a') {
        event.preventDefault();
        setNodes((nds) => nds.map(n => ({ ...n, selected: true })));
      }

      // Delete/Backspace: Delete selected nodes
      if (event.key === 'Delete' || event.key === 'Backspace') {
        const selected = nodes.filter(n => n.selected);
        if (selected.length > 0 && !event.target.matches('input, textarea')) {
          event.preventDefault();
          setNodes((nds) => nds.filter(n => !n.selected));
          setEdges((eds) => eds.filter(e => 
            !selected.some(n => n.id === e.source || n.id === e.target)
          ));
          toast.success(`Deleted ${selected.length} node(s)`);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, copiedNodes, setNodes, setEdges, toast]);

  const loadPlugin = async () => {
    setLoading(true);
    try {
      const plugin = await getPluginById(id);
      setPluginName(plugin.name || '');
      setPluginDescription(plugin.description || '');
      setPluginType(plugin.type || 'slash');
      setCommandName(plugin.trigger_command || '');
      setCommandOptions(plugin.options || []);
      setNodes(plugin.nodes || []);
      
      // Apply enhanced styling to existing edges
      const enhancedEdges = (plugin.edges || []).map(edge => {
        // If edge already has custom styling, keep it but ensure it has all properties
        if (edge.style) {
          return {
            ...edge,
            type: edge.type || 'custom',
            animated: edge.animated !== undefined ? edge.animated : true,
            markerEnd: edge.markerEnd || {
              type: 'arrowclosed',
              color: edge.style.stroke || '#60a5fa',
            },
            data: {
              sourceNodeId: edge.source,
              targetNodeId: edge.target,
              ...edge.data,
            },
          };
        }
        
        // Apply default enhanced styling
        return {
          ...edge,
          type: 'custom',
          animated: true,
          style: {
            stroke: '#60a5fa',
            strokeWidth: 2,
          },
          markerEnd: {
            type: 'arrowclosed',
            color: '#60a5fa',
          },
          data: {
            sourceNodeId: edge.source,
            targetNodeId: edge.target,
            ...edge.data,
          },
        };
      });
      
      setEdges(enhancedEdges);
      
      // Debug: Log edges to console to verify they're loaded correctly
      // Loaded edges
    } catch (error) {
      console.error('Failed to load plugin:', error);
      toast.error(`Failed to load plugin: ${error.error || error.message}`);
      setTimeout(() => navigate('/dashboard'), 2000);
    } finally {
      setLoading(false);
    }
  };

  const onConnect = useCallback((params) => {
    const sourceNode = nodes.find(n => n.id === params.source);
    const targetNode = nodes.find(n => n.id === params.target);
    
    // Validate connection
    const validation = validateConnection(
      sourceNode?.type, 
      targetNode?.type, 
      params.sourceHandle
    );
    
    if (!validation.valid) {
      toast.error(validation.message);
      return;
    }
    
    // Determine edge color based on connection type
    let edgeColor = '#60a5fa'; // Default blue for main flow
    
    if (params.sourceHandle === 'true') {
      edgeColor = '#10b981'; // Green for true conditions
    } else if (params.sourceHandle === 'false') {
      edgeColor = '#ef4444'; // Red for false conditions
    } else if (sourceNode?.type === 'variable' || targetNode?.type === 'variable') {
      edgeColor = '#a78bfa'; // Purple for data flow
    }
    
    const edge = {
      ...params,
      id: `edge-${params.source}-${params.target}-${Date.now()}`,
      type: 'custom',
      animated: true,
      style: {
        stroke: edgeColor,
        strokeWidth: 2,
      },
      markerEnd: {
        type: 'arrowclosed',
        color: edgeColor,
      },
      data: {
        sourceNodeId: params.source,
        targetNodeId: params.target,
      },
    };
    
    setEdges((eds) => addEdge(edge, eds));
    toast.success('Connection created');
  }, [setEdges, nodes, toast]);

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  /**
   * Get default configuration for node types
   */
  const getDefaultConfig = (nodeType) => {
    const defaults = {
      condition: {
        conditionType: 'expression',
        condition: 'true'
      },
      variable: {
        type: 'user_input',
        name: 'variable',
        description: 'Enter value'
      },
      string_operation: {
        operation: 'concat',
        input: '',
        resultVar: 'result'
      },
      array_operation: {
        operation: 'create',
        arrayVar: 'array',
        resultVar: 'result'
      },
      math_operation: {
        operation: 'add',
        value1: '0',
        value2: '0',
        resultVar: 'result'
      },
      embed_builder: {
        title: '',
        description: '',
        color: '#0099ff',
        fields: [],
        footer: '',
        timestamp: false
      },
      discord_action: {
        actionType: 'send_message',
        message: 'Hello!'
      },
      http_request: {
        method: 'GET',
        url: 'https://api.example.com',
        headers: {},
        body: ''
      }
    };
    
    return defaults[nodeType] || {};
  };

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      if (typeof type === 'undefined' || !type) {
        return;
      }

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY
      });

      const newNode = {
        id: `${type}_${Date.now()}`,
        type,
        position,
        data: {
          label: `${type.charAt(0).toUpperCase() + type.slice(1)}`,
          config: getDefaultConfig(type)
        }
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  const onNodeClick = useCallback((event, node) => {
    setSelectedNodeId(node.id);
    setContextMenu(null); // Close context menu on node click
  }, []);

  const onPaneClick = useCallback(() => {
    setContextMenu(null); // Close context menu on canvas click
  }, []);

  const onEdgeClick = useCallback(() => {
    setContextMenu(null); // Close context menu on edge click
  }, []);

  // Context menu handlers
  const onNodeContextMenu = useCallback((event, node) => {
    event.preventDefault();
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      type: 'node',
      node
    });
  }, []);

  const onPaneContextMenu = useCallback((event) => {
    event.preventDefault();
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      type: 'pane'
    });
  }, []);

  const onEdgeContextMenu = useCallback((event, edge) => {
    event.preventDefault();
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      type: 'edge',
      edge
    });
  }, []);

  /**
   * Export workflow as PNG image
   */
  const handleExportPNG = useCallback(async (exportType) => {
    if (!reactFlowInstance || !reactFlowWrapper.current) {
      toast.error('Cannot export: Editor not ready');
      return;
    }
    
    try {
      const originalViewport = reactFlowInstance.getViewport();
      
      if (exportType === 'full') {
        // Fit all nodes before export
        await reactFlowInstance.fitView({ padding: 0.2 });
        // Wait for animation
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Generate PNG
      toast.info('Generating image...');
      const dataUrl = await toPng(reactFlowWrapper.current, {
        backgroundColor: theme === 'dark' ? '#1d1d1f' : '#f5f5f7',
        quality: 1.0,
        pixelRatio: 2,
        cacheBust: true
      });
      
      // Restore original viewport if needed
      if (exportType === 'full') {
        reactFlowInstance.setViewport(originalViewport);
      }
      
      // Download
      const link = document.createElement('a');
      link.download = `${(pluginName || 'workflow').replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      
      toast.success('Workflow exported successfully!');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export workflow');
    }
  }, [reactFlowInstance, reactFlowWrapper, theme, pluginName, toast]);

  // Context menu actions
  const copyNode = useCallback((node) => {
    setCopiedNodes([{ ...node, id: undefined }]);
    toast.info('Node copied');
  }, [toast]);

  const duplicateNode = useCallback((node) => {
    const newNode = {
      ...node,
      id: `${node.type}_${Date.now()}`,
      position: {
        x: node.position.x + 50,
        y: node.position.y + 50
      }
    };
    setNodes((nds) => [...nds, newNode]);
    toast.success('Node duplicated');
  }, [setNodes, toast]);

  const deleteNode = useCallback((node) => {
    setNodes((nds) => nds.filter((n) => n.id !== node.id));
    setEdges((eds) => eds.filter((e) => e.source !== node.id && e.target !== node.id));
    if (selectedNode?.id === node.id) {
      setSelectedNodeId(null);
    }
    toast.success('Node deleted');
  }, [setNodes, setEdges, selectedNode, toast]);

  const pasteNodes = useCallback(() => {
    if (copiedNodes.length === 0) return;
    
    const newNodes = copiedNodes.map(node => ({
      ...node,
      id: `${node.type}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      position: {
        x: (contextMenu?.x || 0) - 100,
        y: (contextMenu?.y || 0) - 100
      }
    }));
    
    setNodes((nds) => [...nds, ...newNodes]);
    toast.success(`Pasted ${newNodes.length} node(s)`);
  }, [copiedNodes, contextMenu, setNodes, toast]);

  const deleteEdge = useCallback((edge) => {
    setEdges((eds) => eds.filter((e) => e.id !== edge.id));
    toast.success('Connection deleted');
  }, [setEdges, toast]);

  // Get context menu items based on context
  const getContextMenuItems = useCallback(() => {
    if (!contextMenu) return [];

    if (contextMenu.type === 'node') {
      const node = contextMenu.node;
      return [
        {
          label: 'Edit Configuration',
          icon: '⚙️',
          onClick: () => setSelectedNodeId(node.id)
        },
        { separator: true },
        {
          label: 'Copy',
          icon: '📋',
          shortcut: 'Ctrl+C',
          onClick: () => copyNode(node)
        },
        {
          label: 'Duplicate',
          icon: '📑',
          shortcut: 'Ctrl+D',
          onClick: () => duplicateNode(node)
        },
        { separator: true },
        {
          label: 'Delete',
          icon: '🗑️',
          shortcut: 'Del',
          onClick: () => deleteNode(node)
        }
      ];
    }

    if (contextMenu.type === 'edge') {
      return [
        {
          label: 'Delete Connection',
          icon: '✂️',
          onClick: () => deleteEdge(contextMenu.edge)
        }
      ];
    }

    if (contextMenu.type === 'pane') {
      return [
        {
          label: 'Paste',
          icon: '📌',
          shortcut: 'Ctrl+V',
          disabled: copiedNodes.length === 0,
          onClick: pasteNodes
        },
        { separator: true },
        {
          label: 'Export Workflow',
          icon: '📸',
          submenu: [
            {
              label: 'Export Visible Area',
              onClick: () => handleExportPNG('visible')
            },
            {
              label: 'Export Full Workflow',
              onClick: () => handleExportPNG('full')
            }
          ]
        },
        { separator: true },
        {
          label: 'Select All',
          icon: '☑️',
          shortcut: 'Ctrl+A',
          onClick: () => {
            setNodes((nds) => nds.map(n => ({ ...n, selected: true })));
            toast.info('All nodes selected');
          }
        },
        {
          label: 'Clear Selection',
          icon: '⬜',
          onClick: () => {
            setNodes((nds) => nds.map(n => ({ ...n, selected: false })));
            setSelectedNodeId(null);
          }
        }
      ];
    }

    return [];
  }, [contextMenu, copiedNodes, copyNode, duplicateNode, deleteNode, deleteEdge, pasteNodes, setNodes, toast, handleExportPNG]);

  /**
   * Auto-arrange nodes using layout algorithm
   */
  const handleAutoArrange = useCallback(() => {
    if (nodes.length === 0) {
      toast.warning('No nodes to arrange');
      return;
    }

    try {
      const { nodes: layoutedNodes, edges: layoutedEdges } = getAutoLayout(nodes, edges);
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
      
      // Fit view to show all nodes
      setTimeout(() => {
        if (reactFlowInstance) {
          reactFlowInstance.fitView({ padding: 0.1 });
        }
      }, 100);
      
      toast.success(`Auto-arranged ${nodes.length} nodes`);
    } catch (error) {
      console.error('Auto-arrange failed:', error);
      toast.error('Failed to auto-arrange nodes');
    }
  }, [nodes, edges, setNodes, setEdges, reactFlowInstance, toast]);

  /**
   * Validate entire graph
   */
  const handleValidateGraph = useCallback(() => {
    const issues = validateGraph(nodes, edges);
    
    if (issues.length === 0) {
      toast.success('Graph validation passed!');
      return;
    }
    
    const errorCount = issues.filter(i => i.severity === 'error').length;
    const warningCount = issues.filter(i => i.severity === 'warning').length;
    
    if (errorCount > 0) {
      toast.error(`Found ${errorCount} error(s) and ${warningCount} warning(s)`);
    } else {
      toast.warning(`Found ${warningCount} warning(s)`);
    }
    
    // Log issues to console for debugging
    console.group('Graph Validation Issues');
    issues.forEach(issue => {
      console[issue.severity === 'error' ? 'error' : 'warn'](issue.message, issue);
    });
    console.groupEnd();
  }, [nodes, edges, toast]);

  /**
   * Save plugin with automatic compilation
   */
  const handleSave = async () => {
    if (saving) return; // Prevent double submission
    
    try {
      if (!pluginName || !commandName) {
        toast.warning('Please fill in plugin name and command name');
        return;
      }

      setSaving(true);

      // Step 1: Compile the plugin
      toast.info('🔄 Compiling plugin...');
      let compiledResult;
      try {
        compiledResult = await compilePlugin(nodes, edges);
      } catch (compileError) {
        setSaving(false);
        toast.error(`❌ Compilation failed: ${compileError.error || compileError.message}`);
        console.error('Compilation error:', compileError);
        return;
      }

      // Step 2: Validate compilation succeeded
      if (!compiledResult || !compiledResult.compiled) {
        setSaving(false);
        toast.error('❌ Compilation failed: No code generated');
        return;
      }

      // Step 3: Show compilation success
      const lineCount = compiledResult.compiled.split('\n').length;
      toast.success(`✅ Compiled successfully! (${lineCount} lines of code)`);

      // Step 4: Save with compiled code
      toast.info('💾 Saving plugin...');
      const pluginData = {
        name: pluginName,
        description: pluginDescription,
        type: pluginType,
        trigger: {
          type: 'command',
          command: commandName
        },
        trigger_command: commandName,
        options: commandOptions,
        nodes,
        edges,
        compiled: compiledResult.compiled
      };

      if (id) {
        await updatePlugin(id, pluginData);
        toast.success('✅ Plugin compiled and saved successfully!');
      } else {
        await createPlugin(pluginData);
        toast.success('✅ Plugin compiled and created successfully!');
        setTimeout(() => navigate('/dashboard'), 1500);
      }
    } catch (error) {
      toast.error(`❌ Failed to save plugin: ${error.error || error.message}`);
    } finally {
      setSaving(false);
    }
  };

  /**
   * Test compilation
   */
  const handleTestCompile = async () => {
    try {
      const result = await compilePlugin(nodes, edges);
      
      // Show compilation result in a popup/modal
      const lineCount = result.compiled.split('\n').length;
      const charCount = result.compiled.length;
      
      // Create a modal to show the compiled code
      const modal = document.createElement('div');
      modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
      
      // Create modal content
      const modalContent = document.createElement('div');
      modalContent.className = 'bg-gray-800 rounded-lg p-6 max-w-4xl max-h-[80vh] overflow-hidden flex flex-col';
      
      // Create header
      const header = document.createElement('div');
      header.className = 'flex justify-between items-center mb-4';
      header.innerHTML = `
        <h3 class="text-xl font-bold text-white">Compilation Result</h3>
        <button class="text-gray-400 hover:text-white text-2xl close-btn">&times;</button>
      `;
      
      // Create info section
      const info = document.createElement('div');
      info.className = 'mb-4 text-sm text-gray-300';
      info.innerHTML = `
        <p>✅ Compilation successful!</p>
        <p>📊 Generated ${lineCount} lines of code (${charCount} characters)</p>
      `;
      
      // Create code block
      const codeContainer = document.createElement('div');
      codeContainer.className = 'flex-1 overflow-hidden';
      const codeBlock = document.createElement('pre');
      codeBlock.className = 'bg-gray-900 text-green-400 p-4 rounded text-xs overflow-auto h-full font-mono whitespace-pre-wrap max-h-96';
      codeBlock.textContent = result.compiled;
      codeContainer.appendChild(codeBlock);
      
      // Create buttons
      const buttons = document.createElement('div');
      buttons.className = 'mt-4 flex justify-end';
      
      const copyBtn = document.createElement('button');
      copyBtn.className = 'bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded copy-btn';
      copyBtn.textContent = 'Copy Code';
      
      const closeBtn = document.createElement('button');
      closeBtn.className = 'bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded ml-2 close-btn';
      closeBtn.textContent = 'Close';
      
      buttons.appendChild(copyBtn);
      buttons.appendChild(closeBtn);
      
      // Assemble modal
      modalContent.appendChild(header);
      modalContent.appendChild(info);
      modalContent.appendChild(codeContainer);
      modalContent.appendChild(buttons);
      modal.appendChild(modalContent);
      
      // Add event listeners
      const closeModal = () => {
        document.body.removeChild(modal);
      };
      
      const copyCode = async () => {
        try {
          await navigator.clipboard.writeText(result.compiled);
          copyBtn.textContent = 'Copied!';
          setTimeout(() => {
            copyBtn.textContent = 'Copy Code';
          }, 2000);
        } catch (err) {
          console.error('Failed to copy code:', err);
          copyBtn.textContent = 'Copy Failed';
          setTimeout(() => {
            copyBtn.textContent = 'Copy Code';
          }, 2000);
        }
      };
      
      // Add event listeners
      modal.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', closeModal);
      });
      
      copyBtn.addEventListener('click', copyCode);
      
      // Close on backdrop click
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          closeModal();
        }
      });
      
      document.body.appendChild(modal);
      
      // Also show a toast
      toast.success(`✅ Compilation successful! Generated ${lineCount} lines of code`);
    } catch (error) {
      toast.error(`Compilation failed: ${error.error || error.message}`);
    }
  };

  /**
   * Export workflow as JSON
   */
  const handleExport = () => {
    const exportData = {
      name: pluginName,
      version: '1.0.0',
      description: pluginDescription,
      author: '',
      type: pluginType,
      trigger: {
        type: 'command',
        command: commandName
      },
      nodes,
      edges,
      exportedAt: new Date().toISOString(),
      exportedBy: 'DisModular.js'
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    // eslint-disable-next-line no-undef
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    // eslint-disable-next-line no-undef
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(pluginName || 'plugin').replace(/\s+/g, '-').toLowerCase()}-workflow.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    // eslint-disable-next-line no-undef
    URL.revokeObjectURL(url);
    
    toast.success('Workflow exported successfully!');
  };

  /**
   * Import workflow from JSON
   */
  const handleImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // eslint-disable-next-line no-undef
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        
        // Validate imported data
        if (!importedData.nodes || !importedData.edges) {
          toast.error('Invalid workflow file: missing nodes or edges');
          return;
        }

        // Load the imported data
        setPluginName(importedData.name || 'Imported Plugin');
        setPluginDescription(importedData.description || '');
        setPluginType(importedData.type || 'slash');
        setCommandName(importedData.trigger?.command || 'imported');
        setNodes(importedData.nodes);
        setEdges(importedData.edges);
        
        toast.success('Workflow imported successfully!');
      } catch (error) {
        console.error('Import error:', error);
        toast.error('Failed to import workflow: Invalid JSON file');
      }
    };
    reader.readAsText(file);
    
    // Reset the input so the same file can be imported again
    event.target.value = '';
  };

  /**
   * Node palette items organized by category
   */
  const nodePaletteCategories = [
    {
      name: 'Core',
      nodes: [
        { type: 'trigger', label: 'Command Trigger', color: 'bg-green-500', icon: '▶️' },
        { type: 'response', label: 'Send Message', color: 'bg-blue-500', icon: '💬' },
        { type: 'variable', label: 'Variable', color: 'bg-purple-500', icon: '📦' },
        { type: 'data', label: 'Static Data', color: 'bg-cyan-500', icon: '📊' }
      ]
    },
    {
      name: 'Discord Features',
      nodes: [
        { type: 'embed_builder', label: 'Build Embed', color: 'bg-purple-600', icon: '📋' },
        { type: 'embed_response', label: 'Send Embed', color: 'bg-indigo-600', icon: '📤' },
        { type: 'discord_action', label: 'Discord Action', color: 'bg-indigo-500', icon: '🎮' }
      ]
    },
    {
      name: 'Control Flow',
      nodes: [
        { type: 'condition', label: 'If/Else', color: 'bg-yellow-500', icon: '❓' },
        { type: 'comparison', label: 'Compare Values', color: 'bg-yellow-600', icon: '⚖️' },
        { type: 'permission', label: 'Check Permission', color: 'bg-red-500', icon: '🔒' },
        { type: 'for_loop', label: 'For Loop', color: 'bg-pink-600', icon: '🔄' },
        { type: 'while_loop', label: 'While Loop', color: 'bg-pink-500', icon: '♾️' }
      ]
    },
    {
      name: 'Data Processing',
      nodes: [
        { type: 'string_operation', label: 'String Operations', color: 'bg-emerald-600', icon: '📝' },
        { type: 'array_operation', label: 'Array Operations', color: 'bg-teal-600', icon: '📚' },
        { type: 'object_operation', label: 'Object Operations', color: 'bg-lime-600', icon: '🗂️' },
        { type: 'math_operation', label: 'Math Operations', color: 'bg-amber-600', icon: '🔢' },
        { type: 'json', label: 'JSON Parser', color: 'bg-gray-600', icon: '{ }' }
      ]
    },
    {
      name: 'External & Storage',
      nodes: [
        { type: 'http_request', label: 'HTTP Request', color: 'bg-orange-600', icon: '🌐' },
        { type: 'database', label: 'Database', color: 'bg-slate-600', icon: '💾' },
        { type: 'action', label: 'Custom Action', color: 'bg-orange-500', icon: '⚡' }
      ]
    }
  ];

  const [expandedCategories, setExpandedCategories] = useState(
    new Set(['Core']) // Only Core expanded by default
  );
  
  // Sidebar collapse state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleCategory = (categoryName) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryName)) {
        newSet.delete(categoryName);
      } else {
        newSet.add(categoryName);
      }
      return newSet;
    });
  };

  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  // Show loading screen while fetching plugin data
  if (loading) {
    return (
      <div className="flex h-screen bg-gray-900 items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading plugin...</p>
        </div>
      </div>
    );
  }

  const getBackgroundClass = () => {
    switch (theme) {
      case 'space':
        return 'flex h-screen bg-transparent';
      case 'light':
        return 'flex h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50';
      default:
        return 'flex h-screen';
    }
  };

  return (
    <div className={getBackgroundClass()} style={{ background: theme === 'space' ? 'transparent' : 'var(--bg-primary)' }}>
      {/* Left Sidebar - Node Palette */}
      <div className={`${sidebarCollapsed ? 'w-16' : 'w-80'} border-r ${sidebarCollapsed ? 'p-3' : 'p-6'} overflow-y-auto transition-all duration-300 ${
        theme === 'space'
          ? 'glass-strong border-hologram-500/30'
          : 'glass-strong'
      }`} style={{ borderColor: theme === 'space' ? 'rgba(6, 182, 212, 0.3)' : 'var(--border-color)' }}>
        {sidebarCollapsed ? (
          <div className="flex flex-col items-center">
            <button
              onClick={() => setSidebarCollapsed(false)}
              className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
              title="Expand sidebar"
            >
              <svg 
                className="w-5 h-5 transition-transform rotate-180"
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                style={{ color: 'var(--text-primary)' }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                  <span className="text-white text-sm">🔌</span>
                </div>
                <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Node Palette</h2>
              </div>
              <button
                onClick={() => setSidebarCollapsed(true)}
                className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
                title="Collapse sidebar"
              >
                <svg 
                  className="w-5 h-5 transition-transform"
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  style={{ color: 'var(--text-primary)' }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-3">
              {nodePaletteCategories.map((category) => (
                <div key={category.name} className="glass rounded-xl overflow-hidden shadow-sm" style={{ borderColor: 'var(--border-color)' }}>
                  <button
                    onClick={() => toggleCategory(category.name)}
                    className="w-full px-4 py-3 glass hover:bg-opacity-80 font-semibold text-sm flex items-center justify-between transition-all"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    <span>{category.name}</span>
                    <svg 
                      className={`w-4 h-4 transition-transform ${expandedCategories.has(category.name) ? 'rotate-180' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {expandedCategories.has(category.name) && (
                    <div className="p-2 space-y-2" style={{ background: 'var(--bg-surface)' }}>
                      {category.nodes.map((item) => (
                        <div
                          key={item.type}
                          className={`${item.color} text-white p-2 rounded-lg cursor-move hover:opacity-90 transition-opacity shadow-md`}
                          draggable
                          onDragStart={(e) => onDragStart(e, item.type)}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{item.icon}</span>
                            <div className="flex-1">
                              <div className="font-semibold text-sm">{item.label}</div>
                              <div className="text-xs opacity-75">Drag to canvas</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t" style={{ borderColor: 'var(--border-color)' }}>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <span>📚</span>
                Getting Started
              </h3>
              <div className="text-xs leading-relaxed space-y-3" style={{ color: 'var(--text-secondary)' }}>
                <div className="bg-gray-750 p-2 rounded">
                  <strong className="text-white">1. Start with Trigger</strong>
                  <p className="mt-1">Every command needs a Trigger node (green). This is where your command starts.</p>
                </div>
                <div className="bg-gray-750 p-2 rounded">
                  <strong className="text-white">2. Get User Input</strong>
                  <p className="mt-1">Use Variable nodes (purple) to capture user input or Discord data.</p>
                </div>
                <div className="bg-gray-750 p-2 rounded">
                  <strong className="text-white">3. Add Logic</strong>
                  <p className="mt-1">Use Condition nodes (yellow) to validate input or make decisions.</p>
                </div>
                <div className="bg-gray-750 p-2 rounded">
                  <strong className="text-white">4. Send Response</strong>
                  <p className="mt-1">End with a Response node (blue) to send a message back.</p>
                </div>
                <div className="bg-blue-900 bg-opacity-20 border border-blue-700 p-2 rounded">
                  <strong className="text-blue-300">💡 Pro Tip:</strong>
                  <p className="mt-1 text-blue-200">Use {'{variableName}'} in any text field to insert variable values!</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

          {/* Main Canvas */}
          <div className="flex-1 flex flex-col">
            {/* Top Bar - macOS Style */}
            <div className="glass-strong rounded-t-2xl border-b" style={{ borderColor: 'var(--border-color)' }}>
              {/* Title Row */}
              <div className="flex items-center justify-between px-4 py-3">
                <h1 className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>
                  {id ? 'Edit Plugin' : 'Create Plugin'}
                </h1>
                
                {/* Theme Toggle */}
                <button
                  onClick={toggleTheme}
                  className={`theme-toggle-btn ${
                    theme === 'space' ? 'holographic-glow' : ''
                  }`}
                  title={`Current theme: ${theme}. Click to switch.`}
                >
                  {theme === 'light' ? '☀️' : theme === 'dark' ? '🌙' : '🚀'}
                </button>
              </div>
              
              {/* Toolbar */}
              <div className="px-4 pb-3">
          <div className="flex items-center justify-between mb-4">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleExport}
                className={`px-4 py-2 text-white rounded-lg transition-all transform hover:scale-105 flex items-center gap-2 shadow-lg ${
                  theme === 'space'
                    ? 'holographic-glow bg-gradient-to-r from-hologram-500 to-nebula-purple hover:from-hologram-400 hover:to-nebula-600'
                    : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
                }`}
                title="Export workflow as JSON"
              >
                <span>📤</span>
                Export
              </button>
              <label className={`px-4 py-2 text-white rounded-lg transition-all transform hover:scale-105 cursor-pointer flex items-center gap-2 shadow-lg ${
                theme === 'space'
                  ? 'holographic-glow bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500'
                  : 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800'
              }`} title="Import workflow from JSON">
                <span>📥</span>
                Import
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>
              <button
                onClick={handleTestCompile}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg transition-all transform hover:scale-105 shadow-lg"
              >
                <span>🧪</span>
                Test Compile
              </button>
              <button
                onClick={handleAutoArrange}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-all transform hover:scale-105 shadow-lg"
              >
                <span>📐</span>
                Auto-Arrange
              </button>
              <button
                onClick={handleValidateGraph}
                className="px-4 py-2 bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-white rounded-lg transition-all transform hover:scale-105 shadow-lg"
              >
                <span>✅</span>
                Validate
              </button>
              <button
                onClick={handleSave}
                disabled={saving || loading}
                className={`px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg transition-all transform hover:scale-105 flex items-center gap-2 shadow-lg ${(saving || loading) ? 'opacity-50 cursor-not-allowed transform-none' : ''}`}
              >
                {saving && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                )}
                {saving ? 'Saving...' : (id ? '💾 Update Plugin' : '💾 Save Plugin')}
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="px-4 py-2 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white rounded-lg transition-all transform hover:scale-105 shadow-lg"
              >
                <span>❌</span>
                Cancel
              </button>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="Plugin Name"
              value={pluginName}
              onChange={(e) => setPluginName(e.target.value)}
              className="px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
            />
            <input
              type="text"
              placeholder="Command Name (e.g., hello)"
              value={commandName}
              onChange={(e) => setCommandName(e.target.value)}
              className="px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
            />
            <select
              value={pluginType}
              onChange={(e) => setPluginType(e.target.value)}
              className="px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
            >
              <option value="slash">Slash Command</option>
              <option value="text">Text Command</option>
              <option value="both">Both</option>
            </select>
            <input
              type="text"
              placeholder="Description"
              value={pluginDescription}
              onChange={(e) => setPluginDescription(e.target.value)}
              className="px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
            />
          </div>
              </div>
            </div>

        {/* Command Options Section - Only show for slash commands */}
        {(pluginType === 'slash' || pluginType === 'both') && (
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-4 mb-4">
            <CommandOptionsManager
              options={commandOptions}
              onChange={setCommandOptions}
              nodes={nodes}
            />
          </div>
        )}

        {/* React Flow Canvas */}
        <div ref={reactFlowWrapper} className="flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            onEdgeClick={onEdgeClick}
            onNodeContextMenu={onNodeContextMenu}
            onPaneContextMenu={onPaneContextMenu}
            onEdgeContextMenu={onEdgeContextMenu}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            defaultEdgeOptions={{
              type: 'custom',
              animated: true,
              style: { strokeWidth: 2 },
            }}
            fitView
            className="bg-gray-900"
          >
            <Background color="#374151" gap={16} />
            <Controls className="bg-gray-800 border border-gray-700" />
            <MiniMap
              className="bg-gray-800 border border-gray-700"
              nodeColor={(node) => {
                const colors = {
                  trigger: '#22c55e',
                  response: '#3b82f6',
                  variable: '#a855f7',
                  condition: '#eab308',
                  action: '#f97316',
                  data: '#06b6d4'
                };
                return colors[node.type] || '#6b7280';
              }}
            />
          </ReactFlow>
        </div>
      </div>

      {/* Right Sidebar - Node Properties */}
      <NodeConfigPanel
        selectedNode={selectedNode}
        setNodes={setNodes}
        allNodes={nodes}
        allEdges={edges}
        onDelete={() => {
          setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
          setSelectedNodeId(null);
        }}
      />
      
      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={getContextMenuItems()}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* Toast Notifications */}
      <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />
    </div>
  );
}

export default PluginEditor;

