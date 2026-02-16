'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Type,
  Hash,
  Mail,
  Phone,
  Calendar,
  Clock,
  MapPin,
  ScanLine,
  PenTool,
  Camera,
  FileUp,
  List,
  CheckSquare,
  CircleDot,
  AlignLeft,
  Link,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormField, FieldType, OptionField, NumberField, TextareaField } from '@/types/app-builder';

interface FieldRendererProps {
  field: FormField;
  isPreview?: boolean;
  value?: unknown;
  onChange?: (value: unknown) => void;
}

// Icon mapping for field types
const FIELD_ICONS: Partial<Record<FieldType, typeof Type>> = {
  text: Type,
  number: Hash,
  email: Mail,
  phone: Phone,
  date: Calendar,
  time: Clock,
  datetime: Calendar,
  location: MapPin,
  barcode: ScanLine,
  signature: PenTool,
  photo: Camera,
  file: FileUp,
  select: List,
  multiselect: List,
  checkbox: CheckSquare,
  radio: CircleDot,
  textarea: AlignLeft,
  url: Link,
};

// Type guard to check if field has options
function hasOptions(field: FormField): field is OptionField {
  return ['select', 'multiselect', 'radio', 'checkbox'].includes(field.type);
}

export function FieldRenderer({ field, isPreview = false, value, onChange }: FieldRendererProps) {
  const [localValue, setLocalValue] = useState<unknown>(value ?? field.defaultValue ?? '');

  const handleChange = (newValue: unknown) => {
    setLocalValue(newValue);
    onChange?.(newValue);
  };

  const Icon = FIELD_ICONS[field.type];

  // Render field based on type
  const renderField = () => {
    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
      case 'url':
        return (
          <Input
            type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'}
            placeholder={field.placeholder}
            value={String(localValue || '')}
            onChange={(e) => handleChange(e.target.value)}
            disabled={!isPreview}
          />
        );

      case 'number': {
        const numField = field as NumberField;
        return (
          <Input
            type="number"
            placeholder={field.placeholder}
            value={localValue !== null && localValue !== undefined ? String(localValue) : ''}
            onChange={(e) => handleChange(e.target.value ? Number(e.target.value) : null)}
            step={numField.step ?? 1}
            min={numField.min}
            max={numField.max}
            disabled={!isPreview}
          />
        );
      }

      case 'textarea': {
        const textareaField = field as TextareaField;
        return (
          <Textarea
            placeholder={field.placeholder}
            value={String(localValue || '')}
            onChange={(e) => handleChange(e.target.value)}
            rows={textareaField.rows ?? 4}
            disabled={!isPreview}
          />
        );
      }

      case 'date':
        return (
          <Input
            type="date"
            value={String(localValue || '')}
            onChange={(e) => handleChange(e.target.value)}
            disabled={!isPreview}
          />
        );

      case 'time':
        return (
          <Input
            type="time"
            value={String(localValue || '')}
            onChange={(e) => handleChange(e.target.value)}
            disabled={!isPreview}
          />
        );

      case 'datetime':
        return (
          <Input
            type="datetime-local"
            value={String(localValue || '')}
            onChange={(e) => handleChange(e.target.value)}
            disabled={!isPreview}
          />
        );

      case 'select':
        if (hasOptions(field)) {
          return (
            <Select
              value={String(localValue || '')}
              onValueChange={handleChange}
              disabled={!isPreview}
            >
              <SelectTrigger>
                <SelectValue placeholder={field.placeholder || 'Select an option'} />
              </SelectTrigger>
              <SelectContent>
                {field.options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        }
        return null;

      case 'multiselect':
        if (hasOptions(field)) {
          return (
            <div className="space-y-2">
              {field.options.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${field.id}-${option.value}`}
                    checked={Array.isArray(localValue) && (localValue as string[]).includes(option.value)}
                    onCheckedChange={(checked) => {
                      const current = Array.isArray(localValue) ? (localValue as string[]) : [];
                      if (checked) {
                        handleChange([...current, option.value]);
                      } else {
                        handleChange(current.filter((v) => v !== option.value));
                      }
                    }}
                    disabled={!isPreview}
                  />
                  <Label htmlFor={`${field.id}-${option.value}`} className="text-sm font-normal">
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          );
        }
        return null;

      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={field.id}
              checked={Boolean(localValue)}
              onCheckedChange={handleChange}
              disabled={!isPreview}
            />
            <Label htmlFor={field.id} className="text-sm font-normal">
              {field.placeholder || 'Check this box'}
            </Label>
          </div>
        );

      case 'radio':
        if (hasOptions(field)) {
          return (
            <RadioGroup
              value={String(localValue || '')}
              onValueChange={handleChange}
              disabled={!isPreview}
            >
              {field.options.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value} id={`${field.id}-${option.value}`} />
                  <Label htmlFor={`${field.id}-${option.value}`} className="text-sm font-normal">
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          );
        }
        return null;

      case 'photo':
        return (
          <div className="border-2 border-dashed rounded-lg p-6 text-center">
            <Camera className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-2">
              {field.placeholder || 'Click to take photo or upload'}
            </p>
            <Button variant="outline" size="sm" disabled={!isPreview}>
              <Camera className="h-4 w-4 mr-2" />
              Camera
            </Button>
          </div>
        );

      case 'file':
        return (
          <div className="border-2 border-dashed rounded-lg p-6 text-center">
            <FileUp className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-2">
              {field.placeholder || 'Drag & drop files or click to browse'}
            </p>
            <Button variant="outline" size="sm" disabled={!isPreview}>
              <FileUp className="h-4 w-4 mr-2" />
              Browse Files
            </Button>
          </div>
        );

      case 'signature':
        return (
          <div className="border-2 border-dashed rounded-lg p-6 text-center">
            <PenTool className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-2">
              Click to add signature
            </p>
            <Button variant="outline" size="sm" disabled={!isPreview}>
              <PenTool className="h-4 w-4 mr-2" />
              Sign
            </Button>
          </div>
        );

      case 'location':
        return (
          <div className="border-2 border-dashed rounded-lg p-6 text-center">
            <MapPin className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-2">
              Click to capture current location
            </p>
            <Button variant="outline" size="sm" disabled={!isPreview}>
              <MapPin className="h-4 w-4 mr-2" />
              Get Location
            </Button>
          </div>
        );

      case 'barcode':
        return (
          <div className="border-2 border-dashed rounded-lg p-6 text-center">
            <ScanLine className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-2">
              Click to scan barcode or QR code
            </p>
            <Button variant="outline" size="sm" disabled={!isPreview}>
              <ScanLine className="h-4 w-4 mr-2" />
              Scan
            </Button>
          </div>
        );

      default: {
        // For any unhandled field types
        const _exhaustiveCheck: never = field;
        return (
          <Input
            placeholder={(field as { placeholder?: string }).placeholder || ''}
            value={String(localValue || '')}
            onChange={(e) => handleChange(e.target.value)}
            disabled={!isPreview}
          />
        );
      }
    }
  };

  // Don't show label for certain field types
  const showLabel = !['checkbox'].includes(field.type);

  return (
    <div className="space-y-2">
      {showLabel && (
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
          <Label className="text-sm font-medium">
            {field.label}
            {field.required && (
              <span className="text-destructive ml-1">*</span>
            )}
          </Label>
        </div>
      )}
      {renderField()}
      {field.description && (
        <p className="text-xs text-muted-foreground">{field.description}</p>
      )}
    </div>
  );
}
