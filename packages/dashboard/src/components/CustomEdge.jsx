/**
 * Custom Edge Component with Hover Effects
 * Provides enhanced visibility and interaction for connection lines
 * @author fkndean_
 * @date 2025-10-15
 */

import { useState, useEffect } from 'react';
import { _BaseEdge, _EdgeLabelRenderer, _getBezierPath, getSmoothStepPath } from 'reactflow';

/**
 * Custom Edge with hover highlighting
 */
export function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isNodeHovered, setIsNodeHovered] = useState(false);

  // Get node IDs from edge data
  const sourceNodeId = data?.sourceNodeId;
  const targetNodeId = data?.targetNodeId;

  // Listen for node hover events
  useEffect(() => {
    const handleNodeHover = (event) => {
      const { nodeId, isHovering } = event.detail;
      if (nodeId === sourceNodeId || nodeId === targetNodeId) {
        setIsNodeHovered(isHovering);
      }
    };

    window.addEventListener('nodeHandleHover', handleNodeHover);
    return () => window.removeEventListener('nodeHandleHover', handleNodeHover);
  }, [sourceNodeId, targetNodeId]);

  // Get the path using smoothstep for better visual flow
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Enhanced styles for hover state
  const shouldGlow = isHovered || isNodeHovered;
  const edgeStyle = {
    ...style,
    strokeWidth: shouldGlow ? (style.strokeWidth || 2) + 4 : style.strokeWidth || 2,
    stroke: shouldGlow ? '#ffffff' : style.stroke || '#60a5fa',
    filter: shouldGlow ? 'drop-shadow(0 0 16px rgba(255, 255, 255, 0.9)) drop-shadow(0 0 32px rgba(255, 255, 255, 0.5))' : 'drop-shadow(0 0 4px rgba(96, 165, 250, 0.3))',
    transition: 'all 0.2s ease-in-out',
    opacity: shouldGlow ? 1 : 0.9,
  };

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={edgeStyle}
        markerEnd={markerEnd}
      />
      <EdgeLabelRenderer>
        {/* Single large hover area for better detection */}
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
            width: '60px',
            height: '60px',
            zIndex: 10,
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Large invisible hover area */}
          <div
            style={{
              width: '100%',
              height: '100%',
              background: 'transparent',
              cursor: 'pointer',
              borderRadius: '50%',
            }}
          />
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

export default CustomEdge;
