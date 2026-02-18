import Editor from '@monaco-editor/react';

interface SqlEditorProps {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  height?: string;
}

export function SqlEditor({ value, onChange, readOnly = false, height = '200px' }: SqlEditorProps) {
  return (
    <div className="border border-neutral-200 rounded-lg overflow-hidden">
      <Editor
        height={height}
        defaultLanguage="sql"
        value={value}
        onChange={(val) => onChange(val ?? '')}
        theme="vs"
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          wordWrap: 'on',
          automaticLayout: true,
          readOnly,
          scrollBeyondLastLine: false,
          lineNumbers: 'on',
          renderLineHighlight: 'none',
          padding: { top: 8, bottom: 8 },
        }}
      />
    </div>
  );
}
