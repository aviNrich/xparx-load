import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Database, Eye, EyeOff } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { TableSchema } from '@/types/schema';
import { useSchemas } from '@/hooks/useSchemas';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { SearchInput } from '@/components/shared/SearchInput';
import { ViewToggle } from '@/components/shared/ViewToggle';
import { LoadingState } from '@/components/shared/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState';
import { DataTable } from '@/components/shared/DataTable';
import { FieldTypeTag } from '@/components/shared/FieldTypeTag';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SchemaCard } from './components/SchemaCard';
import { SchemaFormDialog } from './components/SchemaFormDialog';

export function SchemasPage() {
  const navigate = useNavigate();
  const {
    schemas,
    loading,
    fetchSchemas,
    archiveSchema,
    restoreSchema,
  } = useSchemas();

  const [search, setSearch] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [showArchived, setShowArchived] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const filteredSchemas = useMemo(() => {
    return schemas.filter((schema) => {
      // Search filter
      if (
        search &&
        !schema.name.toLowerCase().includes(search.toLowerCase()) &&
        !schema.schema_handler.toLowerCase().includes(search.toLowerCase())
      ) {
        return false;
      }
      // Archive filter
      if (!showArchived && schema.archived) {
        return false;
      }
      return true;
    });
  }, [schemas, search, showArchived]);

  const handleView = (schema: TableSchema) => {
    navigate(`/schemas/${schema._id}`);
  };

  const handleArchive = async (schema: TableSchema) => {
    try {
      await archiveSchema(schema._id);
      toast.success(`"${schema.name}" archived`);
    } catch {
      toast.error('Failed to archive schema');
    }
  };

  const handleRestore = async (schema: TableSchema) => {
    try {
      await restoreSchema(schema._id);
      toast.success(`"${schema.name}" restored`);
    } catch {
      toast.error('Failed to restore schema');
    }
  };

  const listColumns = [
    {
      key: 'name',
      header: 'Name',
      render: (item: Record<string, unknown>) => {
        const schema = item as unknown as TableSchema;
        return (
          <span className="font-medium text-neutral-900">{schema.name}</span>
        );
      },
    },
    {
      key: 'schema_handler',
      header: 'Handler',
      render: (item: Record<string, unknown>) => {
        const schema = item as unknown as TableSchema;
        return (
          <span className="text-sm text-neutral-600 font-mono">
            {schema.schema_handler}
          </span>
        );
      },
    },
    {
      key: 'fields',
      header: 'Fields',
      render: (item: Record<string, unknown>) => {
        const schema = item as unknown as TableSchema;
        return (
          <Badge variant="secondary">
            {schema.fields.length} field{schema.fields.length !== 1 ? 's' : ''}
          </Badge>
        );
      },
    },
    {
      key: 'field_types',
      header: 'Types',
      render: (item: Record<string, unknown>) => {
        const schema = item as unknown as TableSchema;
        const uniqueTypes = [...new Set(schema.fields.map((f) => f.field_type))];
        return (
          <div className="flex flex-wrap gap-1">
            {uniqueTypes.map((type) => (
              <FieldTypeTag key={type} type={type} />
            ))}
          </div>
        );
      },
    },
    {
      key: 'created_at',
      header: 'Created',
      render: (item: Record<string, unknown>) => {
        const schema = item as unknown as TableSchema;
        return (
          <span className="text-sm text-neutral-500">
            {format(new Date(schema.created_at), 'MMM d, yyyy')}
          </span>
        );
      },
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Schemas"
        description="Define target table structures"
        actions={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Create Schema
          </Button>
        }
      />

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search schemas..."
          />
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
      ) : filteredSchemas.length === 0 ? (
        <EmptyState
          icon={Database}
          title="No schemas found"
          description={
            search
              ? 'Try adjusting your search criteria.'
              : 'Get started by creating your first schema.'
          }
          action={
            !search ? (
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Create Schema
              </Button>
            ) : undefined
          }
        />
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredSchemas.map((schema) => (
            <SchemaCard
              key={schema._id}
              schema={schema}
              onView={handleView}
              onArchive={handleArchive}
              onRestore={handleRestore}
            />
          ))}
        </div>
      ) : (
        <DataTable
          columns={listColumns}
          data={filteredSchemas as unknown as Record<string, unknown>[]}
          onRowClick={(item) => handleView(item as unknown as TableSchema)}
          emptyIcon={Database}
          emptyTitle="No schemas found"
          emptyDescription="Try adjusting your search criteria."
        />
      )}

      {/* Create Dialog */}
      <SchemaFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={fetchSchemas}
      />
    </PageContainer>
  );
}
