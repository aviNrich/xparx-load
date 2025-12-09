import React from 'react';
import { Database, Loader2 } from 'lucide-react';

interface SqlPreviewTableProps {
  columns: string[];
  rows: any[][];
  loading?: boolean;
}

export function SqlPreviewTable({ columns, rows, loading }: SqlPreviewTableProps) {
  if (loading) {
    return (
      <div className="h-full bg-white rounded-xl border border-neutral-200 overflow-hidden flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary-500 mx-auto mb-4" />
          <p className="text-neutral-600">Executing query...</p>
        </div>
      </div>
    );
  }

  if (columns.length === 0 || rows.length === 0) {
    return (
      <div className="h-full bg-white rounded-xl border border-neutral-200 overflow-hidden flex items-center justify-center">
        <div className="text-center">
          <Database className="mx-auto h-16 w-16 text-neutral-400 mb-4" />
          <h3 className="text-lg font-semibold text-neutral-900 mb-2">No results found</h3>
          <p className="text-neutral-600">Your query returned no data.</p>
        </div>
      </div>
    );
  }

  const formatCellValue = (value: any): string => {
    if (value === null || value === undefined) {
      return 'NULL';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    const strValue = String(value);
    // Truncate long values
    if (strValue.length > 100) {
      return strValue.substring(0, 100) + '...';
    }
    return strValue;
  };

  return (
    <div className="h-full bg-white rounded-xl border border-neutral-200 overflow-hidden flex flex-col">
      {/* Header with row count */}
      <div className="px-4 py-3 border-b border-neutral-200 bg-neutral-50 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-neutral-900">
            Query Results
          </h3>
          <span className="text-xs text-neutral-600">
            {rows.length} {rows.length === 1 ? 'row' : 'rows'} × {columns.length} {columns.length === 1 ? 'column' : 'columns'}
          </span>
        </div>
      </div>

      {/* Scrollable table container - both horizontal and vertical */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 border-b border-neutral-200 sticky top-0 z-10">
            <tr>
              {columns.map((column, idx) => (
                <th
                  key={idx}
                  className="text-left py-3 px-4 text-xs font-semibold text-neutral-700 whitespace-nowrap"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {rows.map((row, rowIdx) => (
              <tr key={rowIdx} className="hover:bg-neutral-50 transition-colors">
                {row.map((cell, cellIdx) => (
                  <td key={cellIdx} className="py-3 px-4 text-xs text-neutral-700 font-mono whitespace-nowrap">
                    <span className={cell === null || cell === undefined ? 'text-neutral-400 italic' : ''}>
                      {formatCellValue(cell)}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
