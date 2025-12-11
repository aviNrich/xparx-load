import { TableSchema } from '../../types/schema';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Pencil, Trash2, Table2, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SchemaListProps {
  schemas: TableSchema[];
  onEdit: (schema: TableSchema) => void;
  onDelete: (schema: TableSchema) => void;
}

export function SchemaList({ schemas, onEdit, onDelete }: SchemaListProps) {
  const navigate = useNavigate();

  if (schemas.length === 0) {
    return (
      <div className="text-center py-24 bg-white rounded-xl border border-neutral-200">
        <Table2 className="mx-auto h-16 w-16 text-neutral-400 mb-4" />
        <h3 className="text-xl font-semibold text-neutral-900 mb-2">No schemas yet</h3>
        <p className="text-neutral-600">Create your first table schema to get started.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr>
              <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                Table Name
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                Description
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                Fields
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                Created
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                Last Updated
              </th>
              <th className="text-right py-3 px-4 text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {schemas.map((schema) => (
              <tr
                key={schema._id}
                className="hover:bg-neutral-50 transition-colors"
              >
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                      <Table2 className="h-4 w-4 text-primary-600" />
                    </div>
                    <span className="font-medium text-neutral-900">{schema.name}</span>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <span className="text-sm text-neutral-700 line-clamp-2 max-w-xs">
                    {schema.description || <span className="text-neutral-400 italic">No description</span>}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <Badge variant="secondary" className="text-xs font-medium">
                    {schema.fields.length} {schema.fields.length === 1 ? 'field' : 'fields'}
                  </Badge>
                </td>
                <td className="py-4 px-4">
                  <span className="text-xs text-neutral-500">
                    {new Date(schema.created_at).toLocaleDateString()}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <span className="text-xs text-neutral-500">
                    {new Date(schema.updated_at).toLocaleDateString()}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/schema/preview/${schema.name}`)}
                      className="border-primary-200 text-primary-600 hover:bg-primary-50"
                      title="Preview data"
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onEdit(schema)}
                      className="border-neutral-200 hover:bg-neutral-50"
                      title="Edit schema"
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onDelete(schema)}
                      className="border-red-200 text-red-600 hover:bg-red-50"
                      title="Delete schema"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
