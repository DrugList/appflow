'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, Sparkles, Layout, FileText, Users, CheckSquare, 
  ShoppingBag, Camera, Calendar, MapPin, ClipboardList, Database
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface CreateAppModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateApp: (data: { 
    name: string; 
    description?: string; 
    icon?: string; 
    iconColor?: string;
    templateId?: string;
  }) => void;
}

const APP_TEMPLATES = [
  {
    id: 'blank',
    name: 'Blank App',
    description: 'Start from scratch',
    icon: Layout,
    iconColor: '#6B7280',
    fields: [],
  },
  {
    id: 'contact',
    name: 'Contact Directory',
    description: 'Manage contacts and info',
    icon: Users,
    iconColor: '#3B82F6',
    fields: [
      { type: 'text', label: 'Name', required: true },
      { type: 'email', label: 'Email' },
      { type: 'phone', label: 'Phone' },
      { type: 'text', label: 'Company' },
    ],
  },
  {
    id: 'task',
    name: 'Task Manager',
    description: 'Track tasks and progress',
    icon: CheckSquare,
    iconColor: '#10B981',
    fields: [
      { type: 'text', label: 'Task Name', required: true },
      { type: 'textarea', label: 'Description' },
      { type: 'select', label: 'Status', options: ['To Do', 'In Progress', 'Done'] },
      { type: 'date', label: 'Due Date' },
    ],
  },
  {
    id: 'inventory',
    name: 'Inventory Tracker',
    description: 'Track products and stock',
    icon: ShoppingBag,
    iconColor: '#F59E0B',
    fields: [
      { type: 'text', label: 'Product Name', required: true },
      { type: 'number', label: 'Quantity' },
      { type: 'number', label: 'Price' },
      { type: 'barcode', label: 'SKU/Barcode' },
      { type: 'photo', label: 'Photo' },
    ],
  },
  {
    id: 'inspection',
    name: 'Inspection Form',
    description: 'Quality checks & audits',
    icon: ClipboardList,
    iconColor: '#8B5CF6',
    fields: [
      { type: 'text', label: 'Inspection Title', required: true },
      { type: 'location', label: 'Location' },
      { type: 'checkbox', label: 'Passed Inspection' },
      { type: 'photo', label: 'Photo Evidence' },
      { type: 'signature', label: 'Inspector Signature' },
    ],
  },
  {
    id: 'event',
    name: 'Event Registration',
    description: 'Manage event sign-ups',
    icon: Calendar,
    iconColor: '#EC4899',
    fields: [
      { type: 'text', label: 'Full Name', required: true },
      { type: 'email', label: 'Email', required: true },
      { type: 'phone', label: 'Phone' },
      { type: 'select', label: 'Ticket Type', options: ['Standard', 'VIP', 'Early Bird'] },
    ],
  },
  {
    id: 'fieldwork',
    name: 'Field Data Collection',
    description: 'Collect data on the go',
    icon: MapPin,
    iconColor: '#06B6D4',
    fields: [
      { type: 'text', label: 'Title', required: true },
      { type: 'location', label: 'GPS Location' },
      { type: 'photo', label: 'Photo' },
      { type: 'textarea', label: 'Notes' },
      { type: 'datetime', label: 'Timestamp' },
    ],
  },
];

const ICONS = ['📱', '📋', '📊', '📝', '🗂️', '💼', '🏠', '🛒', '📚', '🎨', '🔧', '⚡', '🎯', '💬', '📅'];
const COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', 
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
];

export function CreateAppModal({ open, onOpenChange, onCreateApp }: CreateAppModalProps) {
  const [step, setStep] = useState<'template' | 'details'>('template');
  const [selectedTemplate, setSelectedTemplate] = useState(APP_TEMPLATES[0]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('📱');
  const [iconColor, setIconColor] = useState('#3B82F6');

  const handleSelectTemplate = (template: typeof APP_TEMPLATES[0]) => {
    setSelectedTemplate(template);
    setIconColor(template.iconColor);
    if (template.id !== 'blank') {
      setName(template.name);
    } else {
      setName('');
    }
  };

  const handleContinue = () => {
    if (step === 'template') {
      setStep('details');
    } else {
      onCreateApp({
        name: name || 'My App',
        description,
        icon,
        iconColor,
        templateId: selectedTemplate.id,
      });
      resetForm();
    }
  };

  const handleBack = () => {
    setStep('template');
  };

  const resetForm = () => {
    setStep('template');
    setSelectedTemplate(APP_TEMPLATES[0]);
    setName('');
    setDescription('');
    setIcon('📱');
    setIconColor('#3B82F6');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen ? resetForm() : onOpenChange(isOpen)}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Create New App
          </DialogTitle>
          <DialogDescription>
            {step === 'template' 
              ? 'Choose a template to get started quickly' 
              : 'Customize your app details'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {step === 'template' ? (
              <motion.div
                key="template"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="h-full"
              >
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 py-4">
                  {APP_TEMPLATES.map((template) => {
                    const Icon = template.icon;
                    const isSelected = selectedTemplate.id === template.id;
                    
                    return (
                      <Card
                        key={template.id}
                        className={cn(
                          "p-4 cursor-pointer transition-all hover:shadow-md",
                          isSelected && "ring-2 ring-primary bg-primary/5"
                        )}
                        onClick={() => handleSelectTemplate(template)}
                      >
                        <div className="flex flex-col items-center text-center">
                          <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center mb-2"
                            style={{ backgroundColor: template.iconColor + '20' }}
                          >
                            <Icon className="h-6 w-6" style={{ color: template.iconColor }} />
                          </div>
                          <h4 className="font-medium text-sm">{template.name}</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            {template.description}
                          </p>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="details"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4 py-4"
              >
                {/* App Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">App Name</Label>
                  <Input
                    id="name"
                    placeholder="My Awesome App"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="What does this app do?"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                  />
                </div>

                {/* Icon Selection */}
                <div className="space-y-2">
                  <Label>Icon</Label>
                  <div className="flex flex-wrap gap-2">
                    {ICONS.map((i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setIcon(i)}
                        className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center text-lg transition-all",
                          icon === i 
                            ? "ring-2 ring-primary ring-offset-2 scale-110" 
                            : "bg-muted hover:bg-muted/80"
                        )}
                      >
                        {i}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Selection */}
                <div className="space-y-2">
                  <Label>Color</Label>
                  <div className="flex flex-wrap gap-2">
                    {COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setIconColor(color)}
                        className={cn(
                          "w-8 h-8 rounded-full transition-all",
                          iconColor === color && "ring-2 ring-offset-2 ring-primary scale-110"
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                {/* Preview */}
                <div className="pt-4 border-t">
                  <Label className="text-sm text-muted-foreground">Preview</Label>
                  <div className="flex items-center gap-3 mt-2">
                    <div
                      className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl shadow-sm"
                      style={{ backgroundColor: iconColor }}
                    >
                      {icon}
                    </div>
                    <div>
                      <h4 className="font-semibold">{name || 'My App'}</h4>
                      <p className="text-sm text-muted-foreground">
                        {description || 'No description'}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex justify-between pt-4 border-t">
          {step === 'template' ? (
            <div />
          ) : (
            <Button variant="outline" onClick={handleBack}>
              Back
            </Button>
          )}
          <Button onClick={handleContinue} className="gap-2">
            {step === 'template' ? (
              <>
                Continue
                <ArrowRight className="h-4 w-4" />
              </>
            ) : (
              <>
                Create App
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
