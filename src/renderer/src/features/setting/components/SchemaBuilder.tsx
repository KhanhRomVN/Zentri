import React, { useState, useEffect } from 'react';
import { CodeBlock } from '@core/components/CodeBlock';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { cn } from '../../../shared/lib/utils';

export interface SchemaField {
  key: string;
  label: string;
  type: 'string' | 'array' | 'object';
  itemType?: 'string' | 'object';
  children?: SchemaField[];
  required?: boolean;
}

interface SchemaBuilderProps {
  fields: SchemaField[];
  onChange: (fields: SchemaField[]) => void;
  level?: number; // Kept for compatibility
}

const DEFAULT_TEMPLATE = `[
  {
    "key": "server_id",
    "label": "Server ID",
    "type": "string"
  },
  {
    "key": "config",
    "label": "Configuration",
    "type": "object",
    "children": [
      {
        "key": "region",
        "label": "Region",
        "type": "string"
      },
      {
        "key": "ports",
        "label": "Allowed Ports",
        "type": "array",
        "itemType": "string"
      }
    ]
  }
]`;

export const SchemaBuilder: React.FC<SchemaBuilderProps> = ({ fields, onChange }) => {
  const [code, setCode] = useState(() => {
    return fields && fields.length > 0 ? JSON.stringify(fields, null, 2) : DEFAULT_TEMPLATE;
  });
  const [error, setError] = useState<string | null>(null);

  // Sync state if fields prop changes significantly (optional, but good for reset/load)
  useEffect(() => {
    if (fields && fields.length > 0) {
      try {
        const currentParsed = JSON.parse(code);
        // Rough check to see if we should sync from props (e.g. on initial load)
        // We avoid overwriting if user has invalid JSON or if it matches
        if (JSON.stringify(currentParsed) !== JSON.stringify(fields)) {
          // Only sync if it seems completely different (like loading a new service)
          // This is tricky with 2-way binding.
          // Decision: Trust internal state for editing, trust props only on mount.
          // But for "Edit Service", we need to load the existing fields.
          // We'll rely on the key prop in parent to reset component or just init.
        }
      } catch (e) {
        // Internal code is broken, definitely don't overwrite from props?
        // Or if props changed, maybe we SHOULD overwrite?
        // In this specific flow, props change only when WE call onChange.
        // So we don't need to listen to props here to avoid loops.
      }
    }
  }, []);

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    try {
      const parsed = JSON.parse(newCode);
      if (!Array.isArray(parsed)) {
        throw new Error('Schema must be an array of fields [...]');
      }

      // Basic recursive validation
      const validate = (items: any[], path = ''): boolean => {
        return items.every((item, idx) => {
          if (!item.key || !item.label || !item.type)
            throw new Error(`Missing required properties in item ${idx} at ${path}`);
          if (item.type === 'array' && !item.itemType)
            throw new Error(`Array field "${item.label}" missing itemType`);
          if (item.type === 'object' && (!item.children || !Array.isArray(item.children)))
            throw new Error(`Object field "${item.label}" missing children array`);

          if (item.children) validate(item.children, `${path}.${item.key}`);
          return true;
        });
      };

      validate(parsed);

      setError(null);
      onChange(parsed as SchemaField[]);
    } catch (err: any) {
      setError(err.message || 'Invalid JSON syntax');
      // Intentionally DO NOT propagate invalid state to parent
    }
  };

  const handleReset = () => {
    setCode(DEFAULT_TEMPLATE);
    // Also propagate the reset
    try {
      onChange(JSON.parse(DEFAULT_TEMPLATE));
      setError(null);
    } catch (e) {}
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground hover:text-primary transition-colors opacity-70 hover:opacity-100"
          title="Reset to default template"
        >
          <RotateCcw size={12} />
          Load Template
        </button>
      </div>

      <div className="relative group rounded-md overflow-hidden border border-border/50">
        <CodeBlock
          code={code}
          language="json"
          readOnly={false}
          onChange={handleCodeChange}
          showLineNumbers={true}
          editorOptions={{
            fontSize: 12,
            minimap: { enabled: false },
          }}
          className="min-h-[250px] w-full"
        />

        {/* Validation Status */}
        <div
          className={cn(
            'absolute bottom-2 right-2 px-3 py-1.5 rounded-full text-[10px] font-medium backdrop-blur-md transition-all duration-300 flex items-center gap-1.5 shadow-lg border',
            error
              ? 'bg-red-500/10 text-red-500 border-red-500/20 translate-y-0 opacity-100'
              : 'bg-green-500/10 text-green-500 border-green-500/20 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100',
          )}
        >
          <AlertCircle size={12} className={error ? '' : 'opacity-0 w-0'} />
          {error ? error : 'Valid JSON'}
        </div>
      </div>

      {error && (
        <div className="text-[11px] text-red-500 flex items-start gap-2 px-1">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
