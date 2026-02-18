import { useState, useEffect, useCallback } from 'react';
import { HardDrive, Table2 } from 'lucide-react';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingState } from '@/components/shared/LoadingState';
import { Pagination } from '@/components/shared/Pagination';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { mappingRunAPI, deltaTableAPI } from '@/services/api';
import { ColumnInfo, TableSchemaInfo } from '@/types/schema';

const DATA_PAGE_SIZE = 50;

export function DeltaLakePage() {
  const [tableNames, setTableNames] = useState<string[]>([]);
  const [tablesLoading, setTablesLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);

  // Data tab state
  const [dataRows, setDataRows] = useState<Record<string, any>[]>([]);
  const [dataColumns, setDataColumns] = useState<ColumnInfo[]>([]);
  const [dataTotalCount, setDataTotalCount] = useState(0);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataPage, setDataPage] = useState(0);

  // Schema tab state
  const [schema, setSchema] = useState<TableSchemaInfo | null>(null);
  const [schemaLoading, setSchemaLoading] = useState(false);

  // Fetch table list from runs
  useEffect(() => {
    async function fetchTables() {
      try {
        const data = await mappingRunAPI.list({}, 100, 0);
        const paths = data.runs
          .map(r => r.delta_table_path)
          .filter((p): p is string => !!p);
        const uniquePaths = Array.from(new Set(paths));
        // Extract table name from path (last segment)
        const names = uniquePaths.map(p => {
          const parts = p.replace(/\/$/, '').split('/');
          return parts[parts.length - 1];
        });
        setTableNames(Array.from(new Set(names)));
      } catch {
        // silently fail
      } finally {
        setTablesLoading(false);
      }
    }
    fetchTables();
  }, []);

  // Fetch data when table or page changes
  const fetchData = useCallback(async (tableName: string, page: number) => {
    setDataLoading(true);
    try {
      const offset = page * DATA_PAGE_SIZE;
      const response = await deltaTableAPI.getData(tableName, DATA_PAGE_SIZE, offset);
      setDataRows(response.data);
      setDataColumns(response.columns);
      setDataTotalCount(response.total_count);
    } catch {
      setDataRows([]);
      setDataColumns([]);
      setDataTotalCount(0);
    } finally {
      setDataLoading(false);
    }
  }, []);

  // Fetch schema when table changes
  const fetchSchema = useCallback(async (tableName: string) => {
    setSchemaLoading(true);
    try {
      const result = await deltaTableAPI.getSchema(tableName);
      setSchema(result);
    } catch {
      setSchema(null);
    } finally {
      setSchemaLoading(false);
    }
  }, []);

  const handleSelectTable = (name: string) => {
    setSelectedTable(name);
    setDataPage(0);
    fetchData(name, 0);
    fetchSchema(name);
  };

  const handleDataPageChange = (newPage: number) => {
    setDataPage(newPage);
    if (selectedTable) {
      fetchData(selectedTable, newPage);
    }
  };

  return (
    <PageContainer>
      <PageHeader title="Delta Lake Browser" description="Browse and query Delta Lake tables" />

      <div className="flex gap-6">
        {/* Left sidebar - Table list */}
        <div className="w-72 shrink-0">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Tables</CardTitle>
            </CardHeader>
            <CardContent>
              {tablesLoading ? (
                <LoadingState variant="inline" text="Loading tables..." />
              ) : tableNames.length === 0 ? (
                <EmptyState
                  icon={HardDrive}
                  title="No tables"
                  description="Run a mapping to create Delta Lake tables."
                  className="py-6"
                />
              ) : (
                <div className="space-y-1">
                  {tableNames.map(name => (
                    <button
                      key={name}
                      onClick={() => handleSelectTable(name)}
                      className={cn(
                        'w-full text-left px-3 py-2 rounded-md text-sm transition-colors',
                        selectedTable === name
                          ? 'bg-primary-50 text-primary-600 font-medium'
                          : 'text-neutral-700 hover:bg-neutral-50'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Table2 className="h-4 w-4 shrink-0" />
                        <span className="truncate">{name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right content - Table data/schema */}
        <div className="flex-1 min-w-0">
          {!selectedTable ? (
            <Card className="h-full min-h-[400px] flex items-center justify-center">
              <EmptyState
                icon={HardDrive}
                title="Select a table to browse"
                description="Choose a table from the sidebar to view its data and schema."
              />
            </Card>
          ) : (
            <Card>
              <Tabs defaultValue="data">
                <CardHeader className="pb-0">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{selectedTable}</CardTitle>
                    <TabsList>
                      <TabsTrigger value="data">Data</TabsTrigger>
                      <TabsTrigger value="schema">Schema</TabsTrigger>
                    </TabsList>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  {/* Data Tab */}
                  <TabsContent value="data" className="mt-0">
                    {dataLoading ? (
                      <LoadingState variant="inline" text="Loading data..." />
                    ) : dataRows.length === 0 ? (
                      <EmptyState
                        icon={Table2}
                        title="No data"
                        description="This table has no rows."
                        className="py-8"
                      />
                    ) : (
                      <>
                        <div className="overflow-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                {dataColumns.map(col => (
                                  <TableHead key={col.name}>{col.name}</TableHead>
                                ))}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {dataRows.map((row, i) => (
                                <TableRow key={i}>
                                  {dataColumns.map(col => (
                                    <TableCell key={col.name} className="max-w-[300px] truncate">
                                      {row[col.name] !== null && row[col.name] !== undefined
                                        ? String(row[col.name])
                                        : <span className="text-neutral-400 italic">null</span>}
                                    </TableCell>
                                  ))}
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                        {dataTotalCount > DATA_PAGE_SIZE && (
                          <Pagination
                            page={dataPage}
                            pageSize={DATA_PAGE_SIZE}
                            totalCount={dataTotalCount}
                            onPageChange={handleDataPageChange}
                            className="mt-4"
                          />
                        )}
                      </>
                    )}
                  </TabsContent>

                  {/* Schema Tab */}
                  <TabsContent value="schema" className="mt-0">
                    {schemaLoading ? (
                      <LoadingState variant="inline" text="Loading schema..." />
                    ) : !schema || schema.columns.length === 0 ? (
                      <EmptyState
                        icon={Table2}
                        title="No schema"
                        description="Could not retrieve schema information for this table."
                        className="py-8"
                      />
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Column Name</TableHead>
                            <TableHead>Type</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {schema.columns.map(col => (
                            <TableRow key={col.name}>
                              <TableCell className="font-medium font-mono text-neutral-900">
                                {col.name}
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary">{col.type}</Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </TabsContent>
                </CardContent>
              </Tabs>
            </Card>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
