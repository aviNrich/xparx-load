import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Alert } from '../components/ui/alert';
import { Combobox } from '../components/ui/combobox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { deltaTableAPI, schemaAPI } from '../services/api';
import { DeltaQueryResponse, ColumnInfo, TableSchema } from '../types/schema';
import { ArrowLeft, Search, ChevronLeft, ChevronRight, X, Link2, Plus } from 'lucide-react';

const SchemaPreviewPage = () => {
  const { tableName } = useParams<{ tableName: string }>();
  const navigate = useNavigate();

  const [data, setData] = useState<DeltaQueryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [page, setPage] = useState(0);
  const [pageSize] = useState(50);
  const [schemas, setSchemas] = useState<TableSchema[]>([]);
  const [schemasLoading, setSchemasLoading] = useState(false);
  const [selectedFilterColumns, setSelectedFilterColumns] = useState<string[]>([]);

  // Fetch data
  const fetchData = async (currentPage: number = 0, currentFilters: Record<string, string> = {}) => {
    if (!tableName) return;

    setLoading(true);
    setError(null);

    try {
      // Clean filters - remove empty values
      const cleanedFilters = Object.entries(currentFilters).reduce((acc, [key, value]) => {
        if (value.trim() !== '') {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, string>);

      const response = await deltaTableAPI.query({
        table_name: tableName,
        filters: Object.keys(cleanedFilters).length > 0 ? cleanedFilters : undefined,
        limit: pageSize,
        offset: currentPage * pageSize,
      });

      setData(response);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to load data');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  // Fetch available schemas
  const fetchSchemas = async () => {
    setSchemasLoading(true);
    try {
      const schemaList = await schemaAPI.list();
      setSchemas(schemaList);
    } catch (err) {
      console.error('Failed to load schemas:', err);
    } finally {
      setSchemasLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchSchemas();
  }, []);

  // Handle default table selection when no table is specified
  useEffect(() => {
    if (!tableName && schemas.length > 0) {
      // Redirect to first schema if no table specified
      navigate(`/schema/preview/${schemas[0].name}`, { replace: true });
    }
  }, [tableName, schemas, navigate]);

  useEffect(() => {
    if (tableName) {
      fetchData(0, filters);
    }
  }, [tableName]);

  // Handle filter change
  const handleFilterChange = (columnName: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [columnName]: value,
    }));
  };

  // Apply filters
  const handleApplyFilters = () => {
    setPage(0);
    fetchData(0, filters);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setFilters({});
    setSelectedFilterColumns([]);
    setPage(0);
    fetchData(0, {});
  };

  // Clear single filter
  const handleClearFilter = (columnName: string) => {
    const newFilters = { ...filters };
    delete newFilters[columnName];
    setFilters(newFilters);
    setPage(0);
    fetchData(0, newFilters);
  };

  // Add filter column
  const handleAddFilterColumn = (columnName: string) => {
    if (!selectedFilterColumns.includes(columnName)) {
      setSelectedFilterColumns([...selectedFilterColumns, columnName]);
    }
  };

  // Remove filter column
  const handleRemoveFilterColumn = (columnName: string) => {
    setSelectedFilterColumns(selectedFilterColumns.filter(col => col !== columnName));
    // Also clear the filter value
    const newFilters = { ...filters };
    delete newFilters[columnName];
    setFilters(newFilters);
    setPage(0);
    fetchData(0, newFilters);
  };

  // Pagination
  const handlePrevPage = () => {
    const newPage = Math.max(0, page - 1);
    setPage(newPage);
    fetchData(newPage, filters);
  };

  const handleNextPage = () => {
    if (data && data.data.length === pageSize) {
      const newPage = page + 1;
      setPage(newPage);
      fetchData(newPage, filters);
    }
  };

  // Handle clicking on a metadata column value to add as filter
  const handleCellClick = (columnName: string, value: any) => {
    // Only make metadata columns clickable
    const metadataColumns = ['mapping_id', 'execution_time', 'entity_root_id', 'entity_id'];
    if (!metadataColumns.includes(columnName)) return;

    const formattedValue = formatCellValue(value);
    if (formattedValue === '') return;

    // Add column to selected filter columns if not already there
    if (!selectedFilterColumns.includes(columnName)) {
      setSelectedFilterColumns([...selectedFilterColumns, columnName]);
    }

    // Set the filter value
    const newFilters = {
      ...filters,
      [columnName]: formattedValue,
    };
    setFilters(newFilters);
    setPage(0);
    fetchData(0, newFilters);
  };

  // Format cell value for display
  const formatCellValue = (value: any): string => {
    if (value === null || value === undefined) {
      return '';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  };

  // Check if column is a metadata column (clickable)
  const isMetadataColumn = (columnName: string): boolean => {
    const metadataColumns = ['mapping_id', 'execution_time', 'entity_root_id', 'entity_id'];
    return metadataColumns.includes(columnName);
  };

  const totalPages = data ? Math.ceil(data.total_count / pageSize) : 0;
  const hasActiveFilters = Object.values(filters).some((f) => f.trim() !== '');

  // Handle table selection change
  const handleTableChange = (newTableName: string) => {
    navigate(`/schema/preview/${newTableName}`);
  };

  // Prepare combobox options
  const tableOptions = schemas.map((schema) => ({
    label: schema.name,
    value: schema.name,
  }));

  // Prepare filter column options (exclude already selected columns)
  const availableFilterColumns = data?.columns
    .filter(col => !selectedFilterColumns.includes(col.name))
    .map(col => ({
      label: `${col.name} (${col.type.replace('Type()', '').toLowerCase()})`,
      value: col.name,
    })) || [];

  return (
    <div className="container mx-auto py-6 px-4 max-w-[1600px]">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/schema')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Schemas
        </Button>
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-neutral-900">
              Schema Data Preview
            </h1>
            <p className="text-neutral-600 mt-2">
              View and filter data from the delta table
            </p>
          </div>
          <div className="w-80">
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Table Selected
            </label>
            <Combobox
              options={tableOptions}
              value={tableName}
              onValueChange={handleTableChange}
              placeholder="Select a table..."
              searchPlaceholder="Search tables..."
              emptyMessage="No tables found"
              loading={schemasLoading}
            />
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          {error}
        </Alert>
      )}

      {/* Filter Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-neutral-900">Filters</h2>
          <div className="flex gap-2">
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearFilters}
              >
                <X className="mr-2 h-4 w-4" />
                Clear All
              </Button>
            )}
            <Button
              onClick={handleApplyFilters}
              size="sm"
              disabled={loading}
            >
              <Search className="mr-2 h-4 w-4" />
              Apply Filters
            </Button>
          </div>
        </div>

        {/* Add Filter Combobox */}
        {data && data.columns.length > 0 && availableFilterColumns.length > 0 && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Add Filter
            </label>
            <Combobox
              options={availableFilterColumns}
              value=""
              onValueChange={handleAddFilterColumn}
              placeholder="Select a column to filter..."
              searchPlaceholder="Search columns..."
              emptyMessage="No columns available"
            />
          </div>
        )}

        {/* Selected Filter Inputs */}
        {selectedFilterColumns.length > 0 && (
          <div className="space-y-3">
            <div className="text-sm font-medium text-neutral-700">
              Active Filter Fields
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedFilterColumns.map((columnName) => {
                const column = data?.columns.find(col => col.name === columnName);
                if (!column) return null;

                return (
                  <div key={columnName} className="flex flex-col">
                    <label className="text-sm font-medium text-neutral-700 mb-1 flex items-center justify-between">
                      <span className="truncate">{column.name}</span>
                      <button
                        onClick={() => handleRemoveFilterColumn(column.name)}
                        className="text-neutral-400 hover:text-red-600 ml-1"
                        title="Remove filter"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </label>
                    <Input
                      placeholder={`Filter ${column.name}...`}
                      value={filters[column.name] || ''}
                      onChange={(e) => handleFilterChange(column.name, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleApplyFilters();
                        }
                      }}
                      className="text-sm"
                    />
                    <span className="text-xs text-neutral-500 mt-1">
                      {column.type.replace('Type()', '').toLowerCase()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty state when no filters selected */}
        {selectedFilterColumns.length === 0 && (
          <div className="text-center py-8 text-neutral-500 text-sm">
            Select columns from the dropdown above to add filters
          </div>
        )}
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200">
        {/* Stats Bar */}
        {data && (
          <div className="px-4 py-3 border-b border-neutral-200 flex items-center justify-between">
            <div className="text-sm text-neutral-600">
              Showing {data.offset + 1}-{Math.min(data.offset + data.limit, data.total_count)} of{' '}
              <strong>{data.total_count}</strong> rows
              {hasActiveFilters && ' (filtered)'}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevPage}
                disabled={loading || page === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-neutral-600">
                Page {page + 1} of {totalPages || 1}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={loading || !data || data.data.length < pageSize}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-neutral-600">Loading data...</div>
            </div>
          ) : data && data.data.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 font-semibold">#</TableHead>
                  {data.columns.map((column: ColumnInfo) => (
                    <TableHead key={column.name} className="font-semibold">
                      {column.name}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.map((row: Record<string, any>, idx: number) => (
                  <TableRow key={idx}>
                    <TableCell className="text-neutral-500 text-sm">
                      {data.offset + idx + 1}
                    </TableCell>
                    {data.columns.map((column: ColumnInfo) => {
                      const isClickable = isMetadataColumn(column.name);
                      const cellValue = formatCellValue(row[column.name]);

                      return (
                        <TableCell
                          key={column.name}
                          className={`max-w-xs truncate ${
                            isClickable && cellValue
                              ? 'cursor-pointer hover:bg-primary-50 hover:text-primary-700 transition-colors'
                              : ''
                          }`}
                          title={cellValue}
                          onClick={() => isClickable && handleCellClick(column.name, row[column.name])}
                        >
                          <div className="flex items-center gap-1">
                            {isClickable && cellValue && (
                              <Link2 className="h-3 w-3 text-primary-500 flex-shrink-0" />
                            )}
                            <span className={isClickable && cellValue ? 'underline' : ''}>
                              {cellValue}
                            </span>
                          </div>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-neutral-600 mb-2">No data found</p>
              {hasActiveFilters && (
                <Button variant="outline" onClick={handleClearFilters}>
                  Clear filters to see all data
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SchemaPreviewPage;
