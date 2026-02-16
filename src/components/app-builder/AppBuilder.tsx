'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAppBuilderStore } from '@/lib/app-builder/store';
import { createField, type FieldType, type AppSchema } from '@/types/app-builder';
import { FieldPalette } from './FieldPalette';
import { FormCanvas } from './FormCanvas';
import { PropertyPanel } from './PropertyPanel';
import { TopBar } from './TopBar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Database, Palette, Settings as SettingsIcon, Layout, 
  ChevronRight, ExternalLink, Check, Loader2, ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';

interface AppBuilderProps {
  initialApp?: AppSchema;
  appId?: string;
  onBack?: () => void;
}

export function AppBuilder({ initialApp, appId, onBack }: AppBuilderProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [saving, setSaving] = useState(false);

  const {
    currentApp,
    selectedFieldId,
    previewMode,
    sidebarTab,
    isDirty,
    lastSaved,
    setCurrentApp,
    updateAppName,
    updateAppDescription,
    updateAppIcon,
    addField,
    updateField,
    removeField,
    reorderFields,
    selectField,
    setPreviewMode,
    setSidebarTab,
    markSaved,
  } = useAppBuilderStore();

  // Initialize app
  useEffect(() => {
    setMounted(true);
    if (initialApp) {
      setCurrentApp(initialApp);
    } else if (!currentApp) {
      // Create new app
      const newApp: AppSchema = {
        id: `app_${Date.now()}`,
        name: 'My New App',
        description: '',
        icon: '📱',
        iconColor: '#3B82F6',
        version: '1.0.0',
        fields: [],
        views: [
          {
            id: 'default_view',
            name: 'All Records',
            type: 'cards',
            fields: [],
          },
        ],
        settings: {
          primaryColor: '#3B82F6',
          darkMode: 'system',
          publicAccess: false,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setCurrentApp(newApp);
    }
  }, [initialApp, currentApp, setCurrentApp]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      // Escape to deselect
      if (e.key === 'Escape') {
        selectField(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectField]);

  const handleAddField = useCallback((type: FieldType) => {
    const field = createField(type);
    addField(field);
    selectField(field.id);
    toast.success(`Added ${type} field`);
  }, [addField, selectField]);

  const handleSave = async () => {
    if (!currentApp) return;
    
    setSaving(true);
    try {
      const response = await fetch('/api/apps' + (appId ? `/${appId}` : ''), {
        method: appId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: currentApp.name,
          description: currentApp.description,
          icon: currentApp.icon,
          iconColor: currentApp.iconColor,
          schema: JSON.stringify({
            fields: currentApp.fields,
            views: currentApp.views,
            settings: currentApp.settings,
          }),
        }),
      });

      if (!response.ok) throw new Error('Failed to save');
      
      markSaved();
      toast.success('App saved successfully');
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save app');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!currentApp) return;
    
    try {
      const response = await fetch(`/api/apps/${appId || currentApp.id}/publish`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to publish');
      
      toast.success('App published! Share the link with others.');
    } catch (error) {
      console.error('Publish error:', error);
      toast.error('Failed to publish app');
    }
  };

  // Get selected field
  const selectedField = currentApp?.fields.find((f) => f.id === selectedFieldId) || null;

  if (!mounted || !currentApp) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-muted" />
          <div className="h-4 w-32 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Top Bar */}
      <TopBar
        appName={currentApp.name}
        onAppNameChange={updateAppName}
        previewMode={previewMode}
        onTogglePreview={() => setPreviewMode(!previewMode)}
        isDirty={isDirty}
        lastSaved={lastSaved}
        onSave={handleSave}
        onPublish={handlePublish}
        sidebarTab={sidebarTab}
        onSidebarTabChange={setSidebarTab}
        onBack={onBack}
      />

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 280, opacity: 1 }}
          className="border-r bg-muted/30 flex-shrink-0 overflow-y-auto"
        >
          <AnimatePresence mode="wait">
            {sidebarTab === 'fields' && (
              <motion.div
                key="fields"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                className="h-full"
              >
                <FieldPalette onAddField={handleAddField} />
              </motion.div>
            )}
            
            {sidebarTab === 'views' && (
              <motion.div
                key="views"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                className="h-full p-4"
              >
                <ViewsPanel views={currentApp.views} fields={currentApp.fields} />
              </motion.div>
            )}
            
            {sidebarTab === 'data' && (
              <motion.div
                key="data"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                className="h-full p-4"
              >
                <DataSourcePanel />
              </motion.div>
            )}
            
            {sidebarTab === 'settings' && (
              <motion.div
                key="settings"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                className="h-full p-4"
              >
                <SettingsPanel 
                  app={currentApp}
                  onUpdateDescription={updateAppDescription}
                  onUpdateIcon={updateAppIcon}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Center - Form Canvas */}
        <div className="flex-1 overflow-hidden bg-background">
          <FormCanvas
            fields={currentApp.fields}
            selectedFieldId={selectedFieldId}
            previewMode={previewMode}
            onSelectField={selectField}
            onUpdateField={updateField}
            onRemoveField={removeField}
            onReorderFields={reorderFields}
            onAddField={handleAddField}
          />
        </div>

        {/* Right Sidebar - Properties */}
        <AnimatePresence>
          {!previewMode && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 300, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="border-l bg-muted/30 flex-shrink-0 overflow-y-auto"
            >
              <PropertyPanel
                field={selectedField}
                onUpdateField={updateField}
                onRemoveField={removeField}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Views Panel Component
function ViewsPanel({ views, fields }: { views: AppSchema['views']; fields: AppSchema['fields'] }) {
  return (
    <div className="h-full flex flex-col">
      <div className="mb-4">
        <h3 className="font-semibold text-sm">Views</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Different ways to display your data
        </p>
      </div>
      
      <div className="space-y-2">
        {views.map((view) => (
          <Card key={view.id} className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{view.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{view.type}</p>
              </div>
              <Badge variant="outline" className="text-xs">
                {view.fields.length} fields
              </Badge>
            </div>
          </Card>
        ))}
      </div>
      
      <Button variant="outline" className="mt-4 w-full" size="sm">
        Add View
      </Button>
    </div>
  );
}

// Data Source Panel Component
function DataSourcePanel() {
  return (
    <div className="h-full flex flex-col">
      <div className="mb-4">
        <h3 className="font-semibold text-sm">Data Source</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Connect your data from various sources
        </p>
      </div>
      
      <div className="space-y-2">
        <Card className="p-3 border-dashed cursor-pointer hover:border-primary/50 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Database className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium">Google Sheets</p>
              <p className="text-xs text-muted-foreground">Connect to a spreadsheet</p>
            </div>
            <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
          </div>
        </Card>
        
        <Card className="p-3 border-dashed cursor-pointer hover:border-primary/50 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Database className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium">Local Database</p>
              <p className="text-xs text-muted-foreground">Built-in data storage</p>
            </div>
            <Badge variant="secondary" className="ml-auto">Active</Badge>
          </div>
        </Card>
        
        <Card className="p-3 border-dashed cursor-pointer hover:border-primary/50 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Database className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium">REST API</p>
              <p className="text-xs text-muted-foreground">Connect external API</p>
            </div>
            <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
          </div>
        </Card>
      </div>
    </div>
  );
}

// Settings Panel Component
function SettingsPanel({ 
  app, 
  onUpdateDescription,
  onUpdateIcon 
}: { 
  app: AppSchema;
  onUpdateDescription: (desc: string) => void;
  onUpdateIcon: (icon: string, color: string) => void;
}) {
  const icons = ['📱', '📋', '📊', '📝', '🗂️', '💼', '🏠', '🛒', '📚', '🎨', '🔧', '⚡'];
  const colors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', 
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
  ];

  return (
    <div className="h-full flex flex-col overflow-y-auto">
      <div className="mb-4">
        <h3 className="font-semibold text-sm">App Settings</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Customize your app appearance
        </p>
      </div>
      
      <div className="space-y-4 pb-4">
        <div className="space-y-2">
          <Label className="text-xs">Description</Label>
          <Textarea
            value={app.description || ''}
            onChange={(e) => onUpdateDescription(e.target.value)}
            placeholder="Describe your app..."
            className="min-h-[80px] text-sm"
          />
        </div>
        
        <div className="space-y-2">
          <Label className="text-xs">Icon</Label>
          <div className="flex flex-wrap gap-2">
            {icons.map((icon) => (
              <button
                key={icon}
                type="button"
                onClick={() => onUpdateIcon(icon, app.iconColor || '#3B82F6')}
                className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg transition-transform hover:scale-110 ${
                  app.icon === icon ? 'ring-2 ring-primary ring-offset-2' : 'bg-muted'
                }`}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>
        
        <div className="space-y-2">
          <Label className="text-xs">Color</Label>
          <div className="flex flex-wrap gap-2">
            {colors.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => onUpdateIcon(app.icon || '📱', color)}
                className={`w-8 h-8 rounded-full transition-transform hover:scale-110 ${
                  app.iconColor === color ? 'ring-2 ring-offset-2 ring-primary' : ''
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        <div className="pt-4 border-t">
          <Button variant="outline" className="w-full" onClick={() => window.open('?embed=true', '_blank')}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Preview App
          </Button>
        </div>
      </div>
    </div>
  );
}
