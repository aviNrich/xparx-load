import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ConnectionList } from '../components/connections/ConnectionList';
import { ConfirmDialog } from '../components/ui/confirm-dialog';
import { Button } from '../components/ui/button';
import { useConnections } from '../hooks/useConnections';
import { Connection } from '../types/connection';
import { Plus, Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '../components/ui/alert';

export function SourcesPage() {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [connectionToDelete, setConnectionToDelete] = useState<Connection | null>(null);
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const {
    connections,
    loading,
    error,
    deleteConnection,
  } = useConnections();

  const handleDelete = (connection: Connection) => {
    setConnectionToDelete(connection);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!connectionToDelete) return;

    try {
      await deleteConnection(connectionToDelete._id);
      setConnectionToDelete(null);
    } catch (err) {
      console.error('Failed to delete connection:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Failed to delete connection');
      setErrorDialogOpen(true);
    }
  };

  return (
    <>
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Source Connections</h1>
            <p className="text-sm text-neutral-500 mt-1">Manage your database connections for ETL pipelines</p>
          </div>
          <Button
            asChild
            className="bg-primary-500 hover:bg-primary-600 text-white shadow-sm"
          >
            <Link to="/sources/new">
              <Plus className="mr-2 h-4 w-4" />
              New Connection
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 border border-neutral-200">
          <div className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Total Connections</div>
          <div className="text-3xl font-bold text-neutral-900 mt-2">{connections.length}</div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-neutral-200">
          <div className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Active</div>
          <div className="text-3xl font-bold text-green-600 mt-2">
            {connections.filter(c => c.last_test_status === 'success').length}
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-neutral-200">
          <div className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Failed</div>
          <div className="text-3xl font-bold text-red-600 mt-2">
            {connections.filter(c => c.last_test_status === 'failed').length}
          </div>
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
            <p className="text-neutral-600">Loading connections...</p>
          </div>
        </div>
      ) : (
        <ConnectionList
          connections={connections}
          onDelete={handleDelete}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete Connection"
        description={`Are you sure you want to delete "${connectionToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={confirmDelete}
        onCancel={() => setConnectionToDelete(null)}
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
