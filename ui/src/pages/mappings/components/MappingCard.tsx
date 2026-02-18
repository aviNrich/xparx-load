import { useNavigate } from 'react-router-dom';
import { MoreHorizontal, Eye, Play, Archive, ArchiveRestore, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Mapping } from '@/types/mapping';
import { executionAPI } from '@/services/api';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ConnectionTypeBadge } from '@/components/shared/ConnectionTypeBadge';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MappingCardProps {
  mapping: Mapping;
  onArchive: (mapping: Mapping) => void;
  onRestore: (mapping: Mapping) => void;
}

export function MappingCard({ mapping, onArchive, onRestore }: MappingCardProps) {
  const navigate = useNavigate();
  const [running, setRunning] = useState(false);

  const handleRun = async () => {
    setRunning(true);
    try {
      const result = await executionAPI.run(mapping._id);
      if (result.status === 'success') {
        toast.success(`Mapping "${mapping.name}" executed successfully. ${result.rows_written} rows written.`);
      } else {
        toast.error(`Mapping execution failed: ${result.error_message || 'Unknown error'}`);
      }
    } catch (err: any) {
      toast.error(`Failed to run mapping: ${err.message || 'Unknown error'}`);
    } finally {
      setRunning(false);
    }
  };

  return (
    <Card
      className={cn(
        'relative p-4 hover:shadow-md hover:border-primary-200 transition-all cursor-pointer',
        mapping.archived && 'opacity-60'
      )}
      onClick={() => navigate(`/mappings/${mapping._id}`)}
    >
      {/* Dropdown menu */}
      <div className="absolute top-3 right-3" onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(`/mappings/${mapping._id}`)}>
              <Eye className="h-4 w-4 mr-2" />
              View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleRun} disabled={running}>
              {running ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Run
            </DropdownMenuItem>
            {mapping.archived ? (
              <DropdownMenuItem onClick={() => onRestore(mapping)}>
                <ArchiveRestore className="h-4 w-4 mr-2" />
                Restore
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => onArchive(mapping)}>
                <Archive className="h-4 w-4 mr-2" />
                Archive
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Header */}
      <div className="flex items-center gap-2 mb-2 pr-8">
        <h3 className="text-base font-medium text-neutral-900 truncate">
          {mapping.name}
        </h3>
        {mapping.archived && <Badge variant="secondary">Archived</Badge>}
      </div>

      {/* Source info */}
      <div className="flex items-center gap-2 mb-2">
        {mapping.source_type && (
          <ConnectionTypeBadge type={mapping.source_type as 'mysql' | 'postgresql' | 'file'} />
        )}
        {mapping.source_name && (
          <span className="text-xs text-neutral-500 truncate">{mapping.source_name}</span>
        )}
      </div>

      {/* SQL preview */}
      {mapping.sql_query && (
        <div className="font-mono text-xs text-neutral-500 line-clamp-2 bg-neutral-50 rounded p-2 mt-2">
          {mapping.sql_query}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-end mt-3">
        <span className="text-xs text-neutral-500">
          {format(new Date(mapping.created_at), 'MMM d, yyyy')}
        </span>
      </div>
    </Card>
  );
}
