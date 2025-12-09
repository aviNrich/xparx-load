import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import { Mapping } from '../../types/mapping';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Pencil, Trash2, Workflow, Plus, Eye } from 'lucide-react';

interface MappingListProps {
  mappings: Mapping[];
  onEdit?: (mapping: Mapping) => void;
  onDelete?: (mapping: Mapping) => void;
  onNew?: () => void;
}

export function MappingList({ mappings, onEdit, onDelete, onNew }: MappingListProps) {
  const [queryDialogOpen, setQueryDialogOpen] = useState(false);
  const [selectedQuery, setSelectedQuery] = useState<string>('');

  const handleViewQuery = (query: string) => {
    setSelectedQuery(query);
    setQueryDialogOpen(true);
  };

  if (mappings.length === 0) {
    return (
      <div className="text-center py-24 bg-white rounded-xl border border-neutral-200">
        <Workflow className="mx-auto h-16 w-16 text-neutral-400 mb-4" />
        <h3 className="text-xl font-semibold text-neutral-900 mb-2">No mappings yet</h3>
        <p className="text-neutral-600 mb-6">Create your first mapping to get started.</p>
        {onNew && (
          <Button onClick={onNew} className="bg-primary-500 hover:bg-primary-600">
            <Plus className="mr-2 h-4 w-4" />
            Create Mapping
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr>
              <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                Name
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                Description
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                Source
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                Query
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                Created
              </th>
              <th className="text-right py-3 px-4 text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {mappings.map((mapping) => (
              <tr
                key={mapping._id}
                className="hover:bg-neutral-50 transition-colors"
              >
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                      <Workflow className="h-4 w-4 text-primary-600" />
                    </div>
                    <span className="font-medium text-neutral-900">{mapping.name}</span>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <span className="text-sm text-neutral-700">
                    {mapping.description || <span className="italic text-neutral-400">No description</span>}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <span className="text-sm text-neutral-700">{mapping.source_connection_id}</span>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-neutral-700 truncate max-w-xs">
                      {mapping.sql_query.length > 50
                        ? `${mapping.sql_query.substring(0, 50)}...`
                        : mapping.sql_query}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleViewQuery(mapping.sql_query)}
                      className="h-6 w-6 p-0 hover:bg-neutral-100"
                      title="View full query"
                    >
                      <Eye className="h-3 w-3 text-neutral-600" />
                    </Button>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <span className="text-xs text-neutral-500">
                    {new Date(mapping.created_at).toLocaleDateString()}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center justify-end gap-2">
                    {onEdit && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onEdit(mapping)}
                        className="border-neutral-200 hover:bg-neutral-50"
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                    )}
                    {onDelete && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onDelete(mapping)}
                        className="border-red-200 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Query View Dialog */}
      <Dialog open={queryDialogOpen} onOpenChange={setQueryDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>SQL Query</DialogTitle>
          </DialogHeader>
          <div className="border border-neutral-300 rounded-md overflow-hidden" style={{ height: '400px' }}>
            <Editor
              height="100%"
              language="sql"
              theme="vs-light"
              value={selectedQuery}
              options={{
                readOnly: true,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontSize: 13,
                lineNumbers: 'on',
                automaticLayout: true,
                padding: { top: 8, bottom: 8 },
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
