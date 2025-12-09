import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Database, Loader2 } from 'lucide-react';

interface SqlPreviewTableProps {
  columns: string[];
  rows: any[][];
  loading?: boolean;
}

export function SqlPreviewTable({ columns, rows, loading }: SqlPreviewTableProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary-500 mx-auto mb-4" />
            <p className="text-neutral-600">Executing query...</p>
          </div>
        </div>
      </div>
    );
  }

  if (columns.length === 0 || rows.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <div className="text-center py-16">
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
    <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
      {/* Header with row count */}
      <div className="px-4 py-3 border-b border-neutral-200 bg-neutral-50">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-neutral-900">
            Query Results
          </h3>
          <span className="text-xs text-neutral-600">
            {rows.length} {rows.length === 1 ? 'row' : 'rows'} × {columns.length} {columns.length === 1 ? 'column' : 'columns'}
          </span>
        </div>
      </div>

      {/* Scrollable table container */}
      <div className="overflow-auto" style={{ maxHeight: '400px' }}>
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column, idx) => (
                <TableHead key={idx} className="sticky top-0 bg-neutral-50 z-10">
                  {column}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, rowIdx) => (
              <TableRow key={rowIdx}>
                {row.map((cell, cellIdx) => (
                  <TableCell key={cellIdx} className="font-mono text-xs">
                    <span className={cell === null || cell === undefined ? 'text-neutral-400 italic' : ''}>
                      {formatCellValue(cell)}
                    </span>
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
