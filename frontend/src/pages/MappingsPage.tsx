import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MappingList } from '../components/mappings/MappingList';
import { Button } from '../components/ui/button';
import { Plus, Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '../components/ui/alert';
import { ConfirmDialog } from '../components/ui/confirm-dialog';
import { useMappings } from '../hooks/useMappings';
import { Mapping } from '../types/mapping';

export const MappingsPage = () => {
  const { mappings, loading, error, deleteMapping } = useMappings();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [mappingToDelete, setMappingToDelete] = useState<Mapping | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);

  const handleDelete = (mapping: Mapping) => {
    setMappingToDelete(mapping);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!mappingToDelete) return;

    try {
      await deleteMapping(mappingToDelete._id);
      setMappingToDelete(null);
    } catch (err) {
      console.error('Failed to delete mapping:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Failed to delete mapping');
      setErrorDialogOpen(true);
    }
  };

  return (
    <>
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Data Mappings</h1>
            <p className="text-sm text-neutral-500 mt-1">Configure ETL data mappings</p>
          </div>
          <Button
            asChild
            className="bg-primary-500 hover:bg-primary-600 text-white shadow-sm"
          >
            <Link to="/mappings/new">
              <Plus className="mr-2 h-4 w-4" />
              New Mapping
            </Link>
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center items-center py-24">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary-500 mx-auto mb-4" />
            <p className="text-neutral-600">Loading mappings...</p>
          </div>
        </div>
      ) : (
        /* Mapping List */
        <MappingList
          mappings={mappings}
          onDelete={handleDelete}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete Mapping"
        description={`Are you sure you want to delete the "${mappingToDelete?.name}" mapping? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={confirmDelete}
        onCancel={() => setMappingToDelete(null)}
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
