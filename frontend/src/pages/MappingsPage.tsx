import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MappingList } from '../components/mappings/MappingList';
import { Loader2, AlertCircle, Plus } from 'lucide-react';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Button } from '../components/ui/button';
import { ConfirmDialog } from '../components/ui/confirm-dialog';
import { useMappings } from '../hooks/useMappings';
import { Mapping } from '../types/mapping';

export const MappingsPage = () => {
  const navigate = useNavigate();
  const { mappings, loading, error, archiveMapping, restoreMapping } = useMappings();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [mappingToDelete, setMappingToDelete] = useState<Mapping | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const handleDelete = (mapping: Mapping) => {
    setMappingToDelete(mapping);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!mappingToDelete) return;

    try {
      // Check if we're restoring or archiving
      if (mappingToDelete.archived) {
        await restoreMapping(mappingToDelete._id);
      } else {
        await archiveMapping(mappingToDelete._id);
      }
      setMappingToDelete(null);
    } catch (err) {
      console.error('Failed to archive/restore mapping:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Failed to archive/restore mapping');
      setErrorDialogOpen(true);
    }
  };

  return (
    <>
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Data Mappings</h1>
            <p className="text-sm text-neutral-500 mt-1">Configure ETL data mappings</p>
          </div>
          <Button
            onClick={() => navigate('/mappings/new')}
            className="bg-primary-500 hover:bg-primary-600 text-white shadow-lg hover:shadow-xl transition-all"
          >
            <Plus className="mr-2 h-5 w-5" />
            Create Mapping
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
          mappings={mappings.filter(m => m.archived === showArchived)}
          onDelete={handleDelete}
        />
      )}

      {/* Archive/Restore Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title={mappingToDelete?.archived ? "Restore Mapping" : "Archive Mapping"}
        description={
          mappingToDelete?.archived
            ? `Are you sure you want to restore the "${mappingToDelete?.name}" mapping? It will be visible in your mappings list again.`
            : `Are you sure you want to archive the "${mappingToDelete?.name}" mapping? You can restore it later from the archived items.`
        }
        confirmText={mappingToDelete?.archived ? "Restore" : "Archive"}
        cancelText="Cancel"
        variant={mappingToDelete?.archived ? "default" : "destructive"}
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
