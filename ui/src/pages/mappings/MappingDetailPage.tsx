import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Pencil, Archive, ArchiveRestore, Loader2, Save, Database } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Mapping, ColumnMapping } from '@/types/mapping';
import { TableSchema } from '@/types/schema';
import { MappingRun } from '@/types/mappingRun';
import { mappingAPI } from '@/services/api';
import { useColumnMappings } from '@/hooks/useColumnMappings';
import { useSchemas } from '@/hooks/useSchemas';
import { useSqlPreview } from '@/hooks/useSqlPreview';
import { useMappingRuns } from '@/hooks/useMappingRuns';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { LoadingState } from '@/components/shared/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState';
import { ConnectionTypeBadge } from '@/components/shared/ConnectionTypeBadge';
import { Pagination } from '@/components/shared/Pagination';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { SqlEditor } from './components/SqlEditor';
import { ColumnMappingEditor } from './components/ColumnMappingEditor';
import { ScheduleEditor } from './components/ScheduleEditor';
import { RunMappingButton } from './components/RunMappingButton';

export function MappingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [mapping, setMapping] = useState<Mapping | null>(null);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  // Column mappings
  const { config: columnMappingConfig, loading: cmLoading, saveConfig } = useColumnMappings(id);
  const { schemas } = useSchemas();
  const { preview, runPreview } = useSqlPreview();
  const [savingColumnMappings, setSavingColumnMappings] = useState(false);

  // Local column mapping state for editing
  const [localTargetSchemas, setLocalTargetSchemas] = useState<
    { schema_id: string; column_mappings: ColumnMapping[] }[]
  >([]);

  // Source columns from preview
  const [sourceColumns, setSourceColumns] = useState<string[]>([]);

  // Mapping runs
  const {
    runs,
    totalCount,
    loading: runsLoading,
    page: runsPage,
    setPage: setRunsPage,
  } = useMappingRuns(id ? { mapping_id: id } : undefined);

  // Fetch mapping
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    mappingAPI
      .get(id)
      .then((data) => {
        setMapping(data);
        setEditName(data.name);
        setEditDescription(data.description || '');
      })
      .catch(() => {
        toast.error('Failed to load mapping');
        navigate('/mappings');
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  // Initialize local column mapping state from fetched config
  useEffect(() => {
    if (columnMappingConfig) {
      setLocalTargetSchemas(columnMappingConfig.target_schemas);
    }
  }, [columnMappingConfig]);

  // Auto-preview SQL to get source columns
  useEffect(() => {
    if (mapping && mapping.source_connection_id && mapping.sql_query) {
      runPreview(mapping.source_connection_id, mapping.sql_query);
    }
  }, [mapping?.source_connection_id, mapping?.sql_query]);

  useEffect(() => {
    if (preview) {
      setSourceColumns(preview.columns);
    }
  }, [preview]);

  // Available schemas
  const availableSchemas = useMemo(() => {
    return schemas.filter((s) => !s.archived);
  }, [schemas]);

  // Schema objects for column mapping editor
  const getSchemaObject = (schemaId: string): TableSchema | undefined => {
    return availableSchemas.find((s) => s._id === schemaId);
  };

  const handleArchive = async () => {
    if (!mapping) return;
    try {
      const updated = await mappingAPI.archive(mapping._id);
      setMapping(updated);
      toast.success(`"${mapping.name}" archived`);
    } catch {
      toast.error('Failed to archive mapping');
    }
  };

  const handleRestore = async () => {
    if (!mapping) return;
    try {
      const updated = await mappingAPI.restore(mapping._id);
      setMapping(updated);
      toast.success(`"${mapping.name}" restored`);
    } catch {
      toast.error('Failed to restore mapping');
    }
  };

  const handleEditSave = async () => {
    if (!mapping) return;
    setEditSaving(true);
    try {
      const updated = await mappingAPI.update(mapping._id, {
        name: editName,
        description: editDescription || undefined,
      });
      setMapping(updated);
      setEditDialogOpen(false);
      toast.success('Mapping updated');
    } catch {
      toast.error('Failed to update mapping');
    } finally {
      setEditSaving(false);
    }
  };

  const handleSaveColumnMappings = async () => {
    if (!id) return;
    setSavingColumnMappings(true);
    try {
      await saveConfig({
        mapping_id: id,
        target_schemas: localTargetSchemas,
      });
      toast.success('Column mappings saved');
    } catch (err: any) {
      toast.error(`Failed to save column mappings: ${err.message || 'Unknown error'}`);
    } finally {
      setSavingColumnMappings(false);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <LoadingState variant="inline" text="Loading mapping..." />
      </PageContainer>
    );
  }

  if (!mapping) {
    return (
      <PageContainer>
        <EmptyState
          icon={Database}
          title="Mapping not found"
          description="The mapping you are looking for does not exist."
          action={
            <Button variant="outline" onClick={() => navigate('/mappings')}>
              Back to Mappings
            </Button>
          }
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={mapping.name}
        description={mapping.description}
        breadcrumbs={[
          { label: 'Mappings', href: '/mappings' },
          { label: mapping.name },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <RunMappingButton mappingId={mapping._id} />
            <Button
              variant="outline"
              onClick={() => {
                setEditName(mapping.name);
                setEditDescription(mapping.description || '');
                setEditDialogOpen(true);
              }}
            >
              <Pencil className="h-4 w-4 mr-1" />
              Edit
            </Button>
            {mapping.archived ? (
              <Button variant="outline" onClick={handleRestore}>
                <ArchiveRestore className="h-4 w-4 mr-1" />
                Restore
              </Button>
            ) : (
              <Button variant="outline" onClick={handleArchive}>
                <Archive className="h-4 w-4 mr-1" />
                Archive
              </Button>
            )}
          </div>
        }
      />

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="column-mapping">Column Mapping</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="run-history">Run History</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="space-y-6 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Mapping Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-neutral-500">Name</Label>
                    <p className="text-sm font-medium text-neutral-900">{mapping.name}</p>
                  </div>
                  {mapping.description && (
                    <div>
                      <Label className="text-xs text-neutral-500">Description</Label>
                      <p className="text-sm text-neutral-700">{mapping.description}</p>
                    </div>
                  )}
                  <div>
                    <Label className="text-xs text-neutral-500">Source Connection</Label>
                    <div className="flex items-center gap-2 mt-1">
                      {mapping.source_type && (
                        <ConnectionTypeBadge
                          type={mapping.source_type as 'mysql' | 'postgresql' | 'file'}
                        />
                      )}
                      <span className="text-sm text-neutral-700">
                        {mapping.source_name || mapping.source_connection_id}
                      </span>
                    </div>
                  </div>
                  {mapping.entity_root_id_column && (
                    <div>
                      <Label className="text-xs text-neutral-500">Entity Root ID Column</Label>
                      <p className="text-sm font-mono text-neutral-700">
                        {mapping.entity_root_id_column}
                      </p>
                    </div>
                  )}
                  {mapping.entity_id_column && (
                    <div>
                      <Label className="text-xs text-neutral-500">Entity ID Column</Label>
                      <p className="text-sm font-mono text-neutral-700">
                        {mapping.entity_id_column}
                      </p>
                    </div>
                  )}
                  <div>
                    <Label className="text-xs text-neutral-500">Created</Label>
                    <p className="text-sm text-neutral-700">
                      {format(new Date(mapping.created_at), 'MMM d, yyyy HH:mm')}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-neutral-500">Updated</Label>
                    <p className="text-sm text-neutral-700">
                      {format(new Date(mapping.updated_at), 'MMM d, yyyy HH:mm')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* SQL display */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">SQL Query</CardTitle>
              </CardHeader>
              <CardContent>
                <SqlEditor value={mapping.sql_query} onChange={() => {}} readOnly height="200px" />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Column Mapping Tab */}
        <TabsContent value="column-mapping">
          <div className="space-y-6 mt-4">
            {cmLoading ? (
              <LoadingState variant="inline" text="Loading column mappings..." />
            ) : (
              <>
                {localTargetSchemas.length === 0 ? (
                  <EmptyState
                    icon={Database}
                    title="No column mappings"
                    description="No column mapping configuration exists for this mapping yet."
                  />
                ) : (
                  localTargetSchemas.map((ts) => {
                    const schema = getSchemaObject(ts.schema_id);
                    if (!schema) {
                      return (
                        <Card key={ts.schema_id}>
                          <CardContent className="pt-6">
                            <p className="text-sm text-neutral-500">
                              Schema not found (ID: {ts.schema_id})
                            </p>
                          </CardContent>
                        </Card>
                      );
                    }
                    return (
                      <Card key={ts.schema_id}>
                        <CardContent className="pt-6">
                          <ColumnMappingEditor
                            sourceColumns={sourceColumns}
                            schema={schema}
                            mappings={ts.column_mappings}
                            onChange={(mappings) => {
                              setLocalTargetSchemas((prev) =>
                                prev.map((item) =>
                                  item.schema_id === ts.schema_id
                                    ? { ...item, column_mappings: mappings }
                                    : item
                                )
                              );
                            }}
                          />
                        </CardContent>
                      </Card>
                    );
                  })
                )}

                {localTargetSchemas.length > 0 && (
                  <div className="flex justify-end">
                    <Button onClick={handleSaveColumnMappings} disabled={savingColumnMappings}>
                      {savingColumnMappings ? (
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-1" />
                      )}
                      Save Column Mappings
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </TabsContent>

        {/* Schedule Tab */}
        <TabsContent value="schedule">
          <div className="mt-4">
            <ScheduleEditor mappingId={mapping._id} />
          </div>
        </TabsContent>

        {/* Run History Tab */}
        <TabsContent value="run-history">
          <div className="space-y-4 mt-4">
            {runsLoading ? (
              <LoadingState variant="inline" text="Loading run history..." />
            ) : runs.length === 0 ? (
              <EmptyState
                icon={Database}
                title="No runs yet"
                description="This mapping has not been executed yet. Click 'Run Mapping' to start."
              />
            ) : (
              <>
                <div className="border border-neutral-200 rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Run ID</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Trigger</TableHead>
                        <TableHead>Rows (Delta)</TableHead>
                        <TableHead>Rows (Target)</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Started</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {runs.map((run: MappingRun) => (
                        <TableRow key={run._id}>
                          <TableCell className="font-mono text-xs">
                            {run.run_id.slice(0, 8)}...
                          </TableCell>
                          <TableCell>
                            <RunStatusBadge status={run.status} />
                          </TableCell>
                          <TableCell className="text-sm text-neutral-600 capitalize">
                            {run.trigger_type}
                          </TableCell>
                          <TableCell className="text-sm text-neutral-700">
                            {run.rows_written_to_delta.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-sm text-neutral-700">
                            {run.rows_written_to_target.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-sm text-neutral-500">
                            {run.duration_seconds != null
                              ? `${run.duration_seconds.toFixed(1)}s`
                              : '-'}
                          </TableCell>
                          <TableCell className="text-sm text-neutral-500">
                            {format(new Date(run.start_time), 'MMM d, HH:mm:ss')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <Pagination
                  page={runsPage}
                  pageSize={20}
                  totalCount={totalCount}
                  onPageChange={setRunsPage}
                />
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Mapping</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-neutral-700">Name</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-neutral-700">Description</Label>
              <Input
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Optional description"
              />
            </div>
          </div>
          <DialogFooter>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditSave} disabled={editSaving || !editName.trim()}>
                {editSaving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                Save
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}

// Helper component for run status display
function RunStatusBadge({ status }: { status: string }) {
  const statusMap: Record<string, { status: 'success' | 'error' | 'running' | 'warning'; label: string }> = {
    success: { status: 'success', label: 'Success' },
    failed: { status: 'error', label: 'Failed' },
    running: { status: 'running', label: 'Running' },
    partial_success: { status: 'warning', label: 'Partial' },
  };
  const config = statusMap[status] || { status: 'pending' as const, label: status };
  return <StatusBadge status={config.status} label={config.label} />;
}
