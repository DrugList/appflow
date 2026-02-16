'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Type, Hash, Mail, Phone, Calendar, Clock, MapPin, 
  Scan, PenTool, Camera, ChevronDown, List, CheckSquare, 
  CircleDot, AlignLeft, Link, Upload, Image, CalendarClock,
  GripVertical, Plus
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { FieldType } from '@/types/app-builder';

interface FieldTypeInfo {
  type: FieldType;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const FIELD_TYPES: FieldTypeInfo[] = [
  { type: 'text', label: 'Short Text', icon: <Type className="h-4 w-4" />, description: 'Single line text input' },
  { type: 'textarea', label: 'Long Text', icon: <AlignLeft className="h-4 w-4" />, description: 'Multi-line text area' },
  { type: 'email', label: 'Email', icon: <Mail className="h-4 w-4" />, description: 'Email address with validation' },
  { type: 'phone', label: 'Phone', icon: <Phone className="h-4 w-4" />, description: 'Phone number input' },
  { type: 'number', label: 'Number', icon: <Hash className="h-4 w-4" />, description: 'Numeric input' },
  { type: 'url', label: 'URL', icon: <Link className="h-4 w-4" />, description: 'Website URL' },
  { type: 'date', label: 'Date', icon: <Calendar className="h-4 w-4" />, description: 'Date picker' },
  { type: 'time', label: 'Time', icon: <Clock className="h-4 w-4" />, description: 'Time picker' },
  { type: 'datetime', label: 'Date & Time', icon: <CalendarClock className="h-4 w-4" />, description: 'Date and time picker' },
  { type: 'select', label: 'Dropdown', icon: <ChevronDown className="h-4 w-4" />, description: 'Single select dropdown' },
  { type: 'multiselect', label: 'Multi-Select', icon: <List className="h-4 w-4" />, description: 'Multiple select options' },
  { type: 'radio', label: 'Radio', icon: <CircleDot className="h-4 w-4" />, description: 'Single choice radio buttons' },
  { type: 'checkbox', label: 'Checkbox', icon: <CheckSquare className="h-4 w-4" />, description: 'Checkbox option' },
  { type: 'location', label: 'Location', icon: <MapPin className="h-4 w-4" />, description: 'GPS location capture' },
  { type: 'barcode', label: 'Barcode/QR', icon: <Scan className="h-4 w-4" />, description: 'Scan barcodes & QR codes' },
  { type: 'photo', label: 'Photo', icon: <Camera className="h-4 w-4" />, description: 'Capture or upload photo' },
  { type: 'signature', label: 'Signature', icon: <PenTool className="h-4 w-4" />, description: 'Digital signature pad' },
  { type: 'file', label: 'File Upload', icon: <Upload className="h-4 w-4" />, description: 'Upload files' },
];

const CATEGORIES = [
  { name: 'Text & Numbers', types: ['text', 'textarea', 'email', 'phone', 'number', 'url'] },
  { name: 'Date & Time', types: ['date', 'time', 'datetime'] },
  { name: 'Choice', types: ['select', 'multiselect', 'radio', 'checkbox'] },
  { name: 'Media', types: ['photo', 'file', 'signature'] },
  { name: 'Special', types: ['location', 'barcode'] },
];

interface FieldPaletteProps {
  onAddField: (type: FieldType) => void;
}

export function FieldPalette({ onAddField }: FieldPaletteProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>('Text & Numbers');
  const [draggedType, setDraggedType] = useState<FieldType | null>(null);

  const handleDragStart = (type: FieldType) => {
    setDraggedType(type);
    // Set drag data for drop target
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('draggedFieldType', type);
    }
  };

  const handleDragEnd = () => {
    setDraggedType(null);
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem('draggedFieldType');
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h3 className="font-semibold text-sm">Add Field</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Drag or click to add fields
        </p>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-2">
          {CATEGORIES.map((category) => (
            <div key={category.name} className="mb-2">
              <button
                onClick={() => setExpandedCategory(
                  expandedCategory === category.name ? null : category.name
                )}
                className="w-full flex items-center justify-between p-2 text-sm font-medium rounded-md hover:bg-muted/50 transition-colors"
              >
                <span>{category.name}</span>
                <motion.div
                  animate={{ rotate: expandedCategory === category.name ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </motion.div>
              </button>
              
              <AnimatePresence>
                {expandedCategory === category.name && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="grid grid-cols-2 gap-1.5 p-1">
                      {FIELD_TYPES
                        .filter((f) => category.types.includes(f.type))
                        .map((field) => (
                          <motion.div
                            key={field.type}
                            draggable
                            onDragStart={() => handleDragStart(field.type)}
                            onDragEnd={handleDragEnd}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={cn(
                              "cursor-pointer select-none",
                              draggedType === field.type && "opacity-50"
                            )}
                          >
                            <Card
                              className="p-2 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-grab active:cursor-grabbing"
                              onClick={() => onAddField(field.type)}
                            >
                              <div className="flex flex-col items-center gap-1 text-center">
                                <div className="p-1.5 rounded-md bg-muted">
                                  {field.icon}
                                </div>
                                <span className="text-xs font-medium truncate w-full">
                                  {field.label}
                                </span>
                              </div>
                            </Card>
                          </motion.div>
                        ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
