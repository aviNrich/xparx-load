import { useState } from 'react';
import { History } from 'lucide-react';
import { MappingRun } from '../types/mappingRun';
import { RunHistoryTable } from '../components/history/RunHistoryTable';
import { RunDetailsModal } from '../components/history/RunDetailsModal';

export function RunHistoryPage() {
  const [selectedRun, setSelectedRun] = useState<MappingRun | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  const handleRunClick = (run: MappingRun) => {
    setSelectedRun(run);
    setDetailsModalOpen(true);
  };

  const handleModalClose = () => {
    setDetailsModalOpen(false);
    setTimeout(() => setSelectedRun(null), 200);
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <History className="w-6 h-6 text-primary-600" />
          <h1 className="text-2xl font-bold text-neutral-900">Run History</h1>
        </div>
        <p className="text-neutral-600">
          View the execution history of all mapping runs with detailed metrics and error logs
        </p>
      </div>

      <RunHistoryTable onRunClick={handleRunClick} />

      <RunDetailsModal
        run={selectedRun}
        open={detailsModalOpen}
        onOpenChange={handleModalClose}
      />
    </div>
  );
}
