// Field Types available in the form builder
export type FieldType = 
  | 'text' 
  | 'email' 
  | 'phone' 
  | 'number' 
  | 'date' 
  | 'time'
  | 'datetime'
  | 'location' 
  | 'barcode' 
  | 'signature' 
  | 'photo' 
  | 'select' 
  | 'multiselect'
  | 'checkbox' 
  | 'radio' 
  | 'textarea'
  | 'url'
  | 'file';

// Base field configuration
export interface BaseField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  required?: boolean;
  description?: string;
  defaultValue?: string | number | boolean;
}

// Text-based field
export interface TextField extends BaseField {
  type: 'text' | 'email' | 'phone' | 'url';
  maxLength?: number;
  minLength?: number;
  pattern?: string;
}

// Number field
export interface NumberField extends BaseField {
  type: 'number';
  min?: number;
  max?: number;
  step?: number;
}

// Date/Time fields
export interface DateField extends BaseField {
  type: 'date' | 'time' | 'datetime';
  min?: string;
  max?: string;
}

// Location field
export interface LocationField extends BaseField {
  type: 'location';
  captureCurrentLocation?: boolean;
}

// Barcode field
export interface BarcodeField extends BaseField {
  type: 'barcode';
  formats?: ('qr' | 'code128' | 'code39' | 'ean13' | 'upc')[];
}

// Signature field
export interface SignatureField extends BaseField {
  type: 'signature';
  penColor?: string;
  backgroundColor?: string;
}

// Photo field
export interface PhotoField extends BaseField {
  type: 'photo';
  allowGallery?: boolean;
  allowCamera?: boolean;
  maxWidth?: number;
  maxHeight?: number;
}

// Select/Radio/Checkbox fields with options
export interface OptionField extends BaseField {
  type: 'select' | 'multiselect' | 'radio' | 'checkbox';
  options: { label: string; value: string }[];
}

// Textarea field
export interface TextareaField extends BaseField {
  type: 'textarea';
  rows?: number;
  maxLength?: number;
}

// File field
export interface FileField extends BaseField {
  type: 'file';
  accept?: string;
  maxSize?: number;
  multiple?: boolean;
}

// Union type for all fields
export type FormField = 
  | TextField 
  | NumberField 
  | DateField 
  | LocationField 
  | BarcodeField 
  | SignatureField 
  | PhotoField 
  | OptionField 
  | TextareaField 
  | FileField;

// View type for displaying data
export type ViewType = 'form' | 'table' | 'cards' | 'list' | 'map' | 'calendar';

// View configuration
export interface ViewConfig {
  id: string;
  name: string;
  type: ViewType;
  fields: string[]; // Field IDs to show in this view
  filters?: ViewFilter[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Filter configuration
export interface ViewFilter {
  fieldId: string;
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan' | 'isEmpty' | 'isNotEmpty';
  value: string;
}

// Data source type
export type DataSourceType = 'local' | 'google_sheets' | 'api' | 'airtable' | 'supabase';

// Data source configuration
export interface DataSource {
  id: string;
  name: string;
  type: DataSourceType;
  config: {
    // Google Sheets
    spreadsheetId?: string;
    sheetName?: string;
    apiKey?: string;
    // API
    url?: string;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    headers?: Record<string, string>;
    // Common
    refreshToken?: string;
  };
}

// App settings
export interface AppSettings {
  primaryColor?: string;
  accentColor?: string;
  logo?: string;
  favicon?: string;
  darkMode?: 'light' | 'dark' | 'system';
  publicAccess?: boolean;
  requireAuth?: boolean;
  allowOffline?: boolean;
  notifications?: {
    email?: boolean;
    push?: boolean;
    sms?: boolean;
  };
}

// Complete app schema
export interface AppSchema {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  iconColor?: string;
  version: string;
  fields: FormField[];
  views: ViewConfig[];
  dataSource?: DataSource;
  settings?: AppSettings;
  workflows?: Workflow[];
  createdAt: string;
  updatedAt: string;
}

// Workflow for automation
export interface Workflow {
  id: string;
  name: string;
  trigger: WorkflowTrigger;
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
  enabled: boolean;
}

export interface WorkflowTrigger {
  type: 'form_submit' | 'field_change' | 'schedule' | 'webhook';
  config?: Record<string, unknown>;
}

export interface WorkflowCondition {
  fieldId: string;
  operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan';
  value: string;
}

export interface WorkflowAction {
  type: 'email' | 'sms' | 'push' | 'webhook' | 'update_field' | 'create_record';
  config: Record<string, unknown>;
}

// Form submission data
export interface FormSubmission {
  recordId?: string;
  data: Record<string, unknown>;
  submittedAt: string;
  submittedBy?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

// PWA Status
export interface PWAStatus {
  isInstalled: boolean;
  isOnline: boolean;
  canInstall: boolean;
  registration?: ServiceWorkerRegistration;
}

// Field category for UI grouping
export interface FieldCategory {
  name: string;
  icon: string;
  fields: { type: FieldType; label: string; icon: string }[];
}

// Default field categories
export const FIELD_CATEGORIES: FieldCategory[] = [
  {
    name: 'Text & Numbers',
    icon: 'Type',
    fields: [
      { type: 'text', label: 'Short Text', icon: 'Text' },
      { type: 'textarea', label: 'Long Text', icon: 'AlignLeft' },
      { type: 'email', label: 'Email', icon: 'Mail' },
      { type: 'phone', label: 'Phone', icon: 'Phone' },
      { type: 'number', label: 'Number', icon: 'Hash' },
      { type: 'url', label: 'URL', icon: 'Link' },
    ],
  },
  {
    name: 'Date & Time',
    icon: 'Calendar',
    fields: [
      { type: 'date', label: 'Date', icon: 'Calendar' },
      { type: 'time', label: 'Time', icon: 'Clock' },
      { type: 'datetime', label: 'Date & Time', icon: 'CalendarClock' },
    ],
  },
  {
    name: 'Choice',
    icon: 'CheckSquare',
    fields: [
      { type: 'select', label: 'Dropdown', icon: 'ChevronDown' },
      { type: 'multiselect', label: 'Multi-Select', icon: 'List' },
      { type: 'radio', label: 'Radio', icon: 'CircleDot' },
      { type: 'checkbox', label: 'Checkbox', icon: 'CheckSquare' },
    ],
  },
  {
    name: 'Media',
    icon: 'Image',
    fields: [
      { type: 'photo', label: 'Photo', icon: 'Camera' },
      { type: 'file', label: 'File Upload', icon: 'Upload' },
      { type: 'signature', label: 'Signature', icon: 'PenTool' },
    ],
  },
  {
    name: 'Special',
    icon: 'MapPin',
    fields: [
      { type: 'location', label: 'Location', icon: 'MapPin' },
      { type: 'barcode', label: 'Barcode/QR', icon: 'Scan' },
    ],
  },
];

// Helper function to create a new field
export function createField(type: FieldType): FormField {
  const id = `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const base: BaseField = {
    id,
    type,
    label: getDefaultLabel(type),
    required: false,
  };

  switch (type) {
    case 'text':
    case 'email':
    case 'phone':
    case 'url':
      return { ...base, type } as TextField;
    case 'number':
      return { ...base, type, step: 1 } as NumberField;
    case 'date':
    case 'time':
    case 'datetime':
      return { ...base, type } as DateField;
    case 'location':
      return { ...base, type, captureCurrentLocation: true } as LocationField;
    case 'barcode':
      return { ...base, type, formats: ['qr', 'code128'] } as BarcodeField;
    case 'signature':
      return { ...base, type, penColor: '#000000', backgroundColor: '#ffffff' } as SignatureField;
    case 'photo':
      return { ...base, type, allowCamera: true, allowGallery: true } as PhotoField;
    case 'select':
    case 'multiselect':
    case 'radio':
    case 'checkbox':
      return { ...base, type, options: [{ label: 'Option 1', value: 'option1' }] } as OptionField;
    case 'textarea':
      return { ...base, type, rows: 4 } as TextareaField;
    case 'file':
      return { ...base, type, multiple: false } as FileField;
    default:
      return base as FormField;
  }
}

function getDefaultLabel(type: FieldType): string {
  const labels: Record<FieldType, string> = {
    text: 'Short Text',
    email: 'Email Address',
    phone: 'Phone Number',
    number: 'Number',
    date: 'Date',
    time: 'Time',
    datetime: 'Date & Time',
    location: 'Location',
    barcode: 'Barcode/QR Code',
    signature: 'Signature',
    photo: 'Photo',
    select: 'Dropdown',
    multiselect: 'Multi-Select',
    checkbox: 'Checkbox',
    radio: 'Radio Choice',
    textarea: 'Long Text',
    url: 'Website URL',
    file: 'File Upload',
  };
  return labels[type];
}
