import { Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface EnumValueEditorProps {
  values: Record<string, string>;
  defaultKey?: string;
  onChange: (values: Record<string, string>, defaultKey?: string) => void;
}

export function EnumValueEditor({ values, defaultKey, onChange }: EnumValueEditorProps) {
  const entries = Object.entries(values);

  const handleAddValue = () => {
    onChange({ ...values, '': '' }, defaultKey);
  };

  const handleRemoveValue = (key: string) => {
    const next = { ...values };
    delete next[key];
    const nextDefault = defaultKey === key ? undefined : defaultKey;
    onChange(next, nextDefault);
  };

  const handleKeyChange = (oldKey: string, newKey: string) => {
    const next: Record<string, string> = {};
    for (const [k, v] of Object.entries(values)) {
      if (k === oldKey) {
        next[newKey] = v;
      } else {
        next[k] = v;
      }
    }
    const nextDefault = defaultKey === oldKey ? newKey : defaultKey;
    onChange(next, nextDefault);
  };

  const handleValueChange = (key: string, newValue: string) => {
    onChange({ ...values, [key]: newValue }, defaultKey);
  };

  const handleDefaultChange = (key: string) => {
    onChange(values, key === '__none__' ? undefined : key);
  };

  return (
    <div className="ml-8 mt-2 space-y-2">
      <Label className="text-xs text-neutral-500">Enum Values</Label>
      {entries.map(([key, value], index) => (
        <div key={index} className="flex items-center gap-2">
          <Input
            value={key}
            onChange={(e) => handleKeyChange(key, e.target.value)}
            placeholder="Key"
            className="h-8 text-xs flex-1"
          />
          <Input
            value={value}
            onChange={(e) => handleValueChange(key, e.target.value)}
            placeholder="Display value"
            className="h-8 text-xs flex-1"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-neutral-400 hover:text-red-600"
            onClick={() => handleRemoveValue(key)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-xs h-7"
        onClick={handleAddValue}
      >
        <Plus className="h-3.5 w-3.5 mr-1" />
        Add Value
      </Button>
      {entries.length > 0 && (
        <div className="flex items-center gap-2 pt-1">
          <Label className="text-xs text-neutral-500 whitespace-nowrap">Default key:</Label>
          <Select value={defaultKey || '__none__'} onValueChange={handleDefaultChange}>
            <SelectTrigger className="h-8 text-xs flex-1">
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">None</SelectItem>
              {entries
                .filter(([k]) => k.length > 0)
                .map(([key]) => (
                  <SelectItem key={key} value={key}>
                    {key}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
