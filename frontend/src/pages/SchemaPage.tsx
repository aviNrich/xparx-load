import React, { useState } from 'react';
import { SchemaList } from '../components/schemas/SchemaList';
import { SchemaForm } from '../components/schemas/SchemaForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { useSchemas } from '../hooks/useSchemas';
import { TableSchema, TableSchemaFormData } from '../types/schema';
import { Plus, Loader2, AlertCircle, Table2, Layers, Clock } from 'lucide-react';
import { Alert, AlertDescription } from '../components/ui/alert';

export function SchemaPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSchema, setEditingSchema] = useState<TableSchema | null>(null);

  const {
    schemas,
    loading,
    error,
    createSchema,
    updateSchema,
    deleteSchema,
  } = useSchemas();

  const handleCreateOrUpdate = async (data: TableSchemaFormData) => {
    try {
      if (editingSchema) {
        await updateSchema(editingSchema._id, data);
      } else {
        await createSchema(data);
      }
      setIsFormOpen(false);
      setEditingSchema(null);
    } catch (err) {
      console.error('Failed to save schema:', err);
      alert(err instanceof Error ? err.message : 'Failed to save schema');
    }
  };

  const handleEdit = (schema: TableSchema) => {
    setEditingSchema(schema);
    setIsFormOpen(true);
  };

  const handleDelete = async (schema: TableSchema) => {
    if (window.confirm(`Are you sure you want to delete the "${schema.name}" schema?`)) {
      try {
        await deleteSchema(schema._id);
      } catch (err) {
        console.error('Failed to delete schema:', err);
        alert(err instanceof Error ? err.message : 'Failed to delete schema');
      }
    }
  };

  const handleNewSchema = () => {
    setEditingSchema(null);
    setIsFormOpen(true);
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
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Table Schemas</h1>
            <p className="text-sm text-neutral-500 mt-1">Define and manage your table structures</p>
          </div>
          <Button
            onClick={handleNewSchema}
            className="bg-primary-500 hover:bg-primary-600 text-white shadow-sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Schema
          </Button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 border border-neutral-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <Table2 className="h-5 w-5 text-primary-600" />
            </div>
            <div className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
              Total Schemas
            </div>
          </div>
          <div className="text-3xl font-bold text-neutral-900">{schemas.length}</div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-neutral-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Layers className="h-5 w-5 text-blue-600" />
            </div>
            <div className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
              Total Fields
            </div>
          </div>
          <div className="text-3xl font-bold text-neutral-900">{totalFields}</div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-neutral-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Clock className="h-5 w-5 text-green-600" />
            </div>
            <div className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
              Updated (7d)
            </div>
          </div>
          <div className="text-3xl font-bold text-neutral-900">{recentSchemas}</div>
        </div>
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
          schemas={schemas}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              {editingSchema ? 'Edit Schema' : 'Create New Schema'}
            </DialogTitle>
          </DialogHeader>
          <SchemaForm
            initialData={editingSchema ? {
              name: editingSchema.name,
              description: editingSchema.description,
              fields: editingSchema.fields,
            } : undefined}
            onSubmit={handleCreateOrUpdate}
            onCancel={() => {
              setIsFormOpen(false);
              setEditingSchema(null);
            }}
            isEdit={!!editingSchema}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
