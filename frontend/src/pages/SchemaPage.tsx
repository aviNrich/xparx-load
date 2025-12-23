import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SchemaList } from '../components/schemas/SchemaList';
import { SchemaFormModal } from '../components/schemas/SchemaFormModal';
import { ConfirmDialog } from '../components/ui/confirm-dialog';
import { Button } from '../components/ui/button';
import { MetricCard } from '../components/ui/metric-card';
import { useSchemas } from '../hooks/useSchemas';
import { TableSchema, TableSchemaFormData } from '../types/schema';
import { Plus, Loader2, AlertCircle, Table2, Layers, Clock } from 'lucide-react';
import { Alert, AlertDescription } from '../components/ui/alert';
import { toast } from 'sonner';

export function SchemaPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;
  const isModalOpen = window.location.pathname.includes('/new') || isEditMode;

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [schemaToDelete, setSchemaToDelete] = useState<TableSchema | null>(null);
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [modalInitialData, setModalInitialData] = useState<TableSchemaFormData | undefined>(undefined);
  const [showArchived, setShowArchived] = useState(false);

  const {
    schemas,
    loading,
    error,
    archiveSchema,
    restoreSchema,
    createSchema,
    updateSchema,
  } = useSchemas();

  // Load schema data if in edit mode
  useEffect(() => {
    if (isEditMode && id) {
      const schema = schemas.find(s => s._id === id);
      if (schema) {
        setModalInitialData({
          name: schema.name,
          schema_handler: schema.schema_handler,
          description: schema.description,
          fields: schema.fields,
        });
      }
    } else if (!isEditMode) {
      setModalInitialData(undefined);
    }
  }, [id, isEditMode, schemas]);

  const handleDelete = (schema: TableSchema) => {
    setSchemaToDelete(schema);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!schemaToDelete) return;

    try {
      // Check if we're restoring or archiving
      if (schemaToDelete.archived) {
        await restoreSchema(schemaToDelete._id);
        toast.success('Schema restored successfully!');
      } else {
        await archiveSchema(schemaToDelete._id);
        toast.success('Schema archived successfully!');
      }
      setSchemaToDelete(null);
    } catch (err) {
      console.error('Failed to archive/restore schema:', err);
      const message = err instanceof Error ? err.message : 'Failed to archive/restore schema';
      toast.error(message);
      setErrorMessage(message);
      setErrorDialogOpen(true);
    }
  };

  const handleModalSubmit = async (data: TableSchemaFormData) => {
    try {
      if (isEditMode && id) {
        await updateSchema(id, data);
        toast.success('Schema updated successfully!');
      } else {
        await createSchema(data);
        toast.success('Schema created successfully!');
      }
      navigate('/schema');
    } catch (err) {
      console.error('Failed to save schema:', err);
      const message = err instanceof Error ? err.message : 'Failed to save schema';
      toast.error(message);
      setErrorMessage(message);
      setErrorDialogOpen(true);
    }
  };

  const handleModalCancel = () => {
    navigate('/schema');
  };

  const handleModalOpenChange = (open: boolean) => {
    if (!open) {
      navigate('/schema');
    }
  };

  // Calculate stats
  const totalFields = schemas.reduce((sum, schema) => sum + schema.fields.length, 0);
  const recentSchemas = schemas.filter(schema => {
    const updatedDate = new Date(schema.updated_at);
    const daysDiff = (Date.now() - updatedDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysDiff <= 7;
  }).length;

  return (
    <>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">Table Schemas</h1>
            <p className="text-neutral-600 mt-2">Define and manage your data ontology structures</p>
          </div>
          <Button
            onClick={() => navigate('/schema/new')}
            className="bg-primary-500 hover:bg-primary-600 text-white shadow-lg hover:shadow-xl transition-all"
          >
            <Plus className="mr-2 h-5 w-5" />
            New Schema
          </Button>
        </div>

        {/* Archive Toggle */}
        <div className="flex gap-2">
          <Button
            variant={!showArchived ? "default" : "outline"}
            onClick={() => setShowArchived(false)}
            size="sm"
          >
            Active
          </Button>
          <Button
            variant={showArchived ? "default" : "outline"}
            onClick={() => setShowArchived(true)}
            size="sm"
          >
            Archived
          </Button>
        </div>
      </motion.div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <MetricCard
          title="Total Schemas"
          value={schemas.length}
          icon={Table2}
          iconColor="text-primary-600"
          iconBgColor="bg-primary-100"
          loading={loading}
        />
        <MetricCard
          title="Total Fields"
          value={totalFields}
          icon={Layers}
          iconColor="text-blue-600"
          iconBgColor="bg-blue-100"
          loading={loading}
        />
        <MetricCard
          title="Updated (7d)"
          value={recentSchemas}
          icon={Clock}
          iconColor="text-green-600"
          iconBgColor="bg-green-100"
          loading={loading}
        />
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-24">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary-500 mx-auto mb-4" />
            <p className="text-neutral-600">Loading schemas...</p>
          </div>
        </div>
      ) : (
        <SchemaList
          schemas={schemas.filter(s => s.archived === showArchived)}
          onDelete={handleDelete}
        />
      )}

      {/* Archive/Restore Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title={schemaToDelete?.archived ? "Restore Schema" : "Archive Schema"}
        description={
          schemaToDelete?.archived
            ? `Are you sure you want to restore the "${schemaToDelete?.name}" schema? It will be visible in your schemas list again.`
            : `Are you sure you want to archive the "${schemaToDelete?.name}" schema? You can restore it later from the archived items.`
        }
        confirmText={schemaToDelete?.archived ? "Restore" : "Archive"}
        cancelText="Cancel"
        variant={schemaToDelete?.archived ? "default" : "destructive"}
        onConfirm={confirmDelete}
        onCancel={() => setSchemaToDelete(null)}
      />

      {/* Schema Form Modal */}
      <SchemaFormModal
        open={isModalOpen}
        onOpenChange={handleModalOpenChange}
        initialData={modalInitialData}
        onSubmit={handleModalSubmit}
        onCancel={handleModalCancel}
        isEdit={isEditMode}
      />

      {/* Error Dialog */}
      {errorMessage && (
        <ConfirmDialog
          open={errorDialogOpen}
          onOpenChange={setErrorDialogOpen}
          title="Error"
          description={errorMessage}
          confirmText="OK"
          variant="destructive"
          onConfirm={() => setErrorDialogOpen(false)}
        />
      )}
    </>
  );
}
