import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ConnectionList } from '../components/connections/ConnectionList';
import { ConnectionFormModal } from '../components/connections/ConnectionFormModal';
import { ConfirmDialog } from '../components/ui/confirm-dialog';
import { Button } from '../components/ui/button';
import { MetricCard } from '../components/ui/metric-card';
import { useConnections } from '../hooks/useConnections';
import { Connection, ConnectionFormData, DatabaseType } from '../types/connection';
import { Plus, Loader2, AlertCircle, Database, CheckCircle, XCircle } from 'lucide-react';
import { Alert, AlertDescription } from '../components/ui/alert';
import { toast } from 'sonner';

export function SourcesPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isEditMode = !!id;
  const isModalOpen = window.location.pathname.includes('/new') || isEditMode;
  const typeFromQuery = searchParams.get('type') as DatabaseType | null;

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [connectionToDelete, setConnectionToDelete] = useState<Connection | null>(null);
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [modalInitialData, setModalInitialData] = useState<ConnectionFormData | undefined>(undefined);

  const {
    connections,
    loading,
    error,
    deleteConnection,
    createConnection,
    updateConnection,
  } = useConnections();

  // Load connection data if in edit mode, or set default type in create mode
  useEffect(() => {
    if (isEditMode && id) {
      const connection = connections.find(c => c._id === id);
      if (connection) {
        setModalInitialData({
          name: connection.name,
          db_type: connection.db_type,
          host: connection.host,
          port: connection.port,
          database: connection.database,
          username: connection.username,
          password: connection.password,
        });
      }
    } else if (!isEditMode && typeFromQuery) {
      // Set default type from query parameter in create mode
      setModalInitialData({
        name: '',
        db_type: typeFromQuery,
      });
    } else if (!isEditMode) {
      setModalInitialData(undefined);
    }
  }, [id, isEditMode, connections, typeFromQuery]);

  const handleDelete = (connection: Connection) => {
    setConnectionToDelete(connection);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!connectionToDelete) return;

    try {
      await deleteConnection(connectionToDelete._id);
      setConnectionToDelete(null);
      toast.success('Connection deleted successfully!');
    } catch (err) {
      console.error('Failed to delete connection:', err);
      const message = err instanceof Error ? err.message : 'Failed to delete connection';
      toast.error(message);
      setErrorMessage(message);
      setErrorDialogOpen(true);
    }
  };

  const handleModalSubmit = async (data: ConnectionFormData) => {
    try {
      if (isEditMode && id) {
        await updateConnection(id, data);
        toast.success('Connection updated successfully!');
        navigate('/sources');
      } else {
        const createdConnection = await createConnection(data);
        toast.success('Connection created successfully!');
        navigate(`/mappings/new?source=${createdConnection._id}`);
      }
    } catch (err) {
      console.error('Failed to save connection:', err);
      const message = err instanceof Error ? err.message : 'Failed to save connection';
      toast.error(message);
      setErrorMessage(message);
      setErrorDialogOpen(true);
    }
  };

  const handleFileUploadSuccess = (connectionId: string) => {
    navigate(`/mappings/new?source=${connectionId}`);
  };

  const handleModalCancel = () => {
    navigate('/sources');
  };

  const handleModalOpenChange = (open: boolean) => {
    if (!open) {
      navigate('/sources');
    }
  };

 
  return (
    <>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">Data Sources</h1>
            <p className="text-neutral-600 mt-2">Connect databases and files to power your data flows</p>
          </div>
          <Button
            onClick={() => navigate('/sources/new')}
            className="bg-primary-500 hover:bg-primary-600 text-white shadow-lg hover:shadow-xl transition-all"
          >
            <Plus className="mr-2 h-5 w-5" />
            Add Source
          </Button>
        </div>
      </motion.div>

      {/* Stats Summary */}
      {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <MetricCard
          title="Total Sources"
          value={connections.length}
          icon={Database}
          iconColor="text-primary-600"
          iconBgColor="bg-primary-100"
          loading={loading}
        />
        <MetricCard
          title="Active Connections"
          value={activeCount}
          icon={CheckCircle}
          iconColor="text-success-600"
          iconBgColor="bg-success-100"
          trend="up"
          trendValue={`${connections.length > 0 ? Math.round((activeCount / connections.length) * 100) : 0}%`}
          loading={loading}
        />
        <MetricCard
          title="Failed Connections"
          value={failedCount}
          icon={XCircle}
          iconColor="text-error-600"
          iconBgColor="bg-error-100"
          trend={failedCount > 0 ? 'down' : undefined}
          loading={loading}
        />
      </div> */}

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

      {/* Connection Form Modal */}
      <ConnectionFormModal
        open={isModalOpen}
        onOpenChange={handleModalOpenChange}
        initialData={modalInitialData}
        onSubmit={handleModalSubmit}
        onCancel={handleModalCancel}
        onFileUploadSuccess={handleFileUploadSuccess}
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
