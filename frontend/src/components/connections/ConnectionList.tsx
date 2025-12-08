import React from 'react';
import { Connection } from '../../types/connection';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Pencil, Trash2, Database, CheckCircle, XCircle } from 'lucide-react';

interface ConnectionListProps {
  connections: Connection[];
  onEdit: (connection: Connection) => void;
  onDelete: (connection: Connection) => void;
}

export function ConnectionList({ connections, onEdit, onDelete }: ConnectionListProps) {
  if (connections.length === 0) {
    return (
      <div className="text-center py-24 bg-white rounded-xl border border-neutral-200">
        <Database className="mx-auto h-16 w-16 text-neutral-400 mb-4" />
        <h3 className="text-xl font-semibold text-neutral-900 mb-2">No connections yet</h3>
        <p className="text-neutral-600">Create your first connection to get started.</p>
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
                Name
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                Type
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                Host
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                Database
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                Username
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                Status
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                Last Tested
              </th>
              <th className="text-right py-3 px-4 text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {connections.map((connection) => (
              <tr
                key={connection._id}
                className="hover:bg-neutral-50 transition-colors"
              >
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                      <Database className="h-4 w-4 text-primary-600" />
                    </div>
                    <span className="font-medium text-neutral-900">{connection.name}</span>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <Badge variant="secondary" className="text-xs font-medium">
                    {connection.db_type.toUpperCase()}
                  </Badge>
                </td>
                <td className="py-4 px-4">
                  <span className="text-sm font-mono text-neutral-700">
                    {connection.host}:{connection.port}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <span className="text-sm font-mono text-neutral-700">{connection.database}</span>
                </td>
                <td className="py-4 px-4">
                  <span className="text-sm font-mono text-neutral-700">{connection.username}</span>
                </td>
                <td className="py-4 px-4">
                  {connection.last_test_status && (
                    <div className="flex items-center gap-2">
                      {connection.last_test_status === 'success' ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-green-600">Active</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 text-red-600" />
                          <span className="text-sm font-medium text-red-600">Failed</span>
                        </>
                      )}
                    </div>
                  )}
                </td>
                <td className="py-4 px-4">
                  {connection.last_tested_at ? (
                    <span className="text-xs text-neutral-500">
                      {new Date(connection.last_tested_at).toLocaleDateString()}
                    </span>
                  ) : (
                    <span className="text-xs text-neutral-400">Never</span>
                  )}
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onEdit(connection)}
                      className="border-neutral-200 hover:bg-neutral-50"
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onDelete(connection)}
                      className="border-red-200 text-red-600 hover:bg-red-50"
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
