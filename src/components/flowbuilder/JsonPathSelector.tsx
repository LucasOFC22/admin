import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Plus, Hash, Type, ToggleLeft, List, Braces } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface JsonPathSelectorProps {
  data: any;
  onSelect: (path: string, value: any) => void;
  draggable?: boolean;
}

type JsonValueType = 'string' | 'number' | 'boolean' | 'array' | 'object' | 'null';

const getValueType = (value: any): JsonValueType => {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value as JsonValueType;
};

const TypeIcon: React.FC<{ type: JsonValueType; className?: string }> = ({ type, className }) => {
  const iconProps = { className: cn("h-3.5 w-3.5", className) };
  
  switch (type) {
    case 'string':
      return <Type {...iconProps} />;
    case 'number':
      return <Hash {...iconProps} />;
    case 'boolean':
      return <ToggleLeft {...iconProps} />;
    case 'array':
      return <List {...iconProps} />;
    case 'object':
      return <Braces {...iconProps} />;
    default:
      return null;
  }
};

const TypeBadge: React.FC<{ type: JsonValueType }> = ({ type }) => {
  const colors: Record<JsonValueType, string> = {
    string: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    number: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    boolean: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    array: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    object: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
    null: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };

  return (
    <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium", colors[type])}>
      {type}
    </span>
  );
};

interface JsonNodeProps {
  keyName: string | number;
  value: any;
  path: string;
  onSelect: (path: string, value: any) => void;
  depth: number;
  isArrayItem?: boolean;
  draggable?: boolean;
}

const JsonNode: React.FC<JsonNodeProps> = ({ keyName, value, path, onSelect, depth, isArrayItem, draggable }) => {
  const [expanded, setExpanded] = useState(depth < 2);
  const type = getValueType(value);
  const isExpandable = type === 'object' || type === 'array';
  const hasChildren = isExpandable && (type === 'array' ? value.length > 0 : Object.keys(value).length > 0);

  const formatValue = (val: any, t: JsonValueType): string => {
    if (t === 'string') return `"${val.length > 50 ? val.slice(0, 50) + '...' : val}"`;
    if (t === 'null') return 'null';
    if (t === 'boolean') return val ? 'true' : 'false';
    if (t === 'array') return `Array[${val.length}]`;
    if (t === 'object') return `Object{${Object.keys(val).length}}`;
    return String(val);
  };

  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(path, value);
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', path);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="select-none">
      <div
        className={cn(
          "flex items-center gap-1 py-1 px-2 rounded-md group transition-colors",
          "hover:bg-muted/80",
          draggable ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => isExpandable && hasChildren && setExpanded(!expanded)}
        draggable={draggable}
        onDragStart={handleDragStart}
      >
        {/* Expand/Collapse */}
        <span className="w-4 h-4 flex items-center justify-center">
          {isExpandable && hasChildren ? (
            expanded ? (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            )
          ) : null}
        </span>

        {/* Type Icon */}
        <TypeIcon type={type} className="text-muted-foreground" />

        {/* Key Name */}
        <span className={cn(
          "font-mono text-sm",
          isArrayItem ? "text-orange-600 dark:text-orange-400" : "text-foreground"
        )}>
          {isArrayItem ? `[${keyName}]` : keyName}
        </span>

        <span className="text-muted-foreground">:</span>

        {/* Value Preview */}
        {!isExpandable || !hasChildren ? (
          <span className={cn(
            "text-sm font-mono truncate max-w-[200px]",
            type === 'string' && "text-green-600 dark:text-green-400",
            type === 'number' && "text-blue-600 dark:text-blue-400",
            type === 'boolean' && "text-purple-600 dark:text-purple-400",
            type === 'null' && "text-red-600 dark:text-red-400"
          )}>
            {formatValue(value, type)}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">
            {type === 'array' ? `[${value.length} items]` : `{${Object.keys(value).length} keys}`}
          </span>
        )}

        {/* Type Badge */}
        <TypeBadge type={type} />

        {/* Select Button */}
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0 ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={handleSelect}
          title={`Selecionar ${path}`}
        >
          <Plus className="h-4 w-4 text-primary" />
        </Button>
      </div>

      {/* Children */}
      {isExpandable && expanded && hasChildren && (
        <div>
          {type === 'array'
            ? value.map((item: any, index: number) => (
                <JsonNode
                  key={index}
                  keyName={index}
                  value={item}
                  path={`${path}[${index}]`}
                  onSelect={onSelect}
                  depth={depth + 1}
                  isArrayItem
                  draggable={draggable}
                />
              ))
            : Object.entries(value).map(([key, val]) => (
                <JsonNode
                  key={key}
                  keyName={key}
                  value={val}
                  path={path ? `${path}.${key}` : key}
                  onSelect={onSelect}
                  depth={depth + 1}
                  draggable={draggable}
                />
              ))}
        </div>
      )}
    </div>
  );
};

export const JsonPathSelector: React.FC<JsonPathSelectorProps> = ({ data, onSelect, draggable }) => {
  if (data === null || data === undefined) {
    return (
      <div className="p-4 text-center text-muted-foreground text-sm">
        Nenhum dado disponível
      </div>
    );
  }

  const type = getValueType(data);

  if (type !== 'object' && type !== 'array') {
    return (
      <div className="p-2">
        <JsonNode
          keyName="response"
          value={data}
          path=""
          onSelect={onSelect}
          depth={0}
          draggable={draggable}
        />
      </div>
    );
  }

  return (
    <div className="py-1">
      {type === 'array'
        ? data.map((item: any, index: number) => (
            <JsonNode
              key={index}
              keyName={index}
              value={item}
              path={`[${index}]`}
              onSelect={onSelect}
              depth={0}
              isArrayItem
              draggable={draggable}
            />
          ))
        : Object.entries(data).map(([key, value]) => (
            <JsonNode
              key={key}
              keyName={key}
              value={value}
              path={key}
              onSelect={onSelect}
              depth={0}
              draggable={draggable}
            />
          ))}
    </div>
  );
};
