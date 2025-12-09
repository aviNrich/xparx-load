import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ConnectionList } from '../components/connections/ConnectionList';
import { ConnectionForm } from '../components/connections/ConnectionForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { ConfirmDialog } from '../components/ui/confirm-dialog';
import { Button } from '../components/ui/button';
import { useConnections } from '../hooks/useConnections';
import { Connection, ConnectionFormData } from '../types/connection';
import { Plus, Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '../components/ui/alert';
  
export function SourcesPage() {
  const location = useLocation();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingConnection, setEditingConnection] = useState<Connection | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [connectionToDelete, setConnectionToDelete] = useState<Connection | null>(null);
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Check if we should open the dialog from navigation state
  useEffect(() => {
    if (location.state?.openDialog) {
      setIsFormOpen(true);
      // Clear the state after opening
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const {
    connections,
    loading,
    error,
    createConnection,
    updateConnection,
    deleteConnection,
  } = useConnections();

  const handleCreateOrUpdate = async (data: ConnectionFormData) => {
    try {
      if (editingConnection) {
        await updateConnection(editingConnection._id, data);
      } else {
        await createConnection(data);
      }
      setIsFormOpen(false);
      setEditingConnection(null);
    } catch (err) {
      console.error('Failed to save connection:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Failed to save connection');
      setErrorDialogOpen(true);
    }
  };

  const handleEdit = (connection: Connection) => {
    setEditingConnection(connection);
    setIsFormOpen(true);
  };

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

  const handleNewConnection = () => {
    setEditingConnection(null);
    setIsFormOpen(true);
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
            onClick={handleNewConnection}
            className="bg-primary-500 hover:bg-primary-600 text-white shadow-sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Connection
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
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              {editingConnection ? 'Edit Connection' : 'Create New Connection'}
            </DialogTitle>
          </DialogHeader>
          <ConnectionForm
            initialData={editingConnection ? {
              name: editingConnection.name,
              db_type: editingConnection.db_type,
              host: editingConnection.host,
              port: editingConnection.port,
              database: editingConnection.database,
              username: editingConnection.username,
              password: editingConnection.password,
            } : undefined}
            onSubmit={handleCreateOrUpdate}
            onCancel={() => {
              setIsFormOpen(false);
              setEditingConnection(null);
            }}
            isEdit={!!editingConnection}
          />
        </DialogContent>
      </Dialog>

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
