import { useState, useEffect, useRef } from 'react';
import { Loader2, Zap, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { connectionAPI } from '@/services/api';

interface TestConnectionButtonProps {
  connectionId: string;
}

export function TestConnectionButton({ connectionId }: TestConnectionButtonProps) {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const handleTest = async () => {
    setTesting(true);
    setResult(null);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    try {
      const res = await connectionAPI.testExisting(connectionId);
      setResult({ success: res.success, message: res.message });
    } catch (err) {
      setResult({
        success: false,
        message: err instanceof Error ? err.message : 'Test failed',
      });
    } finally {
      setTesting(false);
      timerRef.current = setTimeout(() => {
        setResult(null);
      }, 5000);
    }
  };

  return (
    <div className="space-y-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleTest}
        disabled={testing}
      >
        {testing ? (
          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
        ) : (
          <Zap className="h-4 w-4 mr-1" />
        )}
        {testing ? 'Testing...' : 'Test Connection'}
      </Button>
      {result && (
        <Alert variant={result.success ? 'success' : 'destructive'}>
          {result.success ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          <AlertDescription>{result.message}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
