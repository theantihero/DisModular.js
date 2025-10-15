/**
 * Layout Utilities for React Flow
 * Auto-layout algorithms for node positioning
 * @author fkndean_
 * @date 2025-10-15
 */

import dagre from 'dagre';

/**
 * Get layouted elements using dagre algorithm
 * @param {Array} nodes - Array of node objects
 * @param {Array} edges - Array of edge objects
 * @param {Object} options - Layout options
 * @returns {Object} - Layouted nodes and edges
 */
export const getLayoutedElements = (nodes, edges, options = {}) => {
  const {
    direction = 'LR', // Left to Right
    ranksep = 250,    // Distance between ranks (increased for horizontal)
    nodesep = 120,    // Distance between nodes in same rank
    nodeWidth = 200,  // Default node width
    nodeHeight = 100  // Default node height
  } = options;

  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ 
    rankdir: direction, 
    ranksep, 
    nodesep,
    marginx: 50,
    marginy: 50
  });

  // Add nodes to dagre graph
  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { 
      width: nodeWidth, 
      height: nodeHeight 
    });
  });

  // Add edges to dagre graph
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  // Run layout algorithm
  dagre.layout(dagreGraph);

  // Update node positions
  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

/**
 * Get hierarchical layout with grouping
 * @param {Array} nodes - Array of node objects
 * @param {Array} edges - Array of edge objects
 * @returns {Object} - Layouted nodes and edges with grouping
 */
export const getHierarchicalLayout = (nodes, edges) => {
  const nodeWidth = 200;
  const nodeHeight = 100;
  
  // Group nodes by type for better organization
  const nodeGroups = {
    trigger: [],
    variable: [],
    condition: [],
    action: [],
    response: [],
    other: []
  };

  nodes.forEach(node => {
    if (nodeGroups[node.type]) {
      nodeGroups[node.type].push(node);
    } else {
      nodeGroups.other.push(node);
    }
  });

  // Layout each group separately
  const groupLayouts = {};
  Object.keys(nodeGroups).forEach(groupType => {
    if (nodeGroups[groupType].length > 0) {
      const groupEdges = edges.filter(edge => 
        nodeGroups[groupType].some(node => 
          node.id === edge.source || node.id === edge.target
        )
      );
      
      groupLayouts[groupType] = getLayoutedElements(
        nodeGroups[groupType], 
        groupEdges,
        { direction: 'TB', ranksep: 120, nodesep: 80 }
      );
    }
  });

  // Combine layouts with offsets
  let yOffset = 0;
  const layoutedNodes = [];
  
  Object.keys(groupLayouts).forEach(groupType => {
    const layout = groupLayouts[groupType];
    layout.nodes.forEach(node => {
      layoutedNodes.push({
        ...node,
        position: {
          x: node.position.x,
          y: node.position.y + yOffset
        }
      });
    });
    
    // Calculate next group offset
    const maxY = Math.max(...layout.nodes.map(n => n.position.y + nodeHeight));
    yOffset += maxY + 200; // Add spacing between groups
  });

  return { nodes: layoutedNodes, edges };
};

/**
 * Get circular layout for small graphs
 * @param {Array} nodes - Array of node objects
 * @param {Array} edges - Array of edge objects
 * @param {Object} options - Layout options
 * @returns {Object} - Layouted nodes and edges
 */
export const getCircularLayout = (nodes, edges, options = {}) => {
  const { radius = 200, centerX = 400, centerY = 300 } = options;
  
  const layoutedNodes = nodes.map((node, index) => {
    const angle = (2 * Math.PI * index) / nodes.length;
    return {
      ...node,
      position: {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

/**
 * Get force-directed layout simulation
 * @param {Array} nodes - Array of node objects
 * @param {Array} edges - Array of edge objects
 * @param {Object} options - Layout options
 * @returns {Object} - Layouted nodes and edges
 */
export const getForceDirectedLayout = (nodes, edges, options = {}) => {
  const {
    iterations = 100,
    strength = 0.1,
    damping = 0.8,
    centerX = 400,
    centerY = 300
  } = options;

  // Initialize positions randomly
  let layoutedNodes = nodes.map(node => ({
    ...node,
    position: {
      x: centerX + (Math.random() - 0.5) * 400,
      y: centerY + (Math.random() - 0.5) * 300,
    },
    velocity: { x: 0, y: 0 }
  }));

  // Run force simulation
  for (let i = 0; i < iterations; i++) {
    layoutedNodes = layoutedNodes.map(node => {
      let fx = 0, fy = 0;

      // Repulsion from other nodes
      layoutedNodes.forEach(otherNode => {
        if (node.id !== otherNode.id) {
          const dx = node.position.x - otherNode.position.x;
          const dy = node.position.y - otherNode.position.y;
          const distance = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = strength / (distance * distance);
          fx += (dx / distance) * force;
          fy += (dy / distance) * force;
        }
      });

      // Attraction from connected nodes
      edges.forEach(edge => {
        if (edge.source === node.id) {
          const targetNode = layoutedNodes.find(n => n.id === edge.target);
          if (targetNode) {
            const dx = targetNode.position.x - node.position.x;
            const dy = targetNode.position.y - node.position.y;
            const distance = Math.sqrt(dx * dx + dy * dy) || 1;
            const force = strength * distance;
            fx += (dx / distance) * force;
            fy += (dy / distance) * force;
          }
        }
      });

      // Apply forces with damping
      node.velocity.x = (node.velocity.x + fx) * damping;
      node.velocity.y = (node.velocity.y + fy) * damping;
      
      return {
        ...node,
        position: {
          x: node.position.x + node.velocity.x,
          y: node.position.y + node.velocity.y,
        }
      };
    });
  }

  // Remove velocity property
  return {
    nodes: layoutedNodes.map(({ velocity, ...node }) => node),
    edges
  };
};

/**
 * Auto-detect best layout algorithm based on graph characteristics
 * @param {Array} nodes - Array of node objects
 * @param {Array} edges - Array of edge objects
 * @returns {Object} - Layouted nodes and edges
 */
export const getAutoLayout = (nodes, edges) => {
  const nodeCount = nodes.length;
  
  // Always use grid layout for horizontal left-to-right flow
  // This ensures consistent horizontal arrangement as per design requirements
  return getGridLayout(nodes, edges);
};

/**
 * Check if graph has hierarchical structure
 * @param {Array} nodes - Array of node objects
 * @param {Array} edges - Array of edge objects
 * @returns {Boolean} - True if hierarchical
 */
const hasHierarchicalStructure = (nodes, edges) => {
  // Check for trigger nodes (entry points)
  const hasTrigger = nodes.some(node => node.type === 'trigger');
  
  // Check for response nodes (exit points)
  const hasResponse = nodes.some(node => node.type === 'response');
  
  // Check for condition nodes (branching)
  const hasCondition = nodes.some(node => node.type === 'condition');
  
  return hasTrigger && (hasResponse || hasCondition);
};

/**
 * Get grid-based horizontal layout
 * Arranges nodes in columns based on execution order
 * @param {Array} nodes - Array of node objects
 * @param {Array} edges - Array of edge objects
 * @returns {Object} - Layouted nodes and edges
 */
export const getGridLayout = (nodes, edges) => {
  // Find trigger node (starting point)
  const trigger = nodes.find(n => n.type === 'trigger');
  if (!trigger) {
    // No trigger, fall back to dagre
    return getLayoutedElements(nodes, edges, { direction: 'LR' });
  }
  
  // Calculate depth for each node using BFS
  const depths = new Map();
  const queue = [{ id: trigger.id, depth: 0 }];
  const visited = new Set();
  
  while (queue.length > 0) {
    const { id, depth } = queue.shift();
    if (visited.has(id)) continue;
    visited.add(id);
    depths.set(id, depth);
    
    const outgoing = edges.filter(e => e.source === id);
    outgoing.forEach(edge => {
      if (!visited.has(edge.target)) {
        queue.push({ id: edge.target, depth: depth + 1 });
      }
    });
  }
  
  // Assign depth 0 to any unconnected nodes
  nodes.forEach(node => {
    if (!depths.has(node.id)) {
      depths.set(node.id, 0);
    }
  });
  
  // Group nodes by depth
  const columns = new Map();
  nodes.forEach(node => {
    const depth = depths.get(node.id) || 0;
    if (!columns.has(depth)) columns.set(depth, []);
    columns.get(depth).push(node);
  });
  
  // Position nodes in grid
  const columnWidth = 300;
  const rowHeight = 150;
  const layoutedNodes = [];
  
  columns.forEach((columnNodes, depth) => {
    // Sort nodes in column by type for better organization
    const sortedNodes = columnNodes.sort((a, b) => {
      const typeOrder = { trigger: 0, variable: 1, condition: 2, action: 3, response: 4 };
      const aOrder = typeOrder[a.type] || 5;
      const bOrder = typeOrder[b.type] || 5;
      return aOrder - bOrder;
    });
    
    // Center align column if it has fewer nodes
    const columnHeight = sortedNodes.length * rowHeight;
    const startY = 0;
    
    sortedNodes.forEach((node, index) => {
      layoutedNodes.push({
        ...node,
        position: {
          x: depth * columnWidth,
          y: startY + (index * rowHeight)
        }
      });
    });
  });
  
  return { nodes: layoutedNodes, edges };
};
