'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { 
  Type, Hash, Mail, Phone, Calendar, Clock, MapPin, 
  Scan, PenTool, Camera, ChevronDown, List, CheckSquare, 
  CircleDot, AlignLeft, Link, Upload, CalendarClock,
  GripVertical, Trash2, Settings, Eye, EyeOff
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { FormField, FieldType } from '@/types/app-builder';
import { createField } from '@/types/app-builder';

// Icon mapping
const FIELD_ICONS: Record<FieldType, React.ReactNode> = {
  text: <Type className="h-4 w-4" />,
  textarea: <AlignLeft className="h-4 w-4" />,
  email: <Mail className="h-4 w-4" />,
  phone: <Phone className="h-4 w-4" />,
  number: <Hash className="h-4 w-4" />,
  url: <Link className="h-4 w-4" />,
  date: <Calendar className="h-4 w-4" />,
  time: <Clock className="h-4 w-4" />,
  datetime: <CalendarClock className="h-4 w-4" />,
  select: <ChevronDown className="h-4 w-4" />,
  multiselect: <List className="h-4 w-4" />,
  radio: <CircleDot className="h-4 w-4" />,
  checkbox: <CheckSquare className="h-4 w-4" />,
  location: <MapPin className="h-4 w-4" />,
  barcode: <Scan className="h-4 w-4" />,
  photo: <Camera className="h-4 w-4" />,
  signature: <PenTool className="h-4 w-4" />,
  file: <Upload className="h-4 w-4" />,
};

interface FormCanvasProps {
  fields: FormField[];
  selectedFieldId: string | null;
  previewMode: boolean;
  onSelectField: (fieldId: string) => void;
  onUpdateField: (fieldId: string, updates: Partial<FormField>) => void;
  onRemoveField: (fieldId: string) => void;
  onReorderFields: (fromIndex: number, toIndex: number) => void;
  onAddField: (type: FieldType) => void;
}

export function FormCanvas({
  fields,
  selectedFieldId,
  previewMode,
  onSelectField,
  onUpdateField,
  onRemoveField,
  onReorderFields,
  onAddField,
}: FormCanvasProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    // Get field type from session storage (set by FieldPalette)
    const fieldType = window.sessionStorage.getItem('draggedFieldType') as FieldType;
    if (fieldType) {
      onAddField(fieldType);
      window.sessionStorage.removeItem('draggedFieldType');
    }
  }, [onAddField]);

  // Preview mode - show form as users would see it
  if (previewMode) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-4 border-b bg-muted/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Preview Mode</span>
          </div>
          <Badge variant="outline" className="text-xs">
            Form will look like this for users
          </Badge>
        </div>
        <ScrollArea className="flex-1 p-6">
          <Card className="max-w-lg mx-auto p-6 shadow-lg">
            <form className="space-y-4">
              {fields.map((field) => (
                <FormFieldPreview key={field.id} field={field} />
              ))}
            </form>
          </Card>
        </ScrollArea>
      </div>
    );
  }

  // Empty state
  if (fields.length === 0) {
    return (
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "h-full flex items-center justify-center p-8 transition-colors",
          isDragOver && "bg-primary/5"
        )}
      >
        <div className="text-center max-w-sm">
          <div className={cn(
            "w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center transition-colors",
            isDragOver ? "bg-primary/20" : "bg-muted"
          )}>
            <GripVertical className={cn(
              "h-8 w-8 transition-colors",
              isDragOver ? "text-primary" : "text-muted-foreground"
            )} />
          </div>
          <h3 className="font-semibold text-lg mb-2">
            {isDragOver ? 'Drop to add field' : 'No fields yet'}
          </h3>
          <p className="text-sm text-muted-foreground">
            Drag fields from the left sidebar or click to add them to your form
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "h-full flex flex-col transition-colors",
        isDragOver && "bg-primary/5"
      )}
    >
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Form Fields</h3>
          <Badge variant="secondary">{fields.length} fields</Badge>
        </div>
      </div>
      
      <ScrollArea className="flex-1 p-4">
        <Reorder.Group
          axis="y"
          values={fields}
          onReorder={(newOrder) => {
            const oldIndex = fields.findIndex((f) => f.id === newOrder[0]?.id);
            const newIndex = 0;
            if (oldIndex !== -1 && oldIndex !== newIndex) {
              onReorderFields(oldIndex, newIndex);
            }
          }}
          className="space-y-2"
        >
          {fields.map((field, index) => (
            <Reorder.Item
              key={field.id}
              value={field}
              className="cursor-grab active:cursor-grabbing"
            >
              <FieldCard
                field={field}
                index={index}
                isSelected={selectedFieldId === field.id}
                onSelect={() => onSelectField(field.id)}
                onRemove={() => onRemoveField(field.id)}
              />
            </Reorder.Item>
          ))}
        </Reorder.Group>
      </ScrollArea>
    </div>
  );
}

// Individual field card in the canvas
interface FieldCardProps {
  field: FormField;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
}

function FieldCard({ field, index, isSelected, onSelect, onRemove }: FieldCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card
        className={cn(
          "p-3 cursor-pointer transition-all",
          isSelected 
            ? "border-primary shadow-sm bg-primary/5" 
            : "hover:border-primary/50 hover:shadow-sm"
        )}
        onClick={onSelect}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted text-muted-foreground">
            {FIELD_ICONS[field.type]}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm truncate">{field.label}</span>
              {field.required && (
                <span className="text-red-500">*</span>
              )}
            </div>
            <span className="text-xs text-muted-foreground capitalize">
              {field.type.replace('_', ' ')}
            </span>
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

// Preview component for each field type
function FormFieldPreview({ field }: { field: FormField }) {
  const renderInput = () => {
    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
      case 'url':
        return (
          <input
            type={field.type === 'text' ? 'text' : field.type}
            placeholder={field.placeholder}
            className="w-full px-3 py-2 border rounded-md bg-background"
            disabled
          />
        );
      case 'number':
        return (
          <input
            type="number"
            placeholder={field.placeholder}
            className="w-full px-3 py-2 border rounded-md bg-background"
            disabled
          />
        );
      case 'textarea':
        return (
          <textarea
            placeholder={field.placeholder}
            rows={(field as { rows?: number }).rows || 4}
            className="w-full px-3 py-2 border rounded-md bg-background resize-none"
            disabled
          />
        );
      case 'date':
      case 'time':
      case 'datetime':
        return (
          <input
            type={field.type === 'datetime' ? 'datetime-local' : field.type}
            className="w-full px-3 py-2 border rounded-md bg-background"
            disabled
          />
        );
      case 'select':
        return (
          <select className="w-full px-3 py-2 border rounded-md bg-background" disabled>
            <option>Select an option...</option>
          </select>
        );
      case 'checkbox':
        return (
          <div className="flex items-center gap-2">
            <input type="checkbox" className="w-4 h-4" disabled />
            <span className="text-sm">{field.label}</span>
          </div>
        );
      case 'location':
        return (
          <Button variant="outline" className="w-full" disabled>
            <MapPin className="h-4 w-4 mr-2" />
            Capture Location
          </Button>
        );
      case 'barcode':
        return (
          <Button variant="outline" className="w-full" disabled>
            <Scan className="h-4 w-4 mr-2" />
            Scan Barcode/QR
          </Button>
        );
      case 'photo':
        return (
          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <Camera className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Tap to take photo</p>
          </div>
        );
      case 'signature':
        return (
          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <PenTool className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Tap to sign</p>
          </div>
        );
      default:
        return (
          <input
            type="text"
            placeholder={field.placeholder}
            className="w-full px-3 py-2 border rounded-md bg-background"
            disabled
          />
        );
    }
  };

  return (
    <div className="space-y-2">
      {field.type !== 'checkbox' && (
        <label className="text-sm font-medium flex items-center gap-1">
          {field.label}
          {field.required && <span className="text-red-500">*</span>}
        </label>
      )}
      {renderInput()}
      {field.description && (
        <p className="text-xs text-muted-foreground">{field.description}</p>
      )}
    </div>
  );
}

// Import needed for ScrollArea
import { ScrollArea } from '@/components/ui/scroll-area';
