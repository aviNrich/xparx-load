import { useState, useRef, useCallback } from 'react';
import { ColumnMapping, DirectMapping } from '../../types/mapping';
import { SchemaField } from '../../types/schema';
import { SourceFieldList } from './SourceFieldList';
import { TargetFieldList } from './TargetFieldList';
import { MappingArrows } from './MappingArrows';

interface ColumnMappingDragDropProps {
  mappings: ColumnMapping[];
  sourceColumns: string[];
  targetFields: SchemaField[];
  sampleData: Record<string, any>[];
  onChange: (mappings: ColumnMapping[]) => void;
}

export interface FieldPosition {
  fieldName: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export function ColumnMappingDragDrop({
  mappings,
  sourceColumns,
  targetFields,
  sampleData,
  onChange,
}: ColumnMappingDragDropProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sourcePositions, setSourcePositions] = useState<Map<string, FieldPosition>>(new Map());
  const [targetPositions, setTargetPositions] = useState<Map<string, FieldPosition>>(new Map());
  const [draggedSource, setDraggedSource] = useState<string | null>(null);

  // Only handle direct mappings in drag-and-drop mode
  const directMappings = mappings.filter(m => m.type === 'direct') as DirectMapping[];

  // Get mapped fields
  const mappedSourceColumns = new Set(directMappings.map(m => m.source_column));
  const mappedTargetFields = new Set(directMappings.map(m => m.target_field));

  // Handle field position updates
  const handleSourcePositionUpdate = useCallback((positions: Map<string, FieldPosition>) => {
    setSourcePositions(positions);
  }, []);

  const handleTargetPositionUpdate = useCallback((positions: Map<string, FieldPosition>) => {
    setTargetPositions(positions);
  }, []);

  // Handle drag start
  const handleDragStart = useCallback((sourceColumn: string) => {
    setDraggedSource(sourceColumn);
  }, []);

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    setDraggedSource(null);
  }, []);

  // Handle drop on target field
  const handleDrop = useCallback((targetField: string) => {
    if (!draggedSource) return;

    // Check if target field is already mapped
    if (mappedTargetFields.has(targetField)) {
      alert(`Target field "${targetField}" is already mapped. Please remove the existing mapping first.`);
      setDraggedSource(null);
      return;
    }

    // Check if source is already mapped
    const existingMapping = directMappings.find(m => m.source_column === draggedSource);
    if (existingMapping) {
      // Update existing mapping
      const updatedMappings = mappings.map(m =>
        m.type === 'direct' && m.source_column === draggedSource
          ? { ...m, target_field: targetField }
          : m
      );
      onChange(updatedMappings);
    } else {
      // Create new mapping
      const newMapping: DirectMapping = {
        type: 'direct',
        source_column: draggedSource,
        target_field: targetField,
      };
      onChange([...mappings, newMapping]);
    }

    setDraggedSource(null);
  }, [draggedSource, mappings, directMappings, mappedTargetFields, onChange]);

  // Handle removing a direct mapping
  const handleRemoveMapping = useCallback((sourceColumn: string) => {
    const updatedMappings = mappings.filter(
      m => !(m.type === 'direct' && m.source_column === sourceColumn)
    );
    onChange(updatedMappings);
  }, [mappings, onChange]);

  return (
    <div className="flex gap-4 h-full">
      {/* Main Drag & Drop Area */}
      <div className="flex-1 flex min-w-0 relative" style={{ gap: '100px' }} ref={containerRef}>
        {/* Source Fields (Left) */}
        <div className="flex-1 min-w-0">
          <SourceFieldList
            sourceColumns={sourceColumns}
            sampleData={sampleData}
            mappedColumns={mappedSourceColumns}
            onPositionUpdate={handleSourcePositionUpdate}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          />
        </div>

        {/* Target Fields (Right) */}
        <div className="flex-1 min-w-0">
          <TargetFieldList
            targetFields={targetFields}
            mappedFields={mappedTargetFields}
            draggedSource={draggedSource}
            onPositionUpdate={handleTargetPositionUpdate}
            onDrop={handleDrop}
          />
        </div>

        {/* SVG Arrow Overlay */}
        <MappingArrows
          directMappings={directMappings}
          sourcePositions={sourcePositions}
          targetPositions={targetPositions}
          containerRef={containerRef}
          onRemoveMapping={handleRemoveMapping}
        />
      </div>
    </div>
  );
}
