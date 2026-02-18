import { MoreHorizontal, Pencil, Zap, Archive, ArchiveRestore } from 'lucide-react';
import { format } from 'date-fns';
import { Connection } from '@/types/connection';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { ConnectionTypeBadge } from '@/components/shared/ConnectionTypeBadge';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ConnectionCardProps {
  connection: Connection;
  onEdit: (connection: Connection) => void;
  onArchive: (connection: Connection) => void;
  onRestore: (connection: Connection) => void;
  onTest: (connection: Connection) => void;
  onClick?: (connection: Connection) => void;
}

export function ConnectionCard({
  connection,
  onEdit,
  onArchive,
  onRestore,
  onTest,
  onClick,
}: ConnectionCardProps) {
  const isDb = connection.db_type !== 'file';

  return (
    <Card
      className={cn(
        'relative p-4 hover:shadow-md hover:border-primary-200 transition-all cursor-pointer',
        connection.archived && 'opacity-60'
      )}
      onClick={() => onClick?.(connection)}
    >
      <div className="absolute top-3 right-3" onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(connection)}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onTest(connection)}>
              <Zap className="h-4 w-4 mr-2" />
              Test
            </DropdownMenuItem>
            {connection.archived ? (
              <DropdownMenuItem onClick={() => onRestore(connection)}>
                <ArchiveRestore className="h-4 w-4 mr-2" />
                Restore
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => onArchive(connection)}>
                <Archive className="h-4 w-4 mr-2" />
                Archive
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center gap-2 mb-3 pr-8">
        <ConnectionTypeBadge type={connection.db_type} fileType={connection.file_type} />
        {connection.archived && <Badge variant="secondary">Archived</Badge>}
      </div>

      <h3 className="text-base font-medium text-neutral-900 truncate mb-2">
        {connection.name}
      </h3>

      <p className="text-sm text-neutral-500 truncate mb-3">
        {isDb
          ? `${connection.host}:${connection.port}/${connection.database}`
          : `${(connection.file_type ?? 'csv').toUpperCase()} - ${connection.file_paths?.length ?? 0} file(s)`}
      </p>

      <div className="flex items-center justify-between">
        {connection.last_test_status ? (
          <StatusBadge
            status={connection.last_test_status === 'success' ? 'success' : 'error'}
            label={connection.last_test_status === 'success' ? 'Connected' : 'Failed'}
          />
        ) : (
          <StatusBadge status="pending" label="Not tested" />
        )}
        <span className="text-xs text-neutral-500">
          {format(new Date(connection.created_at), 'MMM d, yyyy HH:mm')}
        </span>
      </div>
    </Card>
  );
}
