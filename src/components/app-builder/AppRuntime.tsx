'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import {
  ArrowLeft, Moon, Sun, Plus, Heart, HeartOff, Grid, List,
  RefreshCw, Filter, SortAsc, Search, Loader2, MapPin, Camera,
  PenTool, Scan, Upload, Check, X, Clock, Calendar, Hash,
  Mail, Phone, Link as LinkIcon, FileText, ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { FormField, FieldType, AppSchema, ViewConfig } from '@/types/app-builder';

interface AppRuntimeProps {
  app: {
    id: string;
    name: string;
    description: string | null;
    icon: string | null;
    iconColor: string;
    schema: string;
    published: boolean;
  };
  onBack: () => void;
}

interface Record {
  id: string;
  appId: string;
  data: Record<string, unknown>;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export function AppRuntime({ app, onBack }: AppRuntimeProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);

  // Parse app schema
  const schema: AppSchema = {
    id: app.id,
    name: app.name,
    description: app.description || '',
    icon: app.icon || '📱',
    iconColor: app.iconColor,
    version: '1.0.0',
    fields: JSON.parse(app.schema).fields || [],
    views: JSON.parse(app.schema).views || [],
    settings: JSON.parse(app.schema).settings,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const fields = schema.fields;
  const primaryColor = schema.settings?.primaryColor || app.iconColor;

  useEffect(() => {
    setMounted(true);
    fetchRecords();
  }, [app.id]);

  // Pull to refresh
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (container.scrollTop === 0) {
        touchStartY.current = e.touches[0].clientY;
        setIsPulling(true);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling) return;
      const deltaY = e.touches[0].clientY - touchStartY.current;
      if (deltaY > 0 && container.scrollTop === 0) {
        setPullDistance(Math.min(deltaY, 100));
      }
    };

    const handleTouchEnd = () => {
      if (pullDistance > 80) {
        fetchRecords();
      }
      setPullDistance(0);
      setIsPulling(false);
    };

    container.addEventListener('touchstart', handleTouchStart);
    container.addEventListener('touchmove', handleTouchMove);
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isPulling, pullDistance]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/apps/${app.id}/records`);
      if (response.ok) {
        const data = await response.json();
        setRecords(data.records || []);
        setLastRefresh(new Date());
      }
    } catch (error) {
      console.error('Failed to fetch records:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (formData: Record<string, unknown>) => {
    setSubmitting(true);
    try {
      const response = await fetch(`/api/apps/${app.id}/records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: formData }),
      });

      if (response.ok) {
        const data = await response.json();
        setRecords([data.record, ...records]);
        setShowForm(false);
        toast.success('Record saved successfully');
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Failed to save record');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleFavorite = async (recordId: string) => {
    try {
      const response = await fetch(`/api/apps/${app.id}/records/${recordId}/favorite`, {
        method: 'POST',
      });

      if (response.ok) {
        setRecords(records.map(r =>
          r.id === recordId ? { ...r, isFavorite: !r.isFavorite } : r
        ));
      }
    } catch (error) {
      console.error('Favorite error:', error);
      toast.error('Failed to update favorite');
    }
  };

  // Filter records
  const filteredRecords = records.filter(record => {
    const matchesSearch = searchQuery === '' || 
      Object.values(record.data).some(val =>
        String(val).toLowerCase().includes(searchQuery.toLowerCase())
      );
    const matchesFavorites = !showFavorites || record.isFavorite;
    return matchesSearch && matchesFavorites;
  });

  // Get time since last refresh
  const getTimeSinceRefresh = () => {
    if (!lastRefresh) return 'Never refreshed';
    const seconds = Math.floor((Date.now() - lastRefresh.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: primaryColor }} />
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="min-h-screen bg-background overflow-auto"
      style={{ ['--primary' as string]: primaryColor }}
    >
      {/* Pull to refresh indicator */}
      <motion.div
        className="fixed top-0 left-0 right-0 flex justify-center py-4 pointer-events-none z-50"
        animate={{ y: pullDistance > 0 ? pullDistance / 2 : -50, opacity: pullDistance > 0 ? 1 : 0 }}
      >
        <RefreshCw className={cn("h-6 w-6", pullDistance > 80 && "animate-spin")} style={{ color: primaryColor }} />
      </motion.div>

      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-xl">{app.icon || '📱'}</span>
              <span className="font-semibold truncate max-w-[150px]">{app.name}</span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            <div className="flex items-center border rounded-lg p-1">
              <Button
                variant={viewMode === 'cards' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-7 w-7"
                onClick={() => setViewMode('cards')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-7 w-7"
                onClick={() => setViewMode('table')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-4">
        {/* Search and Filter */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search records..."
              className="pl-10"
            />
          </div>
          <Button
            variant={showFavorites ? 'default' : 'outline'}
            onClick={() => setShowFavorites(!showFavorites)}
          >
            {showFavorites ? <Heart className="h-4 w-4 fill-current" /> : <HeartOff className="h-4 w-4" />}
          </Button>
          <Button variant="outline" size="icon" onClick={fetchRecords}>
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
        </div>

        {/* Data freshness indicator */}
        <div className="flex items-center justify-between mb-4 text-sm text-muted-foreground">
          <span>
            {filteredRecords.length} record{filteredRecords.length !== 1 ? 's' : ''}
            {showFavorites && ' (favorites)'}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {getTimeSinceRefresh()}
          </span>
        </div>

        {/* Records Display */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin" style={{ color: primaryColor }} />
          </div>
        ) : fields.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-4">This app has no fields configured</p>
            <Button variant="outline" onClick={onBack}>
              Edit App
            </Button>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">
              {showFavorites ? 'No favorite records yet' : 'No records yet'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Tap the + button to add your first record
            </p>
          </div>
        ) : viewMode === 'cards' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {filteredRecords.map((record, index) => (
                <motion.div
                  key={record.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <RecordCard
                    record={record}
                    fields={fields}
                    isFavorite={record.isFavorite}
                    onToggleFavorite={() => toggleFavorite(record.id)}
                    primaryColor={primaryColor}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <RecordTable
            records={filteredRecords}
            fields={fields}
            onToggleFavorite={toggleFavorite}
            primaryColor={primaryColor}
          />
        )}
      </main>

      {/* Floating Action Button */}
      {fields.length > 0 && (
        <motion.div
          className="fixed bottom-6 right-6 z-50"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        >
          <Button
            size="lg"
            className="h-14 w-14 rounded-full shadow-lg"
            style={{ backgroundColor: primaryColor }}
            onClick={() => setShowForm(true)}
          >
            <Plus className="h-6 w-6" />
          </Button>
        </motion.div>
      )}

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>{app.icon}</span>
              Add New Record
            </DialogTitle>
            <DialogDescription>
              Fill in the form below to add a new record
            </DialogDescription>
          </DialogHeader>

          <RecordForm
            fields={fields}
            onSubmit={handleSubmit}
            submitting={submitting}
            onCancel={() => setShowForm(false)}
            primaryColor={primaryColor}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Record Card Component
function RecordCard({ record, fields, isFavorite, onToggleFavorite, primaryColor }: {
  record: Record;
  fields: FormField[];
  isFavorite: boolean;
  onToggleFavorite: () => void;
  primaryColor: string;
}) {
  const displayFields = fields.slice(0, 4);

  return (
    <Card className="group relative">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-base">
            {String(record.data[fields[0]?.id] || 'Untitled')}
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={onToggleFavorite}
          >
            {isFavorite ? (
              <Heart className="h-4 w-4 fill-red-500 text-red-500" />
            ) : (
              <Heart className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {displayFields.slice(1).map((field) => (
            <div key={field.id} className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">{field.label}:</span>
              <span className="truncate">
                {formatFieldValue(record.data[field.id], field.type)}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-3 text-xs text-muted-foreground">
          {new Date(record.createdAt).toLocaleDateString()}
        </div>
      </CardContent>
    </Card>
  );
}

// Record Table Component
function RecordTable({ records, fields, onToggleFavorite, primaryColor }: {
  records: Record[];
  fields: FormField[];
  onToggleFavorite: (id: string) => void;
  primaryColor: string;
}) {
  const displayFields = fields.slice(0, 5);

  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="p-3 text-left text-sm font-medium"></th>
              {displayFields.map((field) => (
                <th key={field.id} className="p-3 text-left text-sm font-medium">
                  {field.label}
                </th>
              ))}
              <th className="p-3 text-left text-sm font-medium">Created</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.id} className="border-b hover:bg-muted/50">
                <td className="p-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => onToggleFavorite(record.id)}
                  >
                    {record.isFavorite ? (
                      <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                    ) : (
                      <Heart className="h-4 w-4" />
                    )}
                  </Button>
                </td>
                {displayFields.map((field) => (
                  <td key={field.id} className="p-3 text-sm">
                    <span className="truncate max-w-[200px] block">
                      {formatFieldValue(record.data[field.id], field.type)}
                    </span>
                  </td>
                ))}
                <td className="p-3 text-sm text-muted-foreground">
                  {new Date(record.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// Record Form Component
function RecordForm({ fields, onSubmit, submitting, onCancel, primaryColor }: {
  fields: FormField[];
  onSubmit: (data: Record<string, unknown>) => void;
  submitting: boolean;
  onCancel: () => void;
  primaryColor: string;
}) {
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateField = (fieldId: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
    setErrors(prev => ({ ...prev, [fieldId]: '' }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    fields.forEach(field => {
      if (field.required && !formData[field.id]) {
        newErrors[field.id] = 'This field is required';
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <div className="space-y-4 mt-4">
      {fields.map((field) => (
        <div key={field.id} className="space-y-2">
          <Label htmlFor={field.id} className="flex items-center gap-1">
            {field.label}
            {field.required && <span className="text-red-500">*</span>}
          </Label>
          <FormFieldInput
            field={field}
            value={formData[field.id]}
            onChange={(value) => updateField(field.id, value)}
            error={errors[field.id]}
            primaryColor={primaryColor}
          />
          {field.description && (
            <p className="text-xs text-muted-foreground">{field.description}</p>
          )}
        </div>
      ))}

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={submitting} style={{ backgroundColor: primaryColor }}>
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Check className="h-4 w-4 mr-2" />
              Save Record
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// Form Field Input Component
function FormFieldInput({ field, value, onChange, error, primaryColor }: {
  field: FormField;
  value: unknown;
  onChange: (value: unknown) => void;
  error?: string;
  primaryColor: string;
}) {
  switch (field.type) {
    case 'text':
    case 'email':
    case 'phone':
    case 'url':
      return (
        <Input
          id={field.id}
          type={field.type === 'text' ? 'text' : field.type}
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className={error ? 'border-red-500' : ''}
        />
      );

    case 'number':
      return (
        <Input
          id={field.id}
          type="number"
          value={(value as number) || ''}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
          placeholder={field.placeholder}
          min={(field as { min?: number }).min}
          max={(field as { max?: number }).max}
          step={(field as { step?: number }).step || 1}
          className={error ? 'border-red-500' : ''}
        />
      );

    case 'textarea':
      return (
        <Textarea
          id={field.id}
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          rows={(field as { rows?: number }).rows || 4}
          className={error ? 'border-red-500' : ''}
        />
      );

    case 'date':
      return (
        <Input
          id={field.id}
          type="date"
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value)}
          className={error ? 'border-red-500' : ''}
        />
      );

    case 'time':
      return (
        <Input
          id={field.id}
          type="time"
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value)}
          className={error ? 'border-red-500' : ''}
        />
      );

    case 'datetime':
      return (
        <Input
          id={field.id}
          type="datetime-local"
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value)}
          className={error ? 'border-red-500' : ''}
        />
      );

    case 'select':
      return (
        <Select value={(value as string) || ''} onValueChange={onChange}>
          <SelectTrigger className={error ? 'border-red-500' : ''}>
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            {(field as { options: { label: string; value: string }[] }).options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

    case 'checkbox':
      return (
        <div className="flex items-center gap-2">
          <input
            id={field.id}
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => onChange(e.target.checked)}
            className="h-4 w-4"
          />
          <label htmlFor={field.id} className="text-sm">{field.label}</label>
        </div>
      );

    case 'location':
      return (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={async () => {
            try {
              const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject);
              });
              onChange({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              });
              toast.success('Location captured');
            } catch {
              toast.error('Failed to get location');
            }
          }}
        >
          <MapPin className="h-4 w-4 mr-2" />
          {value ? 'Location Captured' : 'Capture Location'}
        </Button>
      );

    case 'photo':
      return (
        <div className="space-y-2">
          {value && typeof value === 'string' && (
            <img src={value} alt="Captured" className="w-full h-32 object-cover rounded-lg" />
          )}
          <Input
            id={field.id}
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onloadend = () => {
                  onChange(reader.result as string);
                };
                reader.readAsDataURL(file);
              }
            }}
            className={error ? 'border-red-500' : ''}
          />
        </div>
      );

    case 'signature':
      return (
        <div className="space-y-2">
          <SignaturePad
            value={(value as string) || ''}
            onChange={onChange}
            primaryColor={primaryColor}
          />
        </div>
      );

    case 'barcode':
      return (
        <Input
          id={field.id}
          type="text"
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter or scan barcode"
          className={error ? 'border-red-500' : ''}
        />
      );

    case 'file':
      return (
        <Input
          id={field.id}
          type="file"
          accept={(field as { accept?: string }).accept}
          multiple={(field as { multiple?: boolean }).multiple}
          onChange={(e) => {
            const files = e.target.files;
            if (files && files.length > 0) {
              onChange(Array.from(files).map(f => f.name));
            }
          }}
          className={error ? 'border-red-500' : ''}
        />
      );

    default:
      return (
        <Input
          id={field.id}
          type="text"
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className={error ? 'border-red-500' : ''}
        />
      );
  }
}

// Signature Pad Component
function SignaturePad({ value, onChange, primaryColor }: {
  value: string;
  onChange: (value: string) => void;
  primaryColor: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
  }, []);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setHasSignature(true);

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      onChange(canvas.toDataURL());
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    onChange('');
  };

  return (
    <div className="space-y-2">
      <div className="border rounded-lg overflow-hidden">
        <canvas
          ref={canvasRef}
          width={400}
          height={150}
          className="w-full bg-white cursor-crosshair touch-none"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>
      {hasSignature && (
        <Button variant="outline" size="sm" onClick={clearSignature}>
          Clear Signature
        </Button>
      )}
    </div>
  );
}

// Helper function to format field values
function formatFieldValue(value: unknown, type: FieldType): string {
  if (value === null || value === undefined) return '-';

  switch (type) {
    case 'date':
      return new Date(value as string).toLocaleDateString();
    case 'datetime':
      return new Date(value as string).toLocaleString();
    case 'time':
      return String(value);
    case 'location':
      const loc = value as { latitude: number; longitude: number };
      return loc ? `${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}` : '-';
    case 'checkbox':
      return value ? 'Yes' : 'No';
    case 'photo':
      return '📷 Photo';
    case 'signature':
      return '✍️ Signature';
    case 'file':
      return '📎 File';
    default:
      return String(value);
  }
}
