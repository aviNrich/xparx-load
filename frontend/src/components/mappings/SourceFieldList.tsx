import { useEffect, useRef } from 'react';
import { FieldPosition } from './ColumnMappingDragDrop';

interface SourceFieldListProps {
  sourceColumns: string[];
  sampleData: Record<string, any>[];
  mappedColumns: Set<string>;
  onPositionUpdate: (positions: Map<string, FieldPosition>) => void;
  onDragStart: (sourceColumn: string) => void;
  onDragEnd: () => void;
}

export function SourceFieldList({
  sourceColumns,
  sampleData,
  mappedColumns,
  onPositionUpdate,
  onDragStart,
  onDragEnd,
}: SourceFieldListProps) {
  const fieldRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);

  // Update positions whenever they might change
  const updatePositions = () => {
    if (!containerRef.current) return;

    const positions = new Map<string, FieldPosition>();

    fieldRefs.current.forEach((element, fieldName) => {
      const rect = element.getBoundingClientRect();
      positions.set(fieldName, {
        fieldName,
        x: rect.right, // Absolute right edge
        y: rect.top + rect.height / 2, // Absolute center Y
        width: rect.width,
        height: rect.height,
      });
    });

    onPositionUpdate(positions);
  };

  // Update positions on mount, scroll, resize, and when mappings change
  useEffect(() => {
    // Small delay to ensure DOM is ready
    const timer = setTimeout(updatePositions, 100);

    const resizeObserver = new ResizeObserver(updatePositions);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    const handleScroll = () => {
      requestAnimationFrame(updatePositions);
    };

    const scrollContainer = containerRef.current?.querySelector('[data-scroll-container]');
    scrollContainer?.addEventListener('scroll', handleScroll);

    window.addEventListener('resize', updatePositions);

    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
      scrollContainer?.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', updatePositions);
    };
  }, [sourceColumns, mappedColumns, onPositionUpdate]);

  const unmappedCount = sourceColumns.filter(col => !mappedColumns.has(col)).length;
  const sampleRow = sampleData[0] || {};

  return (
    <div className="flex flex-col h-full" ref={containerRef}>
      <div className="flex-shrink-0 pb-3 border-b border-neutral-200">
        <h3 className="text-sm font-semibold text-neutral-900">
          Source Fields
        </h3>
        <p className="text-xs text-neutral-500 mt-1">
          {unmappedCount} of {sourceColumns.length} unmapped
        </p>
      </div>

      <div
        data-scroll-container
        className="flex-1 overflow-y-auto mt-4 space-y-2 pr-2 scrollbar-thin"
        style={{
          maxHeight: 'calc(100vh - 400px)',
          scrollbarWidth: 'thin',
          scrollbarColor: '#cbd5e1 transparent'
        }}
      >
        {sourceColumns.map((column) => {
          const isMapped = mappedColumns.has(column);
          const sampleValue = sampleRow[column];
          const displayValue =
            sampleValue === null || sampleValue === undefined
              ? '—'
              : String(sampleValue).substring(0, 50);

          return (
            <div
              key={column}
              ref={(el) => {
                if (el) {
                  fieldRefs.current.set(column, el);
                } else {
                  fieldRefs.current.delete(column);
                }
              }}
              draggable={!isMapped}
              onDragStart={() => onDragStart(column)}
              onDragEnd={onDragEnd}
              className={`
                group relative border rounded-lg p-3 transition-all
                ${
                  isMapped
                    ? 'bg-primary-50 border-primary-300'
                    : 'bg-white border-neutral-200 hover:border-neutral-300 hover:shadow-sm cursor-grab active:cursor-grabbing'
                }
              `}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-mono font-medium ${
                        isMapped ? 'text-primary-900' : 'text-neutral-900'
                      }`}
                    >
                      {column}
                    </span>
                    {isMapped && (
                      <span className="text-xs text-primary-600">✓</span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-500 mt-1 truncate">
                    {displayValue}
                  </p>
                </div>
                {!isMapped && (
                  <div className="flex-shrink-0 text-neutral-400 group-hover:text-neutral-600">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
