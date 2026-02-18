import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Pencil, Archive, ArchiveRestore } from 'lucide-react';
import { TableSchema } from '@/types/schema';
import { schemaAPI } from '@/services/api';
import { useSchemas } from '@/hooks/useSchemas';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { LoadingState } from '@/components/shared/LoadingState';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { SchemaFieldEditor } from './components/SchemaFieldEditor';
import { SchemaFormDialog } from './components/SchemaFormDialog';

export function SchemaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { updateSchema, archiveSchema, restoreSchema } = useSchemas();

  const [schema, setSchema] = useState<TableSchema | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const fetchSchema = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await schemaAPI.get(id);
      setSchema(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load schema');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchema();
  }, [id]);

  const handleArchive = async () => {
    if (!schema) return;
    try {
      await archiveSchema(schema._id);
      toast.success(`"${schema.name}" archived`);
      navigate('/schemas');
    } catch {
      toast.error('Failed to archive schema');
    }
  };

  const handleRestore = async () => {
    if (!schema) return;
    try {
      await restoreSchema(schema._id);
      toast.success(`"${schema.name}" restored`);
      await fetchSchema();
    } catch {
      toast.error('Failed to restore schema');
    }
  };

  const handleFieldSave = async (schemaId: string, data: Parameters<typeof updateSchema>[1]) => {
    const updated = await updateSchema(schemaId, data);
    setSchema(updated);
    return updated;
  };

  if (loading) {
    return (
      <PageContainer>
        <LoadingState variant="page" />
      </PageContainer>
    );
  }

  if (error || !schema) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-lg font-medium text-neutral-900">
            {error || 'Schema not found'}
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => navigate('/schemas')}
          >
            Back to Schemas
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={schema.name}
        breadcrumbs={[
          { label: 'Schemas', href: '/schemas' },
          { label: schema.name },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4 mr-1" />
              Edit
            </Button>
            {schema.archived ? (
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
              <CardTitle className="text-base">Schema Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-neutral-500 mb-1">Name</p>
                <p className="text-sm text-neutral-900 font-medium">
                  {schema.name}
                </p>
              </div>

              <div>
                <p className="text-xs text-neutral-500 mb-1">Handler</p>
                <p className="text-sm text-neutral-900 font-mono">
                  {schema.schema_handler}
                </p>
              </div>

              {schema.description && (
                <div>
                  <p className="text-xs text-neutral-500 mb-1">Description</p>
                  <p className="text-sm text-neutral-700">
                    {schema.description}
                  </p>
                </div>
              )}

              <div>
                <p className="text-xs text-neutral-500 mb-1">Fields</p>
                <Badge variant="secondary">
                  {schema.fields.length} field{schema.fields.length !== 1 ? 's' : ''}
                </Badge>
              </div>

              <div>
                <p className="text-xs text-neutral-500 mb-1">Created</p>
                <p className="text-sm text-neutral-700">
                  {format(new Date(schema.created_at), 'MMM d, yyyy HH:mm')}
                </p>
              </div>

              <div>
                <p className="text-xs text-neutral-500 mb-1">Updated</p>
                <p className="text-sm text-neutral-700">
                  {format(new Date(schema.updated_at), 'MMM d, yyyy HH:mm')}
                </p>
              </div>

              {schema.archived && (
                <div>
                  <Badge variant="secondary">Archived</Badge>
                  {schema.archived_at && (
                    <p className="text-xs text-neutral-500 mt-1">
                      {format(new Date(schema.archived_at), 'MMM d, yyyy HH:mm')}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right panel - Field Editor */}
        <div className="flex-1">
          <SchemaFieldEditor schema={schema} onSave={handleFieldSave} />
        </div>
      </div>

      {/* Edit Dialog */}
      <SchemaFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        schema={schema}
        onSuccess={fetchSchema}
      />
    </PageContainer>
  );
}
