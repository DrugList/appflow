import { FieldType, FormField, OptionField } from '@/types/app-builder';
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
  ListChecks,
} from 'lucide-react';

// Field type metadata for UI rendering
export const FIELD_TYPE_META: Record<FieldType, {
  label: string;
  icon: typeof Type;
  category: 'basic' | 'date' | 'selection' | 'media' | 'special';
  description: string;
}> = {
  text: {
    label: 'Text',
    icon: Type,
    category: 'basic',
    description: 'Short text input',
  },
  number: {
    label: 'Number',
    icon: Hash,
    category: 'basic',
    description: 'Numeric input',
  },
  email: {
    label: 'Email',
    icon: Mail,
    category: 'basic',
    description: 'Email address input',
  },
  phone: {
    label: 'Phone',
    icon: Phone,
    category: 'basic',
    description: 'Phone number input',
  },
  date: {
    label: 'Date',
    icon: Calendar,
    category: 'date',
    description: 'Date picker',
  },
  time: {
    label: 'Time',
    icon: Clock,
    category: 'date',
    description: 'Time picker',
  },
  datetime: {
    label: 'Date & Time',
    icon: Calendar,
    category: 'date',
    description: 'Date and time picker',
  },
  location: {
    label: 'Location',
    icon: MapPin,
    category: 'special',
    description: 'GPS location picker',
  },
  barcode: {
    label: 'Barcode',
    icon: ScanLine,
    category: 'special',
    description: 'Barcode/QR scanner',
  },
  signature: {
    label: 'Signature',
    icon: PenTool,
    category: 'media',
    description: 'Digital signature pad',
  },
  photo: {
    label: 'Photo',
    icon: Camera,
    category: 'media',
    description: 'Camera/photo upload',
  },
  file: {
    label: 'File',
    icon: FileUp,
    category: 'media',
    description: 'File upload',
  },
  select: {
    label: 'Dropdown',
    icon: List,
    category: 'selection',
    description: 'Dropdown select',
  },
  multiselect: {
    label: 'Multi-Select',
    icon: ListChecks,
    category: 'selection',
    description: 'Multiple selection',
  },
  checkbox: {
    label: 'Checkbox',
    icon: CheckSquare,
    category: 'selection',
    description: 'Single checkbox',
  },
  radio: {
    label: 'Radio',
    icon: CircleDot,
    category: 'selection',
    description: 'Radio button group',
  },
  textarea: {
    label: 'Long Text',
    icon: AlignLeft,
    category: 'basic',
    description: 'Multi-line text',
  },
  url: {
    label: 'URL',
    icon: Link,
    category: 'basic',
    description: 'URL/link input',
  },
};

// Get fields by category
export function getFieldsByCategory(category: string) {
  return Object.entries(FIELD_TYPE_META)
    .filter(([_, meta]) => meta.category === category)
    .map(([type, meta]) => ({ type: type as FieldType, ...meta }));
}

// Get all field types grouped by category
export function getFieldTypesGrouped() {
  const grouped: Record<string, Array<{ type: FieldType; label: string; icon: typeof Type; description: string }>> = {};

  const categoryLabels: Record<string, string> = {
    basic: 'Basic Fields',
    date: 'Date & Time',
    selection: 'Selection Fields',
    media: 'Media',
    special: 'Special Fields',
  };

  Object.entries(FIELD_TYPE_META).forEach(([type, meta]) => {
    const category = meta.category;
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push({
      type: type as FieldType,
      label: meta.label,
      icon: meta.icon,
      description: meta.description,
    });
  });

  return { grouped, categoryLabels };
}

// Validate a field value
export function validateField(field: FormField, value: unknown): string | null {
  // Required check
  if (field.required) {
    if (value === undefined || value === null || value === '') {
      return `${field.label} is required`;
    }
  }

  // Skip other validations if value is empty and not required
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const stringValue = String(value);

  // Min/max for text fields
  if (typeof value === 'string') {
    const textField = field as { maxLength?: number; minLength?: number };
    if (textField.minLength && stringValue.length < textField.minLength) {
      return `${field.label} must be at least ${textField.minLength} characters`;
    }
    if (textField.maxLength && stringValue.length > textField.maxLength) {
      return `${field.label} must be at most ${textField.maxLength} characters`;
    }
  }

  // Min/max for number fields
  if (field.type === 'number') {
    const numField = field as { min?: number; max?: number };
    const numValue = Number(value);
    if (!isNaN(numValue)) {
      if (numField.min !== undefined && numValue < numField.min) {
        return `${field.label} must be at least ${numField.min}`;
      }
      if (numField.max !== undefined && numValue > numField.max) {
        return `${field.label} must be at most ${numField.max}`;
      }
    }
  }

  return null;
}

// Generate a unique ID
export function generateId(prefix = 'id'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Format a field value for display
export function formatFieldValue(field: FormField, value: unknown): string {
  if (value === undefined || value === null) return '';

  switch (field.type) {
    case 'date':
      return new Date(value as string).toLocaleDateString();
    case 'time':
      return new Date(value as string).toLocaleTimeString();
    case 'datetime':
      return new Date(value as string).toLocaleString();
    case 'location':
      const loc = value as { latitude: number; longitude: number };
      return `${loc.latitude.toFixed(6)}, ${loc.longitude.toFixed(6)}`;
    case 'checkbox':
      return value ? 'Yes' : 'No';
    case 'select':
    case 'radio':
      if (hasOptions(field)) {
        const option = field.options.find(o => o.value === value);
        return option?.label || String(value);
      }
      return String(value);
    case 'multiselect':
      if (hasOptions(field)) {
        const values = value as string[];
        return values.map(v => {
          const opt = field.options.find(o => o.value === v);
          return opt?.label || v;
        }).join(', ');
      }
      return String(value);
    default:
      return String(value);
  }
}

// Type guard for fields with options
function hasOptions(field: FormField): field is OptionField {
  return ['select', 'multiselect', 'radio', 'checkbox'].includes(field.type);
}

// Color options for field customization
export const COLOR_OPTIONS = [
  { value: '#6366f1', label: 'Indigo' },
  { value: '#8b5cf6', label: 'Violet' },
  { value: '#ec4899', label: 'Pink' },
  { value: '#ef4444', label: 'Red' },
  { value: '#f97316', label: 'Orange' },
  { value: '#eab308', label: 'Yellow' },
  { value: '#22c55e', label: 'Green' },
  { value: '#14b8a6', label: 'Teal' },
  { value: '#06b6d4', label: 'Cyan' },
  { value: '#3b82f6', label: 'Blue' },
  { value: '#64748b', label: 'Slate' },
  { value: '#000000', label: 'Black' },
];

// App color themes
export const APP_THEMES = [
  { primary: '#6366f1', accent: '#8b5cf6', name: 'Indigo' },
  { primary: '#3b82f6', accent: '#06b6d4', name: 'Ocean' },
  { primary: '#22c55e', accent: '#14b8a6', name: 'Forest' },
  { primary: '#f97316', accent: '#eab308', name: 'Sunset' },
  { primary: '#ec4899', accent: '#f43f5e', name: 'Rose' },
  { primary: '#8b5cf6', accent: '#a855f7', name: 'Violet' },
];
