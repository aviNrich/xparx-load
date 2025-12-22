import { useEffect, useRef, useState } from 'react';
import { SchemaField } from '../../types/schema';
import { FieldPosition } from './ColumnMappingDragDrop';

interface TargetFieldListProps {
  targetFields: SchemaField[];
  mappedFields: Set<string>;
  draggedSource: string | null;
  onPositionUpdate: (positions: Map<string, FieldPosition>) => void;
  onDrop: (targetField: string) => void;
}

export function TargetFieldList({
  targetFields,
  mappedFields,
  draggedSource,
  onPositionUpdate,
  onDrop,
}: TargetFieldListProps) {
  const fieldRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragOverField, setDragOverField] = useState<string | null>(null);

  // Update positions whenever they might change
  const updatePositions = () => {
    if (!containerRef.current) return;

    const positions = new Map<string, FieldPosition>();

    fieldRefs.current.forEach((element, fieldName) => {
      const rect = element.getBoundingClientRect();
      positions.set(fieldName, {
        fieldName,
        x: rect.left, // Absolute left edge
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
  }, [targetFields, mappedFields, onPositionUpdate]);

  const handleDragOver = (e: React.DragEvent, fieldName: string) => {
    e.preventDefault();
    setDragOverField(fieldName);
  };

  const handleDragLeave = () => {
    setDragOverField(null);
  };

  const handleDrop = (e: React.DragEvent, fieldName: string) => {
    e.preventDefault();
    setDragOverField(null);
    onDrop(fieldName);
  };

  const unmappedCount = targetFields.filter(field => !mappedFields.has(field.name)).length;

  const getFieldTypeColor = (fieldType: string) => {
    switch (fieldType) {
      case 'string':
        return 'text-blue-600 bg-blue-50';
      case 'integer':
        return 'text-green-600 bg-green-50';
      case 'date':
        return 'text-purple-600 bg-purple-50';
      case 'boolean':
        return 'text-orange-600 bg-orange-50';
      default:
        return 'text-neutral-600 bg-neutral-50';
    }
  };

  return (
    <div className="flex flex-col h-full" ref={containerRef}>
      <div className="flex-shrink-0 pb-3 border-b border-neutral-200">
        <h3 className="text-sm font-semibold text-neutral-900">
          Target Fields
        </h3>
        <p className="text-xs text-neutral-500 mt-1">
          {unmappedCount} of {targetFields.length} unmapped
        </p>
      </div>

      <div
        data-scroll-container
        className="flex-1 overflow-y-auto mt-4 space-y-2 pl-2 scrollbar-thin"
        style={{
          maxHeight: 'calc(100vh - 400px)',
          scrollbarWidth: 'thin',
          scrollbarColor: '#cbd5e1 transparent'
        }}
      >
        {targetFields.map((field) => {
          const isMapped = mappedFields.has(field.name);
          const isDragOver = dragOverField === field.name;

          return (
            <div
              key={field.name}
              ref={(el) => {
                if (el) {
                  fieldRefs.current.set(field.name, el);
                } else {
                  fieldRefs.current.delete(field.name);
                }
              }}
              onDragOver={(e) => handleDragOver(e, field.name)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, field.name)}
              className={`
                relative border rounded-lg p-3 transition-all
                ${
                  isMapped
                    ? 'bg-primary-50 border-primary-300'
                    : isDragOver && draggedSource
                    ? 'bg-primary-100 border-primary-400 shadow-md scale-105'
                    : 'bg-white border-neutral-200'
                }
                ${!isMapped && draggedSource ? 'hover:border-primary-300 hover:bg-primary-50' : ''}
              `}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {isMapped && (
                      <span className="text-xs text-primary-600">✓</span>
                    )}
                    <span
                      className={`text-xs font-mono font-medium ${
                        isMapped ? 'text-primary-900' : 'text-neutral-900'
                      }`}
                    >
                      {field.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded ${getFieldTypeColor(
                        field.field_type
                      )}`}
                    >
                      {field.field_type}
                    </span>
                    {field.description && (
                      <span className="text-xs text-neutral-500 truncate">
                        {field.description}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {isDragOver && draggedSource && !isMapped && (
                <div className="absolute inset-0 border-2 border-dashed border-primary-500 rounded-lg pointer-events-none" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
