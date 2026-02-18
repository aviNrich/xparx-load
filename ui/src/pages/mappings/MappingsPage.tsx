import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, GitBranch, Eye, EyeOff } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Mapping } from '@/types/mapping';
import { useMappings } from '@/hooks/useMappings';
import { useConnections } from '@/hooks/useConnections';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { SearchInput } from '@/components/shared/SearchInput';
import { ViewToggle } from '@/components/shared/ViewToggle';
import { LoadingState } from '@/components/shared/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState';
import { ConnectionTypeBadge } from '@/components/shared/ConnectionTypeBadge';
import { DataTable } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MappingCard } from './components/MappingCard';

export function MappingsPage() {
  const navigate = useNavigate();
  const { mappings, loading, archiveMapping, restoreMapping } = useMappings();
  const { connections } = useConnections();

  const [search, setSearch] = useState('');
  const [connectionFilter, setConnectionFilter] = useState<string>('all');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [showArchived, setShowArchived] = useState(false);

  // Build connection options for filter
  const connectionOptions = useMemo(() => {
    const activeConnections = connections.filter((c) => !c.archived);
    return activeConnections.map((c) => ({ value: c._id, label: c.name }));
  }, [connections]);

  // Filtered mappings
  const filteredMappings = useMemo(() => {
    return mappings.filter((m) => {
      // Search filter
      if (search && !m.name.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      // Connection filter
      if (connectionFilter !== 'all' && m.source_connection_id !== connectionFilter) {
        return false;
      }
      // Archive filter
      if (!showArchived && m.archived) {
        return false;
      }
      return true;
    });
  }, [mappings, search, connectionFilter, showArchived]);

  const handleArchive = async (mapping: Mapping) => {
    try {
      await archiveMapping(mapping._id);
      toast.success(`"${mapping.name}" archived`);
    } catch {
      toast.error('Failed to archive mapping');
    }
  };

  const handleRestore = async (mapping: Mapping) => {
    try {
      await restoreMapping(mapping._id);
      toast.success(`"${mapping.name}" restored`);
    } catch {
      toast.error('Failed to restore mapping');
    }
  };

  const handleRowClick = (item: Record<string, unknown>) => {
    const mapping = item as unknown as Mapping;
    navigate(`/mappings/${mapping._id}`);
  };

  const listColumns = [
    {
      key: 'name',
      header: 'Name',
      render: (m: Record<string, unknown>) => {
        const mapping = m as unknown as Mapping;
        return <span className="font-medium text-neutral-900">{mapping.name}</span>;
      },
    },
    {
      key: 'source_type',
      header: 'Source',
      render: (m: Record<string, unknown>) => {
        const mapping = m as unknown as Mapping;
        return (
          <div className="flex items-center gap-2">
            {mapping.source_type && (
              <ConnectionTypeBadge type={mapping.source_type as 'mysql' | 'postgresql' | 'file'} />
            )}
            <span className="text-sm text-neutral-600 truncate">{mapping.source_name}</span>
          </div>
        );
      },
    },
    {
      key: 'sql_query',
      header: 'SQL Query',
      render: (m: Record<string, unknown>) => {
        const mapping = m as unknown as Mapping;
        return (
          <span className="font-mono text-xs text-neutral-500 truncate block max-w-xs">
            {mapping.sql_query}
          </span>
        );
      },
    },
    {
      key: 'created_at',
      header: 'Created',
      render: (m: Record<string, unknown>) => {
        const mapping = m as unknown as Mapping;
        return (
          <span className="text-sm text-neutral-500">
            {format(new Date(mapping.created_at), 'MMM d, yyyy')}
          </span>
        );
      },
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Mappings"
        description="Configure ETL data mappings"
        actions={
          <Link to="/mappings/new">
            <Button>
              <Plus className="h-4 w-4 mr-1" />
              Create Mapping
            </Button>
          </Link>
        }
      />

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search mappings..."
          />
          <Select value={connectionFilter} onValueChange={setConnectionFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All sources" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              {connectionOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
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
      ) : filteredMappings.length === 0 ? (
        <EmptyState
          icon={GitBranch}
          title="No mappings found"
          description={
            search || connectionFilter !== 'all'
              ? 'Try adjusting your search or filter criteria.'
              : 'Get started by creating your first mapping.'
          }
          action={
            !search && connectionFilter === 'all' ? (
              <Link to="/mappings/new">
                <Button>
                  <Plus className="h-4 w-4 mr-1" />
                  Create Mapping
                </Button>
              </Link>
            ) : undefined
          }
        />
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredMappings.map((mapping) => (
            <MappingCard
              key={mapping._id}
              mapping={mapping}
              onArchive={handleArchive}
              onRestore={handleRestore}
            />
          ))}
        </div>
      ) : (
        <DataTable
          columns={listColumns}
          data={filteredMappings as unknown as Record<string, unknown>[]}
          onRowClick={handleRowClick}
          emptyIcon={GitBranch}
          emptyTitle="No mappings found"
          emptyDescription="Try adjusting your search or filter criteria."
        />
      )}
    </PageContainer>
  );
}
