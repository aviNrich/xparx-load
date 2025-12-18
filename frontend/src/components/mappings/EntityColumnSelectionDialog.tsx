import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Combobox } from '../ui/combobox';
import { Info } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';

interface EntityColumnSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columns: string[];
  existingEntityRootIdColumn?: string;
  existingEntityIdColumn?: string;
  onConfirm: (entityRootIdColumn: string, entityIdColumn: string) => void;
  onCancel?: () => void;
}

// Smart detection patterns for entity ID columns (row identifiers)
const ENTITY_ID_PATTERNS = [
  /^id$/i,
  /^row_?id$/i,
  /^record_?id$/i,
  /^pk$/i,
  /^primary_?key$/i,
];

// Smart detection patterns for entity root ID columns (parent/root identifiers)
const ROOT_ID_PATTERNS = [
  /^root_?id$/i,
  /^entity_?id$/i,
  /^parent_?id$/i,
  /poi_?id$/i,
  /user_?id$/i,
  /customer_?id$/i,
  /account_?id$/i,
  /order_?id$/i,
  /product_?id$/i,
  /company_?id$/i,
  /org_?id$/i,
  /organization_?id$/i,
];

/**
 * Attempts to find a matching column based on patterns
 */
function findMatchingColumn(columns: string[], patterns: RegExp[]): string | null {
  for (const pattern of patterns) {
    const match = columns.find(col => pattern.test(col));
    if (match) return match;
  }
  return null;
}

/**
 * Smart auto-detection of entity columns
 */
function detectEntityColumns(columns: string[]): { entityId: string | null; rootId: string | null } {
  // First try to find entity ID (row identifier)
  const entityId = findMatchingColumn(columns, ENTITY_ID_PATTERNS);

  // Then try to find root ID (parent identifier)
  const rootId = findMatchingColumn(columns, ROOT_ID_PATTERNS);

  return { entityId, rootId };
}

export function EntityColumnSelectionDialog({
  open,
  onOpenChange,
  columns,
  existingEntityRootIdColumn,
  existingEntityIdColumn,
  onConfirm,
  onCancel,
}: EntityColumnSelectionDialogProps) {
  const [entityRootIdColumn, setEntityRootIdColumn] = useState<string>('');
  const [entityIdColumn, setEntityIdColumn] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Auto-detect or use existing columns when dialog opens or columns change
  useEffect(() => {
    if (open && columns.length > 0) {
      // Prioritize existing values over auto-detection
      if (existingEntityRootIdColumn && columns.includes(existingEntityRootIdColumn)) {
        setEntityRootIdColumn(existingEntityRootIdColumn);
      } else {
        const detected = detectEntityColumns(columns);
        if (detected.rootId) {
          setEntityRootIdColumn(detected.rootId);
        }
      }

      if (existingEntityIdColumn && columns.includes(existingEntityIdColumn)) {
        setEntityIdColumn(existingEntityIdColumn);
      } else {
        const detected = detectEntityColumns(columns);
        if (detected.entityId) {
          setEntityIdColumn(detected.entityId);
        }
      }
    }
  }, [open, columns, existingEntityRootIdColumn, existingEntityIdColumn]);

  const handleConfirm = () => {
    // Validate selections
    if (!entityRootIdColumn) {
      setError('Please select an entity root ID column');
      return;
    }
    if (!entityIdColumn) {
      setError('Please select an entity ID column');
      return;
    }
    if (entityRootIdColumn === entityIdColumn) {
      setError('Entity root ID and entity ID must be different columns');
      return;
    }

    onConfirm(entityRootIdColumn, entityIdColumn);
    onOpenChange(false);
    // Reset state
    setEntityRootIdColumn('');
    setEntityIdColumn('');
    setError('');
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    onOpenChange(false);
    // Reset state
    setEntityRootIdColumn('');
    setEntityIdColumn('');
    setError('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <Info className="h-6 w-6 text-blue-600" />
            <DialogTitle className="text-lg">Select Entity Columns</DialogTitle>
          </div>
          <DialogDescription className="text-sm text-neutral-600 leading-relaxed">
            Choose the entity root ID column and the row ID column from your query results.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Entity Root ID Column */}
          <div>
            <Label htmlFor="entity_root_id" className="text-neutral-700 text-sm font-medium">
              Entity Root ID Column <span className="text-red-500">*</span>
            </Label>
            <p className="text-xs text-neutral-500 mb-2">
              The root entity identifier (e.g., poi_id, user_id, customer_id)
            </p>
            <Combobox
              options={columns.map((col) => ({ label: col, value: col }))}
              value={entityRootIdColumn}
              onValueChange={(value) => {
                setEntityRootIdColumn(value);
                setError('');
              }}
              placeholder="Select column..."
              searchPlaceholder="Search columns..."
              emptyMessage="No columns found."
            />
          </div>

          {/* Entity ID Column */}
          <div>
            <Label htmlFor="entity_id" className="text-neutral-700 text-sm font-medium">
              Entity ID Column <span className="text-red-500">*</span>
            </Label>
            <p className="text-xs text-neutral-500 mb-2">
              The row identifier (e.g., id, row_id, record_id)
            </p>
            <Combobox
              options={columns.map((col) => ({ label: col, value: col }))}
              value={entityIdColumn}
              onValueChange={(value) => {
                setEntityIdColumn(value);
                setError('');
              }}
              placeholder="Select column..."
              searchPlaceholder="Search columns..."
              emptyMessage="No columns found."
            />
          </div>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive" className="text-xs">
              <AlertDescription className="text-xs">{error}</AlertDescription>
            </Alert>
          )}

          {/* Example */}
          <div className="bg-neutral-50 border border-neutral-200 rounded-md p-3">
            <p className="text-xs font-medium text-neutral-700 mb-1">Example:</p>
            <p className="text-xs text-neutral-600">
              For query: <code className="bg-neutral-200 px-1 rounded">SELECT id, poi_id, value FROM table</code>
            </p>
            <p className="text-xs text-neutral-600 mt-1">
              Entity Root ID: <code className="bg-neutral-200 px-1 rounded">poi_id</code>
            </p>
            <p className="text-xs text-neutral-600">
              Entity ID: <code className="bg-neutral-200 px-1 rounded">id</code>
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            className="border-neutral-300"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            className="bg-primary-600 hover:bg-primary-700 text-white"
          >
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
