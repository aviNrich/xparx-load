import { useState } from 'react';
import { ColumnMapping } from '../../../types/mapping';
import { SchemaField } from '../../../types/schema';
import { Button } from '../../ui/button';
import { Plus, Database } from 'lucide-react';
import { MappingCard } from './MappingCard';
import { QuickMappingDialog } from './QuickMappingDialog';

interface MappingCanvasProps {
  mappings: ColumnMapping[];
  sourceColumns: string[];
  targetFields: SchemaField[];
  sampleData: Record<string, any>[];
  hasPreview: boolean;
  onMappingsChange: (mappings: ColumnMapping[]) => void;
}

export function MappingCanvas({
  mappings,
  sourceColumns,
  targetFields,
  sampleData,
  hasPreview,
  onMappingsChange,
}: MappingCanvasProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMapping, setEditingMapping] = useState<{ index: number; mapping: ColumnMapping } | null>(null);

  const handleAddMapping = (mapping: ColumnMapping) => {
    if (editingMapping !== null) {
      // Update existing mapping
      const newMappings = [...mappings];
      newMappings[editingMapping.index] = mapping;
      onMappingsChange(newMappings);
      setEditingMapping(null);
    } else {
      // Add new mapping
      onMappingsChange([...mappings, mapping]);
    }
    setDialogOpen(false);
  };

  const handleEditMapping = (index: number) => {
    setEditingMapping({ index, mapping: mappings[index] });
    setDialogOpen(true);
  };

  const handleDeleteMapping = (index: number) => {
    const newMappings = mappings.filter((_, i) => i !== index);
    onMappingsChange(newMappings);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingMapping(null);
  };

  return (
    <div className="flex-1 flex flex-col bg-neutral-50 overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-neutral-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-neutral-900">Mapping Builder</h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              {mappings.length === 0
                ? 'Add mappings to transform data'
                : `${mappings.length} mapping${mappings.length === 1 ? '' : 's'} configured`}
            </p>
          </div>
          <Button
            onClick={() => setDialogOpen(true)}
            disabled={!hasPreview || sourceColumns.length === 0 || targetFields.length === 0}
            size="sm"
            className="bg-primary-600 hover:bg-primary-700"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Mapping
          </Button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 overflow-y-auto p-6">
        {mappings.length === 0 ? (
          /* Empty State */
          <div className="h-full flex items-center justify-center">
            <div className="text-center max-w-md">
              <div className="mx-auto h-16 w-16 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
                <Database className="h-8 w-8 text-neutral-400" />
              </div>
              <h3 className="text-lg font-medium text-neutral-900 mb-2">
                {hasPreview ? 'Add your first mapping' : 'Configure source first'}
              </h3>
              <p className="text-sm text-neutral-600 mb-6">
                {hasPreview
                  ? 'Start by creating mappings from source columns to target fields. You can drag & drop or use the Add Mapping button.'
                  : 'Complete the source configuration and run a preview to start mapping columns.'}
              </p>
              {hasPreview && sourceColumns.length > 0 && targetFields.length > 0 && (
                <Button
                  onClick={() => setDialogOpen(true)}
                  size="default"
                  className="bg-primary-600 hover:bg-primary-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Mapping
                </Button>
              )}
            </div>
          </div>
        ) : (
          /* Mapping Cards */
          <div className="space-y-3">
            {mappings.map((mapping, index) => (
              <MappingCard
                key={index}
                mapping={mapping}
                targetFields={targetFields}
                sampleData={sampleData}
                onEdit={() => handleEditMapping(index)}
                onDelete={() => handleDeleteMapping(index)}
              />
            ))}

            {/* Add More Button */}
            {hasPreview && sourceColumns.length > 0 && targetFields.length > 0 && (
              <button
                onClick={() => setDialogOpen(true)}
                className="w-full p-4 border-2 border-dashed border-neutral-300 rounded-lg hover:border-primary-400 hover:bg-primary-50 transition-colors group"
              >
                <div className="flex items-center justify-center gap-2 text-neutral-600 group-hover:text-primary-600">
                  <Plus className="h-4 w-4" />
                  <span className="text-sm font-medium">Add Another Mapping</span>
                </div>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Quick Mapping Dialog */}
      <QuickMappingDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        sourceColumns={sourceColumns}
        targetFields={targetFields}
        sampleData={sampleData}
        existingMapping={editingMapping?.mapping}
        onSave={handleAddMapping}
      />
    </div>
  );
}
