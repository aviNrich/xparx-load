import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Pencil, Archive, ArchiveRestore } from 'lucide-react';
import { Connection } from '@/types/connection';
import { connectionAPI } from '@/services/api';
import { useConnections } from '@/hooks/useConnections';
import { useTables } from '@/hooks/useTables';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { LoadingState } from '@/components/shared/LoadingState';
import { ConnectionTypeBadge } from '@/components/shared/ConnectionTypeBadge';
import { DataTable } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ConnectionFormDialog } from './components/ConnectionFormDialog';
import { TestConnectionButton } from './components/TestConnectionButton';

export function ConnectionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { archiveConnection, restoreConnection } = useConnections();

  const [connection, setConnection] = useState<Connection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const { tables, loading: tablesLoading } = useTables(id ?? null);

  const fetchConnection = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await connectionAPI.get(id);
      setConnection(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load connection');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnection();
  }, [id]);

  const handleArchive = async () => {
    if (!connection) return;
    try {
      await archiveConnection(connection._id);
      toast.success(`"${connection.name}" archived`);
      navigate('/connections');
    } catch {
      toast.error('Failed to archive connection');
    }
  };

  const handleRestore = async () => {
    if (!connection) return;
    try {
      await restoreConnection(connection._id);
      toast.success(`"${connection.name}" restored`);
      await fetchConnection();
    } catch {
      toast.error('Failed to restore connection');
    }
  };

  const tableColumns = [
    {
      key: 'table_name',
      header: 'Table Name',
      render: (item: Record<string, unknown>) => (
        <span className="font-medium text-neutral-900 font-mono text-sm">
          {item.table_name as string}
        </span>
      ),
    },
    {
      key: 'table_schema',
      header: 'Schema',
      render: (item: Record<string, unknown>) => (
        <span className="text-sm text-neutral-600">
          {(item.table_schema as string) || '-'}
        </span>
      ),
    },
    {
      key: 'table_type',
      header: 'Type',
      render: (item: Record<string, unknown>) => (
        <Badge variant="secondary">{(item.table_type as string) || 'TABLE'}</Badge>
      ),
    },
    {
      key: 'row_count',
      header: 'Est. Rows',
      render: (item: Record<string, unknown>) => (
        <span className="text-sm text-neutral-500">
          {item.row_count != null
            ? Number(item.row_count).toLocaleString()
            : '-'}
        </span>
      ),
    },
  ];

  if (loading) {
    return (
      <PageContainer>
        <LoadingState variant="page" />
      </PageContainer>
    );
  }

  if (error || !connection) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-lg font-medium text-neutral-900">
            {error || 'Connection not found'}
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => navigate('/connections')}
          >
            Back to Connections
          </Button>
        </div>
      </PageContainer>
    );
  }

  const isDb = connection.db_type !== 'file';

  return (
    <PageContainer>
      <PageHeader
        title={connection.name}
        breadcrumbs={[
          { label: 'Connections', href: '/connections' },
          { label: connection.name },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <TestConnectionButton connectionId={connection._id} />
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4 mr-1" />
              Edit
            </Button>
            {connection.archived ? (
              <Button variant="outline" size="sm" onClick={handleRestore}>
                <ArchiveRestore className="h-4 w-4 mr-1" />
                Restore
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={handleArchive}>
                <Archive className="h-4 w-4 mr-1" />
                Archive
              </Button>
            )}
          </div>
        }
      />

      <div className="flex gap-6">
        {/* Left panel - Info */}
        <div className="w-1/3 min-w-[280px]">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Connection Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-neutral-500 mb-1">Type</p>
                <ConnectionTypeBadge
                  type={connection.db_type}
                  fileType={connection.file_type}
                />
              </div>

              {isDb ? (
                <>
                  <div>
                    <p className="text-xs text-neutral-500 mb-1">Host</p>
                    <p className="text-sm text-neutral-900 font-mono">
                      {connection.host}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500 mb-1">Port</p>
                    <p className="text-sm text-neutral-900 font-mono">
                      {connection.port}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500 mb-1">Database</p>
                    <p className="text-sm text-neutral-900 font-mono">
                      {connection.database}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500 mb-1">Username</p>
                    <p className="text-sm text-neutral-900 font-mono">
                      {connection.username}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <p className="text-xs text-neutral-500 mb-1">File Type</p>
                    <p className="text-sm text-neutral-900">
                      {(connection.file_type ?? 'csv').toUpperCase()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500 mb-1">Files</p>
                    <p className="text-sm text-neutral-900">
                      {connection.file_paths?.length ?? 0} file(s)
                    </p>
                  </div>
                </>
              )}

              <div>
                <p className="text-xs text-neutral-500 mb-1">Test Status</p>
                {connection.last_test_status ? (
                  <StatusBadge
                    status={
                      connection.last_test_status === 'success'
                        ? 'success'
                        : 'error'
                    }
                    label={
                      connection.last_test_status === 'success'
                        ? 'Connected'
                        : 'Failed'
                    }
                  />
                ) : (
                  <StatusBadge status="pending" label="Not tested" />
                )}
              </div>

              {connection.last_tested_at && (
                <div>
                  <p className="text-xs text-neutral-500 mb-1">Last Tested</p>
                  <p className="text-sm text-neutral-700">
                    {format(new Date(connection.last_tested_at), 'MMM d, yyyy HH:mm')}
                  </p>
                </div>
              )}

              <div>
                <p className="text-xs text-neutral-500 mb-1">Created</p>
                <p className="text-sm text-neutral-700">
                  {format(new Date(connection.created_at), 'MMM d, yyyy HH:mm')}
                </p>
              </div>

              <div>
                <p className="text-xs text-neutral-500 mb-1">Updated</p>
                <p className="text-sm text-neutral-700">
                  {format(new Date(connection.updated_at), 'MMM d, yyyy HH:mm')}
                </p>
              </div>

              {connection.archived && (
                <div>
                  <Badge variant="secondary">Archived</Badge>
                  {connection.archived_at && (
                    <p className="text-xs text-neutral-500 mt-1">
                      {format(new Date(connection.archived_at), 'MMM d, yyyy HH:mm')}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right panel - Tabs */}
        <div className="flex-1">
          <Tabs defaultValue="tables">
            <TabsList>
              <TabsTrigger value="tables">Tables</TabsTrigger>
              <TabsTrigger value="mappings">Mappings</TabsTrigger>
            </TabsList>

            <TabsContent value="tables" className="mt-4">
              {isDb ? (
                <DataTable
                  columns={tableColumns}
                  data={tables as unknown as Record<string, unknown>[]}
                  loading={tablesLoading}
                  emptyTitle="No tables found"
                  emptyDescription="This connection has no accessible tables, or the connection has not been tested yet."
                />
              ) : (
                <div className="text-sm text-neutral-500 py-8 text-center">
                  File connections do not have database tables.
                </div>
              )}
            </TabsContent>

            <TabsContent value="mappings" className="mt-4">
              <div className="text-sm text-neutral-500 py-8 text-center">
                Mappings for this connection will be shown here.
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Edit Dialog */}
      <ConnectionFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        connection={connection}
        onSuccess={fetchConnection}
      />
    </PageContainer>
  );
}
