import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Connection } from '../../types/connection';
import { MappingRun } from '../../types/mappingRun';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Pencil, Trash2, Database, CheckCircle, XCircle, FileText, Plus, History } from 'lucide-react';
import { RunHistoryTable } from '../history/RunHistoryTable';
import { RunDetailsModal } from '../history/RunDetailsModal';

interface ConnectionListProps {
  connections: Connection[];
  onDelete: (connection: Connection) => void;
}

export function ConnectionList({ connections, onDelete }: ConnectionListProps) {
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedRun, setSelectedRun] = useState<MappingRun | null>(null);

  const handleViewHistory = (sourceId: string) => {
    setSelectedSourceId(sourceId);
    setHistoryModalOpen(true);
  };

  const handleRunClick = (run: MappingRun) => {
    setSelectedRun(run);
    setDetailsModalOpen(true);
  };

  const handleDetailsModalClose = () => {
    setDetailsModalOpen(false);
    setTimeout(() => setSelectedRun(null), 200);
  };

  const handleHistoryModalClose = () => {
    setHistoryModalOpen(false);
    setTimeout(() => setSelectedSourceId(null), 200);
  };

  // Group connections by type (file vs database)
  const groupedConnections = useMemo(() => {
    const fileConnections = connections.filter(conn => conn.db_type === 'file');
    const dbConnections = connections.filter(conn => conn.db_type !== 'file');

    const groups = [];

    if (fileConnections.length > 0) {
      groups.push({
        type: 'file',
        label: 'File Sources',
        icon: FileText,
        iconColor: 'text-purple-600',
        iconBg: 'bg-purple-100',
        connections: fileConnections,
      });
    }

    if (dbConnections.length > 0) {
      groups.push({
        type: 'database',
        label: 'Database Connections',
        icon: Database,
        iconColor: 'text-blue-600',
        iconBg: 'bg-blue-100',
        connections: dbConnections,
      });
    }

    return groups;
  }, [connections]);

  if (connections.length === 0) {
    return (
      <div className="text-center py-24 bg-white rounded-xl border border-neutral-200">
        <Database className="mx-auto h-16 w-16 text-neutral-400 mb-4" />
        <h3 className="text-xl font-semibold text-neutral-900 mb-2">No connections yet</h3>
        <p className="text-neutral-600 mb-6">Create your first connection to get started.</p>
        <Button asChild className="bg-primary-500 hover:bg-primary-600">
          <Link to="/sources/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Source
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Accordion type="multiple" defaultValue={groupedConnections.map(g => g.type)} className="space-y-4">
        {groupedConnections.map((group) => (
          <AccordionItem
            key={group.type}
            value={group.type}
            className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-sm"
          >
            <AccordionTrigger className="hover:no-underline px-6 py-4 hover:bg-neutral-50">
              <div className="flex items-center justify-between w-full pr-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${group.iconBg} rounded-lg flex items-center justify-center`}>
                    <group.icon className={`h-5 w-5 ${group.iconColor}`} />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-neutral-900 text-base">{group.label}</h3>
                    <p className="text-xs text-neutral-500">
                      {group.connections.length} {group.connections.length === 1 ? 'connection' : 'connections'}
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
                  <Link to={`/sources/new?type=${group.type === 'file' ? 'file' : 'mysql'}`}>
                    <Plus className="h-3 w-3 mr-1" />
                    Add Source
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
                          Type
                        </th>
                        {group.type === 'file' && (
                          <th className="text-left py-3 px-6 text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                            File Type
                          </th>
                        )}
                        {group.type === 'database' && (
                          <>
                            <th className="text-left py-3 px-6 text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                              Host
                            </th>
                            <th className="text-left py-3 px-6 text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                              Database
                            </th>
                            <th className="text-left py-3 px-6 text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                              Username
                            </th>
                            <th className="text-left py-3 px-6 text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                              Status
                            </th>
                          </>
                        )}
                        <th className="text-left py-3 px-6 text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                          Last Tested
                        </th>
                        <th className="text-right py-3 px-6 text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 bg-white">
                      {group.connections.map((connection) => (
                        <tr
                          key={connection._id}
                          className="hover:bg-blue-50/30 transition-colors"
                        >
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 ${group.iconBg} rounded-lg flex items-center justify-center`}>
                                <group.icon className={`h-4 w-4 ${group.iconColor}`} />
                              </div>
                              <span className="font-medium text-neutral-900">{connection.name}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <Badge variant="secondary" className="text-xs font-medium">
                              {connection.db_type.toUpperCase()}
                            </Badge>
                          </td>
                          {group.type === 'file' && (
                            <td className="py-4 px-6">
                              <Badge variant="outline" className="text-xs font-medium">
                                {connection.file_type?.toUpperCase() || 'N/A'}
                              </Badge>
                            </td>
                          )}
                          {group.type === 'database' && (
                            <>
                              <td className="py-4 px-6">
                                <span className="text-sm font-mono text-neutral-700">
                                  {connection.host || '-'}:{connection.port || '-'}
                                </span>
                              </td>
                              <td className="py-4 px-6">
                                <span className="text-sm font-mono text-neutral-700">{connection.database || '-'}</span>
                              </td>
                              <td className="py-4 px-6">
                                <span className="text-sm font-mono text-neutral-700">{connection.username || '-'}</span>
                              </td>
                              <td className="py-4 px-6">
                                {connection.last_test_status && (
                                  <div className="flex items-center gap-2">
                                    {connection.last_test_status === 'success' ? (
                                      <>
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                        <span className="text-sm font-medium text-green-600">Active</span>
                                      </>
                                    ) : (
                                      <>
                                        <XCircle className="h-4 w-4 text-red-600" />
                                        <span className="text-sm font-medium text-red-600">Failed</span>
                                      </>
                                    )}
                                  </div>
                                )}
                              </td>
                            </>
                          )}
                          <td className="py-4 px-6">
                            {connection.last_tested_at ? (
                              <span className="text-xs text-neutral-500">
                                {new Date(connection.last_tested_at).toLocaleDateString()}
                              </span>
                            ) : (
                              <span className="text-xs text-neutral-400">Never</span>
                            )}
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewHistory(connection._id)}
                                className="border-neutral-200 hover:bg-neutral-50"
                                title="View run history"
                              >
                                <History className="h-3 w-3" />
                              </Button>
                              <Button
                                asChild
                                size="sm"
                                variant="outline"
                                className="border-neutral-200 hover:bg-neutral-50"
                              >
                                <Link to={`/sources/${connection._id}`}>
                                  <Pencil className="h-3 w-3" />
                                </Link>
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onDelete(connection)}
                                className="border-red-200 text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
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

      <Dialog open={historyModalOpen} onOpenChange={handleHistoryModalClose}>
        <DialogContent className="max-w-[90vw] max-h-[85vh] bg-white p-0 gap-0 border-none flex flex-col">
          <DialogHeader className="px-8 py-6 bg-neutral-50 border-b border-neutral-200">
            <DialogTitle>Source Run History</DialogTitle>
            <p className="text-sm text-neutral-600 mt-1">
              View all execution runs for this source
            </p>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-8 py-6">
            {selectedSourceId && (
              <RunHistoryTable
                filters={{ source_id: selectedSourceId }}
                onRunClick={handleRunClick}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <RunDetailsModal
        run={selectedRun}
        open={detailsModalOpen}
        onOpenChange={handleDetailsModalClose}
      />
    </div>
  );
}
