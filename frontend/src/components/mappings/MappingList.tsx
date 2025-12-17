import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { Mapping } from '../../types/mapping';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { Pencil, Trash2, Workflow, Plus, Eye, Database } from 'lucide-react';

interface MappingListProps {
  mappings: Mapping[];
  onDelete?: (mapping: Mapping) => void;
}

export function MappingList({ mappings, onDelete }: MappingListProps) {
  const [queryDialogOpen, setQueryDialogOpen] = useState(false);
  const [selectedQuery, setSelectedQuery] = useState<string>('');

  const handleViewQuery = (query: string) => {
    setSelectedQuery(query);
    setQueryDialogOpen(true);
  };

  // Group mappings by source
  const groupedMappings = useMemo(() => {
    const groups = new Map<string, { sourceName: string; sourceId: string; mappings: Mapping[] }>();

    mappings.forEach((mapping) => {
      const sourceId = mapping.source_connection_id;
      const sourceName = mapping.source_name || sourceId;

      if (!groups.has(sourceId)) {
        groups.set(sourceId, {
          sourceName,
          sourceId,
          mappings: [],
        });
      }

      groups.get(sourceId)!.mappings.push(mapping);
    });

    return Array.from(groups.values()).sort((a, b) =>
      a.sourceName.localeCompare(b.sourceName)
    );
  }, [mappings]);

  if (mappings.length === 0) {
    return (
      <div className="text-center py-24 bg-white rounded-xl border border-neutral-200">
        <Workflow className="mx-auto h-16 w-16 text-neutral-400 mb-4" />
        <h3 className="text-xl font-semibold text-neutral-900 mb-2">No mappings yet</h3>
        <p className="text-neutral-600 mb-6">Create your first mapping to get started.</p>
        <Button asChild className="bg-primary-500 hover:bg-primary-600">
          <Link to="/mappings/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Mapping
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Accordion type="multiple" defaultValue={[]} className="space-y-4">
        {groupedMappings.map((group) => (
          <AccordionItem
            key={group.sourceId}
            value={group.sourceId}
            className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-sm"
          >
            <AccordionTrigger className="hover:no-underline px-6 py-4 hover:bg-neutral-50">
              <div className="flex items-center justify-between w-full pr-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Database className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-neutral-900 text-base">{group.sourceName}</h3>
                    <p className="text-xs text-neutral-500">
                      {group.mappings.length} {group.mappings.length === 1 ? 'mapping' : 'mappings'}
                    </p>
                  </div>
                </div>
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="border-neutral-200 hover:bg-neutral-50"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Link to={`/mappings/new?source=${group.sourceId}`}>
                    <Plus className="h-3 w-3 mr-1" />
                    New Mapping
                  </Link>
                </Button>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-0 pb-0">
              <div className="border-t border-neutral-200 bg-neutral-50/50">
                <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-neutral-100 border-b border-neutral-200">
                    <tr>
                      <th className="text-left py-3 px-6 text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="text-left py-3 px-6 text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="text-left py-3 px-6 text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                        Query
                      </th>
                      <th className="text-left py-3 px-6 text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="text-right py-3 px-6 text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 bg-white">
                    {group.mappings.map((mapping) => (
                      <tr
                        key={mapping._id}
                        className="hover:bg-blue-50/30 transition-colors"
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                              <Workflow className="h-4 w-4 text-primary-600" />
                            </div>
                            <span className="font-medium text-neutral-900">{mapping.name}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-sm text-neutral-700">
                            {mapping.description || <span className="italic text-neutral-400">No description</span>}
                          </span>
                        </td>
                        <td className="py-4 px-6">
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
                        <td className="py-4 px-6">
                          <span className="text-xs text-neutral-500">
                            {new Date(mapping.created_at).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              asChild
                              size="sm"
                              variant="outline"
                              className="border-neutral-200 hover:bg-neutral-50"
                            >
                              <Link to={`/mappings/${mapping._id}`}>
                                <Pencil className="h-3 w-3" />
                              </Link>
                            </Button>
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
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
   
      
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
