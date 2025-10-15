/**
 * Node Hover Event Utilities
 * Handles communication between nodes and edges for hover effects
 * @author fkndean_
 * @date 2025-10-15
 */

/**
 * Dispatch a node handle hover event
 * @param {string} nodeId - The ID of the node being hovered
 * @param {boolean} isHovering - Whether the node is being hovered or not
 */
export const dispatchNodeHover = (nodeId, isHovering) => {
  const event = new CustomEvent('nodeHandleHover', {
    detail: { nodeId, isHovering }
  });
  window.dispatchEvent(event);
};

/**
 * Hook to handle node hover events
 * @param {string} nodeId - The ID of the node
 * @returns {Object} - Hover handlers
 */
export const useNodeHover = (nodeId) => {
  const handleMouseEnter = () => {
    dispatchNodeHover(nodeId, true);
  };

  const handleMouseLeave = () => {
    dispatchNodeHover(nodeId, false);
  };

  return {
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
  };
};
