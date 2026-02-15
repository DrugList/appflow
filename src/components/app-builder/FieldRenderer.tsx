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
  Palette,
  Star,
  ToggleLeft,
  ListChecks,
  Star as StarFilled,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { FormField, FieldType } from '@/types/app-builder';

interface FieldRendererProps {
  field: FormField;
  isPreview?: boolean;
  value?: unknown;
  onChange?: (value: unknown) => void;
}

// Icon mapping for field types
const FIELD_ICONS: Record<FieldType, typeof Type> = {
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
  multiselect: ListChecks,
  checkbox: CheckSquare,
  radio: CircleDot,
  textarea: AlignLeft,
  url: Link,
  color: Palette,
  rating: Star,
  switch: ToggleLeft,
};

export function FieldRenderer({ field, isPreview = false, value, onChange }: FieldRendererProps) {
  const [localValue, setLocalValue] = useState(value ?? field.defaultValue ?? '');
  const [rating, setRating] = useState(Number(localValue) || 0);

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
            value={String(localValue)}
            onChange={(e) => handleChange(e.target.value)}
            disabled={!isPreview}
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            placeholder={field.placeholder}
            value={String(localValue)}
            onChange={(e) => handleChange(e.target.value)}
            step={field.properties?.step ?? 1}
            disabled={!isPreview}
          />
        );

      case 'textarea':
        return (
          <Textarea
            placeholder={field.placeholder}
            value={String(localValue)}
            onChange={(e) => handleChange(e.target.value)}
            rows={field.properties?.rows ?? 4}
            disabled={!isPreview}
          />
        );

      case 'date':
        return (
          <Input
            type="date"
            value={String(localValue)}
            onChange={(e) => handleChange(e.target.value)}
            disabled={!isPreview}
          />
        );

      case 'time':
        return (
          <Input
            type="time"
            value={String(localValue)}
            onChange={(e) => handleChange(e.target.value)}
            disabled={!isPreview}
          />
        );

      case 'datetime':
        return (
          <Input
            type="datetime-local"
            value={String(localValue)}
            onChange={(e) => handleChange(e.target.value)}
            disabled={!isPreview}
          />
        );

      case 'select':
        return (
          <Select
            value={String(localValue)}
            onValueChange={handleChange}
            disabled={!isPreview}
          >
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder || 'Select an option'} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option.id} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'multiselect':
        return (
          <div className="space-y-2">
            {field.options?.map((option) => (
              <div key={option.id} className="flex items-center space-x-2">
                <Checkbox
                  id={option.id}
                  checked={(localValue as string[])?.includes(option.value)}
                  onCheckedChange={(checked) => {
                    const current = (localValue as string[]) || [];
                    if (checked) {
                      handleChange([...current, option.value]);
                    } else {
                      handleChange(current.filter((v) => v !== option.value));
                    }
                  }}
                  disabled={!isPreview}
                />
                <Label htmlFor={option.id} className="text-sm font-normal">
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        );

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
        return (
          <RadioGroup
            value={String(localValue)}
            onValueChange={handleChange}
            disabled={!isPreview}
          >
            {field.options?.map((option) => (
              <div key={option.id} className="flex items-center space-x-2">
                <RadioGroupItem value={option.value} id={option.id} />
                <Label htmlFor={option.id} className="text-sm font-normal">
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'switch':
        return (
          <div className="flex items-center space-x-2">
            <Switch
              id={field.id}
              checked={Boolean(localValue)}
              onCheckedChange={handleChange}
              disabled={!isPreview}
            />
            <Label htmlFor={field.id} className="text-sm font-normal">
              {field.placeholder || 'Toggle this switch'}
            </Label>
          </div>
        );

      case 'rating':
        const maxRating = field.properties?.ratingMax ?? 5;
        return (
          <div className="flex items-center gap-1">
            {Array.from({ length: maxRating }, (_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setRating(i + 1);
                  handleChange(i + 1);
                }}
                disabled={!isPreview}
                className="focus:outline-none"
              >
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <StarFilled
                    className={`h-6 w-6 ${
                      i < rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-muted-foreground'
                    }`}
                  />
                </motion.div>
              </button>
            ))}
          </div>
        );

      case 'color':
        return (
          <div className="flex items-center gap-3">
            <Input
              type="color"
              value={String(localValue) || '#000000'}
              onChange={(e) => handleChange(e.target.value)}
              className="w-12 h-10 p-1 cursor-pointer"
              disabled={!isPreview}
            />
            <Input
              type="text"
              value={String(localValue) || '#000000'}
              onChange={(e) => handleChange(e.target.value)}
              className="flex-1"
              disabled={!isPreview}
            />
          </div>
        );

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

      default:
        return (
          <Input
            placeholder={field.placeholder}
            value={String(localValue)}
            onChange={(e) => handleChange(e.target.value)}
            disabled={!isPreview}
          />
        );
    }
  };

  // Don't show label for certain field types
  const showLabel = !['checkbox', 'switch'].includes(field.type);

  return (
    <div className="space-y-2">
      {showLabel && (
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
          <Label className="text-sm font-medium">
            {field.label}
            {field.validation?.required && (
              <span className="text-destructive ml-1">*</span>
            )}
          </Label>
        </div>
      )}
      {renderField()}
      {field.helperText && (
        <p className="text-xs text-muted-foreground">{field.helperText}</p>
      )}
    </div>
  );
}
