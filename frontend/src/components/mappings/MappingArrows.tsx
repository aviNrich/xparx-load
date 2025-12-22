import { useState, useEffect, RefObject, useRef } from 'react';
import { DirectMapping } from '../../types/mapping';
import { FieldPosition } from './ColumnMappingDragDrop';
import { Trash2 } from 'lucide-react';

interface MappingArrowsProps {
  directMappings: DirectMapping[];
  sourcePositions: Map<string, FieldPosition>;
  targetPositions: Map<string, FieldPosition>;
  containerRef: RefObject<HTMLDivElement>;
  onRemoveMapping: (sourceColumn: string) => void;
}

interface ArrowPath {
  sourceColumn: string;
  targetField: string;
  path: string;
  midX: number;
  midY: number;
}

export function MappingArrows({
  directMappings,
  sourcePositions,
  targetPositions,
  containerRef,
  onRemoveMapping,
}: MappingArrowsProps) {
  const [arrowPaths, setArrowPaths] = useState<ArrowPath[]>([]);
  const [hoveredArrow, setHoveredArrow] = useState<string | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate stepped arrow paths
  useEffect(() => {
    if (!containerRef.current) {
      setArrowPaths([]);
      return;
    }

    const containerRect = containerRef.current.getBoundingClientRect();
    const paths: ArrowPath[] = [];

    directMappings.forEach((mapping) => {
      const sourcePos = sourcePositions.get(mapping.source_column);
      const targetPos = targetPositions.get(mapping.target_field);

      if (!sourcePos || !targetPos) return;

      // Convert absolute positions to container-relative positions
      // Start point (right edge of source)
      const x1 = sourcePos.x - containerRect.left;
      const y1 = sourcePos.y - containerRect.top;

      // End point (left edge of target)
      const x2 = targetPos.x - containerRect.left;
      const y2 = targetPos.y - containerRect.top;

      // Midpoint X (halfway between source and target)
      const midX = (x1 + x2) / 2;

      // Create stepped path:
      // 1. Horizontal line from source to midpoint
      // 2. Vertical line from midpoint Y to target Y
      // 3. Horizontal line from midpoint to target
      const path = `
        M ${x1} ${y1}
        L ${midX} ${y1}
        L ${midX} ${y2}
        L ${x2} ${y2}
      `;

      paths.push({
        sourceColumn: mapping.source_column,
        targetField: mapping.target_field,
        path: path.trim(),
        midX,
        midY: (y1 + y2) / 2,
      });
    });

    setArrowPaths(paths);
  }, [directMappings, sourcePositions, targetPositions, containerRef]);

  // Handle mouse enter with immediate response
  const handleMouseEnter = (sourceColumn: string) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setHoveredArrow(sourceColumn);
  };

  // Handle mouse leave with delay to prevent flickering
  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredArrow(null);
    }, 150);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  if (!containerRef.current || arrowPaths.length === 0) {
    return null;
  }

  const containerRect = containerRef.current.getBoundingClientRect();

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      style={{
        width: containerRect.width,
        height: containerRect.height,
        zIndex: 10,
      }}
    >
      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="10"
          refX="0"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,0 L0,6 L9,3 z" fill="#3b82f6" />
        </marker>
        <marker
          id="arrowhead-hover"
          markerWidth="10"
          markerHeight="10"
          refX="0"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,0 L0,6 L9,3 z" fill="#2563eb" />
        </marker>
      </defs>

      {arrowPaths.map((arrow) => {
        const isHovered = hoveredArrow === arrow.sourceColumn;
        const arrowKey = `${arrow.sourceColumn}-${arrow.targetField}`;

        return (
          <g key={arrowKey}>
            {/* Invisible thick path for easier hover detection */}
            <path
              d={arrow.path}
              fill="none"
              stroke="transparent"
              strokeWidth="40"
              className="pointer-events-auto cursor-pointer"
              onMouseEnter={() => handleMouseEnter(arrow.sourceColumn)}
              onMouseLeave={handleMouseLeave}
              style={{ strokeLinecap: 'round', strokeLinejoin: 'round' }}
            />

            {/* Visible arrow path */}
            <path
              d={arrow.path}
              fill="none"
              stroke={isHovered ? '#2563eb' : '#3b82f6'}
              strokeWidth={isHovered ? '3' : '2'}
              markerEnd={isHovered ? 'url(#arrowhead-hover)' : 'url(#arrowhead)'}
              className="transition-all pointer-events-none"
            />

            {/* Delete button on hover */}
            {isHovered && (
              <g
                className="pointer-events-auto cursor-pointer"
                onMouseEnter={() => handleMouseEnter(arrow.sourceColumn)}
                onMouseLeave={handleMouseLeave}
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveMapping(arrow.sourceColumn);
                }}
              >
                {/* Background circle */}
                <circle
                  cx={arrow.midX}
                  cy={arrow.midY}
                  r="16"
                  fill="white"
                  stroke="#ef4444"
                  strokeWidth="2"
                />
                {/* Trash icon (simplified) */}
                <foreignObject
                  x={arrow.midX - 8}
                  y={arrow.midY - 8}
                  width="16"
                  height="16"
                  style={{ pointerEvents: 'none' }}
                >
                  <div className="flex items-center justify-center w-full h-full">
                    <Trash2 className="w-3 h-3 text-red-600" />
                  </div>
                </foreignObject>
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}
