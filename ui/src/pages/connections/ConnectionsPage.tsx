import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Plug, Eye, EyeOff } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Connection } from '@/types/connection';
import { useConnections } from '@/hooks/useConnections';
import { connectionAPI } from '@/services/api';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { SearchInput } from '@/components/shared/SearchInput';
import { ViewToggle } from '@/components/shared/ViewToggle';
import { LoadingState } from '@/components/shared/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState';
import { ConnectionTypeBadge } from '@/components/shared/ConnectionTypeBadge';
import { DataTable } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ConnectionCard } from './components/ConnectionCard';
import { ConnectionFormDialog } from './components/ConnectionFormDialog';

export function ConnectionsPage() {
  const navigate = useNavigate();
  const {
    connections,
    loading,
    fetchConnections,
    archiveConnection,
    restoreConnection,
  } = useConnections();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [showArchived, setShowArchived] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingConnection, setEditingConnection] = useState<Connection | undefined>();

  const filteredConnections = useMemo(() => {
    return connections.filter((conn) => {
      // Search filter
      if (search && !conn.name.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      // Type filter
      if (typeFilter !== 'all' && conn.db_type !== typeFilter) {
        return false;
      }
      // Archive filter
      if (!showArchived && conn.archived) {
        return false;
      }
      return true;
    });
  }, [connections, search, typeFilter, showArchived]);

  const handleEdit = (connection: Connection) => {
    setEditingConnection(connection);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingConnection(undefined);
    setDialogOpen(true);
  };

  const handleArchive = async (connection: Connection) => {
    try {
      await archiveConnection(connection._id);
      toast.success(`"${connection.name}" archived`);
    } catch {
      toast.error('Failed to archive connection');
    }
  };

  const handleRestore = async (connection: Connection) => {
    try {
      await restoreConnection(connection._id);
      toast.success(`"${connection.name}" restored`);
    } catch {
      toast.error('Failed to restore connection');
    }
  };

  const handleTest = async (connection: Connection) => {
    try {
      const result = await connectionAPI.testExisting(connection._id);
      if (result.success) {
        toast.success(`Connection "${connection.name}" is working`);
      } else {
        toast.error(`Connection test failed: ${result.message}`);
      }
      await fetchConnections();
    } catch {
      toast.error('Failed to test connection');
    }
  };

  const handleClick = (connection: Connection) => {
    navigate(`/connections/${connection._id}`);
  };

  const listColumns = [
    {
      key: 'name',
      header: 'Name',
      render: (item: Record<string, unknown>) => {
        const conn = item as unknown as Connection;
        return <span className="font-medium text-neutral-900">{conn.name}</span>;
      },
    },
    {
      key: 'db_type',
      header: 'Type',
      render: (item: Record<string, unknown>) => {
        const conn = item as unknown as Connection;
        return <ConnectionTypeBadge type={conn.db_type} fileType={conn.file_type} />;
      },
    },
    {
      key: 'host',
      header: 'Host / Info',
      render: (item: Record<string, unknown>) => {
        const conn = item as unknown as Connection;
        return conn.db_type !== 'file' ? (
          <span className="text-sm text-neutral-600">
            {conn.host}:{conn.port}/{conn.database}
          </span>
        ) : (
          <span className="text-sm text-neutral-600">
            {(conn.file_type ?? 'csv').toUpperCase()} - {conn.file_paths?.length ?? 0} file(s)
          </span>
        );
      },
    },
    {
      key: 'last_test_status',
      header: 'Status',
      render: (item: Record<string, unknown>) => {
        const conn = item as unknown as Connection;
        return conn.last_test_status ? (
          <StatusBadge
            status={conn.last_test_status === 'success' ? 'success' : 'error'}
            label={conn.last_test_status === 'success' ? 'Connected' : 'Failed'}
          />
        ) : (
          <StatusBadge status="pending" label="Not tested" />
        );
      },
    },
    {
      key: 'created_at',
      header: 'Created',
      render: (item: Record<string, unknown>) => {
        const conn = item as unknown as Connection;
        return (
          <span className="text-sm text-neutral-500">
            {format(new Date(conn.created_at), 'MMM d, yyyy')}
          </span>
        );
      },
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Connections"
        description="Manage your data sources"
        actions={
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-1" />
            Add Connection
          </Button>
        }
      />

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search connections..."
          />
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="mysql">MySQL</SelectItem>
              <SelectItem value="postgresql">PostgreSQL</SelectItem>
              <SelectItem value="file">File</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowArchived(!showArchived)}
            title={showArchived ? 'Hide archived' : 'Show archived'}
          >
            {showArchived ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
          <ViewToggle view={view} onViewChange={setView} />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <LoadingState variant="page" />
      ) : filteredConnections.length === 0 ? (
        <EmptyState
          icon={Plug}
          title="No connections found"
          description={
            search || typeFilter !== 'all'
              ? 'Try adjusting your search or filter criteria.'
              : 'Get started by creating your first connection.'
          }
          action={
            !search && typeFilter === 'all' ? (
              <Button onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-1" />
                Add Connection
              </Button>
            ) : undefined
          }
        />
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredConnections.map((conn) => (
            <ConnectionCard
              key={conn._id}
              connection={conn}
              onClick={handleClick}
              onEdit={handleEdit}
              onArchive={handleArchive}
              onRestore={handleRestore}
              onTest={handleTest}
            />
          ))}
        </div>
      ) : (
        <DataTable
          columns={listColumns}
          data={filteredConnections as unknown as Record<string, unknown>[]}
          onRowClick={(item) => handleClick(item as unknown as Connection)}
          emptyIcon={Plug}
          emptyTitle="No connections found"
          emptyDescription="Try adjusting your search or filter criteria."
        />
      )}

      {/* Create/Edit Dialog */}
      <ConnectionFormDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingConnection(undefined);
        }}
        connection={editingConnection}
        onSuccess={fetchConnections}
      />
    </PageContainer>
  );
}
