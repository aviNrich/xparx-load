import { useState } from 'react';
import { ColumnMapping, SplitMapping, JoinMapping } from '../../types/mapping';
import { SchemaField } from '../../types/schema';
import { Button } from '../ui/button';
import { ChevronDown, ChevronRight, Plus, GitBranch, GitMerge } from 'lucide-react';
import { SplitMappingRow } from './SplitMappingRow';
import { JoinMappingRow } from './JoinMappingRow';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

interface AdvancedMappingsPanelProps {
  advancedMappings: ColumnMapping[];
  sourceColumns: string[];
  targetFields: SchemaField[];
  sampleData: Record<string, any>[];
  onChange: (mappings: ColumnMapping[]) => void;
}

export function AdvancedMappingsPanel({
  advancedMappings,
  sourceColumns,
  targetFields,
  sampleData,
  onChange,
}: AdvancedMappingsPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Convert sample data to array format for compatibility with existing components
  const sampleDataArray = sampleData.length > 0
    ? [sourceColumns.map(col => sampleData[0][col])]
    : [];

  const handleAddSplitMapping = () => {
    const newMapping: SplitMapping = {
      type: 'split',
      source_column: '',
      delimiter: ',',
      target_fields: ['', ''],
    };
    onChange([...advancedMappings, newMapping]);
  };

  const handleAddJoinMapping = () => {
    const newMapping: JoinMapping = {
      type: 'join',
      source_columns: ['', ''],
      separator: ' ',
      target_field: '',
    };
    onChange([...advancedMappings, newMapping]);
  };

  const handleMappingChange = (index: number, updatedMapping: ColumnMapping) => {
    const newMappings = [...advancedMappings];
    newMappings[index] = updatedMapping;
    onChange(newMappings);
  };

  const handleMappingDelete = (index: number) => {
    const newMappings = advancedMappings.filter((_, i) => i !== index);
    onChange(newMappings);
  };

  const splitMappings = advancedMappings.filter(m => m.type === 'split') as SplitMapping[];
  const joinMappings = advancedMappings.filter(m => m.type === 'join') as JoinMapping[];

  return (
    <div className="flex-shrink-0 w-80 flex flex-col border-l border-neutral-200 bg-white">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-neutral-200">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center gap-2 w-full text-left group"
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-neutral-700" />
          ) : (
            <ChevronDown className="w-4 h-4 text-neutral-500 group-hover:text-neutral-700" />
          )}
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-neutral-900">
              Advanced Mappings
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              {advancedMappings.length} split/join
            </p>
          </div>
        </button>
      </div>

      {/* Content */}
      {!isCollapsed && (
        <>
          {/* Scrollable content */}
          <div
            className="flex-1 overflow-y-auto p-4 space-y-4"
            style={{ maxHeight: 'calc(100vh - 400px)' }}
          >
            {advancedMappings.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-neutral-500">
                  No advanced mappings yet.
                </p>
                <p className="text-xs text-neutral-400 mt-1">
                  Use the button below to add split or join mappings.
                </p>
              </div>
            ) : (
              <>
                {splitMappings.map((mapping) => {
                  const originalIndex = advancedMappings.findIndex(
                    m => m === mapping
                  );
                  return (
                    <div
                      key={`split-${originalIndex}`}
                      className="border border-neutral-200 rounded-lg p-3 bg-neutral-50"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <GitBranch className="w-4 h-4 text-purple-600" />
                        <span className="text-xs font-semibold text-purple-600 bg-purple-100 px-2 py-0.5 rounded">
                          SPLIT
                        </span>
                        <span className="text-xs text-neutral-500">
                          1 → {mapping.target_fields.filter(f => f).length}
                        </span>
                      </div>
                      <SplitMappingRow
                        mapping={mapping}
                        sourceColumns={sourceColumns}
                        targetFields={targetFields}
                        sampleData={sampleDataArray}
                        onChange={(updated) =>
                          handleMappingChange(originalIndex, updated)
                        }
                        onDelete={() => handleMappingDelete(originalIndex)}
                      />
                    </div>
                  );
                })}

                {joinMappings.map((mapping) => {
                  const originalIndex = advancedMappings.findIndex(
                    m => m === mapping
                  );
                  return (
                    <div
                      key={`join-${originalIndex}`}
                      className="border border-neutral-200 rounded-lg p-3 bg-neutral-50"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <GitMerge className="w-4 h-4 text-orange-600" />
                        <span className="text-xs font-semibold text-orange-600 bg-orange-100 px-2 py-0.5 rounded">
                          JOIN
                        </span>
                        <span className="text-xs text-neutral-500">
                          {mapping.source_columns.filter(c => c).length} → 1
                        </span>
                      </div>
                      <JoinMappingRow
                        mapping={mapping}
                        sourceColumns={sourceColumns}
                        targetFields={targetFields}
                        sampleData={sampleDataArray}
                        onChange={(updated) =>
                          handleMappingChange(originalIndex, updated)
                        }
                        onDelete={() => handleMappingDelete(originalIndex)}
                      />
                    </div>
                  );
                })}
              </>
            )}
          </div>

          {/* Add Button (Fixed at bottom) */}
          <div className="flex-shrink-0 p-4 border-t border-neutral-200">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Split/Join
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleAddSplitMapping}>
                  <span className="text-purple-600 font-semibold mr-2">Split</span>
                  <span className="text-xs text-neutral-500">
                    1 source → many targets
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleAddJoinMapping}>
                  <span className="text-orange-600 font-semibold mr-2">Join</span>
                  <span className="text-xs text-neutral-500">
                    Many sources → 1 target
                  </span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </>
      )}
    </div>
  );
}
