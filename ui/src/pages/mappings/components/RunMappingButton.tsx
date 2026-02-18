import { useState } from 'react';
import { Play, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { executionAPI } from '@/services/api';
import { Button } from '@/components/ui/button';

interface RunMappingButtonProps {
  mappingId: string;
}

export function RunMappingButton({ mappingId }: RunMappingButtonProps) {
  const [running, setRunning] = useState(false);

  const handleRun = async () => {
    setRunning(true);
    try {
      const result = await executionAPI.run(mappingId);
      if (result.status === 'success') {
        toast.success(`Execution completed. ${result.rows_written} rows written.`);
      } else {
        toast.error(`Execution failed: ${result.error_message || 'Unknown error'}`);
      }
    } catch (err: any) {
      toast.error(`Failed to run mapping: ${err.message || 'Unknown error'}`);
    } finally {
      setRunning(false);
    }
  };

  return (
    <Button onClick={handleRun} disabled={running}>
      {running ? (
        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
      ) : (
        <Play className="h-4 w-4 mr-1" />
      )}
      Run Mapping
    </Button>
  );
}
