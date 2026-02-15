'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, Trash2, Plus, X, ChevronUp, ChevronDown,
  Palette, Eye, EyeOff, Lock, Unlock
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { FormField, OptionField, NumberField, TextField } from '@/types/app-builder';
import { FieldType } from '@/types/app-builder';

interface PropertyPanelProps {
  field: FormField | null;
  onUpdateField: (fieldId: string, updates: Partial<FormField>) => void;
  onRemoveField: (fieldId: string) => void;
}

export function PropertyPanel({ field, onUpdateField, onRemoveField }: PropertyPanelProps) {
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    validation: true,
    appearance: false,
  });

  if (!field) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-sm">Field Properties</h3>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <Settings className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
            <p className="text-sm text-muted-foreground">
              Select a field to edit its properties
            </p>
          </div>
        </div>
      </div>
    );
  }

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleUpdate = (updates: Partial<FormField>) => {
    onUpdateField(field.id, updates);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">Field Properties</h3>
          <Badge variant="outline" className="text-xs capitalize">
            {field.type.replace('_', ' ')}
          </Badge>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Basic Properties */}
          <PropertySection
            title="Basic"
            expanded={expandedSections.basic}
            onToggle={() => toggleSection('basic')}
          >
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Label</Label>
                <Input
                  value={field.label}
                  onChange={(e) => handleUpdate({ label: e.target.value })}
                  className="h-8 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Placeholder</Label>
                <Input
                  value={field.placeholder || ''}
                  onChange={(e) => handleUpdate({ placeholder: e.target.value })}
                  placeholder="Enter placeholder text..."
                  className="h-8 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Description</Label>
                <Textarea
                  value={field.description || ''}
                  onChange={(e) => handleUpdate({ description: e.target.value })}
                  placeholder="Help text shown below the field..."
                  className="min-h-[60px] text-sm"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {field.required ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                  <Label className="text-xs">Required field</Label>
                </div>
                <Switch
                  checked={field.required || false}
                  onCheckedChange={(checked) => handleUpdate({ required: checked })}
                />
              </div>
            </div>
          </PropertySection>

          {/* Validation Rules */}
          <PropertySection
            title="Validation"
            expanded={expandedSections.validation}
            onToggle={() => toggleSection('validation')}
          >
            <ValidationSettings field={field} onUpdate={handleUpdate} />
          </PropertySection>

          {/* Options for select/radio/checkbox */}
          {(['select', 'multiselect', 'radio'] as FieldType[]).includes(field.type) && (
            <PropertySection
              title="Options"
              expanded={true}
              onToggle={() => {}}
            >
              <OptionsEditor 
                field={field as OptionField} 
                onUpdate={handleUpdate} 
              />
            </PropertySection>
          )}

          {/* Appearance */}
          <PropertySection
            title="Appearance"
            expanded={expandedSections.appearance}
            onToggle={() => toggleSection('appearance')}
          >
            <AppearanceSettings field={field} onUpdate={handleUpdate} />
          </PropertySection>

          {/* Danger Zone */}
          <Card className="p-3 border-destructive/50 bg-destructive/5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-destructive">Delete Field</p>
                <p className="text-xs text-muted-foreground">
                  This action cannot be undone
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onRemoveField(field.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
}

// Collapsible section component
interface PropertySectionProps {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function PropertySection({ title, expanded, onToggle, children }: PropertySectionProps) {
  return (
    <Card className="overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
      >
        <span className="text-sm font-medium">{title}</span>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-3 pt-0 border-t">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

// Validation settings based on field type
function ValidationSettings({ 
  field, 
  onUpdate 
}: { 
  field: FormField; 
  onUpdate: (updates: Partial<FormField>) => void;
}) {
  // Text field validation
  if (['text', 'textarea', 'email', 'phone', 'url'].includes(field.type)) {
    const textField = field as TextField;
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Min Length</Label>
            <Input
              type="number"
              value={textField.minLength || ''}
              onChange={(e) => onUpdate({ minLength: parseInt(e.target.value) || undefined })}
              placeholder="0"
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Max Length</Label>
            <Input
              type="number"
              value={textField.maxLength || ''}
              onChange={(e) => onUpdate({ maxLength: parseInt(e.target.value) || undefined })}
              placeholder="∞"
              className="h-8 text-sm"
            />
          </div>
        </div>
        {field.type === 'text' && (
          <div className="space-y-1.5">
            <Label className="text-xs">Pattern (Regex)</Label>
            <Input
              value={textField.pattern || ''}
              onChange={(e) => onUpdate({ pattern: e.target.value })}
              placeholder="e.g., ^[A-Za-z]+$"
              className="h-8 text-sm font-mono"
            />
          </div>
        )}
      </div>
    );
  }

  // Number field validation
  if (field.type === 'number') {
    const numberField = field as NumberField;
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Minimum</Label>
            <Input
              type="number"
              value={numberField.min || ''}
              onChange={(e) => onUpdate({ min: parseFloat(e.target.value) || undefined })}
              placeholder="No limit"
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Maximum</Label>
            <Input
              type="number"
              value={numberField.max || ''}
              onChange={(e) => onUpdate({ max: parseFloat(e.target.value) || undefined })}
              placeholder="No limit"
              className="h-8 text-sm"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Step</Label>
          <Input
            type="number"
            value={numberField.step || 1}
            onChange={(e) => onUpdate({ step: parseFloat(e.target.value) || 1 })}
            placeholder="1"
            className="h-8 text-sm"
          />
        </div>
      </div>
    );
  }

  // Default validation message
  return (
    <p className="text-xs text-muted-foreground">
      No additional validation options for this field type.
    </p>
  );
}

// Options editor for select/radio/checkbox
function OptionsEditor({ 
  field, 
  onUpdate 
}: { 
  field: OptionField; 
  onUpdate: (updates: Partial<FormField>) => void;
}) {
  const options = field.options || [];

  const addOption = () => {
    const newOption = {
      label: `Option ${options.length + 1}`,
      value: `option${options.length + 1}`,
    };
    onUpdate({ options: [...options, newOption] });
  };

  const updateOption = (index: number, label: string, value: string) => {
    const newOptions = [...options];
    newOptions[index] = { label, value };
    onUpdate({ options: newOptions });
  };

  const removeOption = (index: number) => {
    const newOptions = options.filter((_, i) => i !== index);
    onUpdate({ options: newOptions });
  };

  return (
    <div className="space-y-2">
      {options.map((option, index) => (
        <div key={index} className="flex items-center gap-2">
          <Input
            value={option.label}
            onChange={(e) => updateOption(index, e.target.value, option.value)}
            placeholder="Label"
            className="h-8 text-sm flex-1"
          />
          <Input
            value={option.value}
            onChange={(e) => updateOption(index, option.label, e.target.value)}
            placeholder="Value"
            className="h-8 text-sm w-24"
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => removeOption(index)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={addOption}
      >
        <Plus className="h-4 w-4 mr-1" />
        Add Option
      </Button>
    </div>
  );
}

// Appearance settings
function AppearanceSettings({ 
  field, 
  onUpdate 
}: { 
  field: FormField; 
  onUpdate: (updates: Partial<FormField>) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-xs">Default Value</Label>
        <Input
          value={(field.defaultValue as string) || ''}
          onChange={(e) => onUpdate({ defaultValue: e.target.value })}
          placeholder="Default value..."
          className="h-8 text-sm"
        />
      </div>
      
      {/* Field-specific appearance */}
      {field.type === 'signature' && (
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Pen Color</Label>
            <Input
              type="color"
              value={(field as { penColor?: string }).penColor || '#000000'}
              onChange={(e) => onUpdate({ penColor: e.target.value })}
              className="h-8 w-full"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Background</Label>
            <Input
              type="color"
              value={(field as { backgroundColor?: string }).backgroundColor || '#ffffff'}
              onChange={(e) => onUpdate({ backgroundColor: e.target.value })}
              className="h-8 w-full"
            />
          </div>
        </div>
      )}

      {field.type === 'textarea' && (
        <div className="space-y-1.5">
          <Label className="text-xs">Rows</Label>
          <Input
            type="number"
            value={(field as { rows?: number }).rows || 4}
            onChange={(e) => onUpdate({ rows: parseInt(e.target.value) || 4 })}
            className="h-8 text-sm"
          />
        </div>
      )}
    </div>
  );
}
