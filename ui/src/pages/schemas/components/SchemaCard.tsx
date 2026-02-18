import { MoreHorizontal, Eye, Archive, ArchiveRestore } from 'lucide-react';
import { TableSchema } from '@/types/schema';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FieldTypeTag } from '@/components/shared/FieldTypeTag';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SchemaCardProps {
  schema: TableSchema;
  onView: (schema: TableSchema) => void;
  onArchive: (schema: TableSchema) => void;
  onRestore: (schema: TableSchema) => void;
}

export function SchemaCard({
  schema,
  onView,
  onArchive,
  onRestore,
}: SchemaCardProps) {
  const uniqueTypes = [...new Set(schema.fields.map((f) => f.field_type))];

  return (
    <Card
      className={cn(
        'relative p-4 hover:shadow-md hover:border-primary-200 transition-all cursor-pointer',
        schema.archived && 'opacity-60'
      )}
      onClick={() => onView(schema)}
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
            <DropdownMenuItem onClick={() => onView(schema)}>
              <Eye className="h-4 w-4 mr-2" />
              View
            </DropdownMenuItem>
            {schema.archived ? (
              <DropdownMenuItem onClick={() => onRestore(schema)}>
                <ArchiveRestore className="h-4 w-4 mr-2" />
                Restore
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => onArchive(schema)}>
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
          {schema.name}
        </h3>
        <Badge variant="secondary" className="shrink-0">
          {schema.fields.length} field{schema.fields.length !== 1 ? 's' : ''}
        </Badge>
        {schema.archived && <Badge variant="secondary">Archived</Badge>}
      </div>

      {/* Handler */}
      <p className="text-xs text-neutral-500 font-mono mb-2">
        {schema.schema_handler}
      </p>

      {/* Description */}
      {schema.description && (
        <p className="text-sm text-neutral-600 line-clamp-2 mb-3">
          {schema.description}
        </p>
      )}

      {/* Field types */}
      {uniqueTypes.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-auto pt-2">
          {uniqueTypes.map((type) => (
            <FieldTypeTag key={type} type={type} />
          ))}
        </div>
      )}
    </Card>
  );
}
