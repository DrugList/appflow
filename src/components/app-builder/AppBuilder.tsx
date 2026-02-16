'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Database, Palette, Settings as SettingsIcon, Layout, 
  ChevronRight, ExternalLink, Check, Loader2, ArrowLeft, Link2, Copy, CheckCircle,
  Webhook, Cable
} from 'lucide-react';
import { toast } from 'sonner';

interface AppBuilderProps {
  initialApp?: AppSchema;
  appId?: string;
  onBack?: () => void;
}

export function AppBuilder({ initialApp, appId, onBack }: AppBuilderProps) {
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

  useEffect(() => {
    setMounted(true);
    if (initialApp) {
      setCurrentApp(initialApp);
    } else if (!currentApp) {
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
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
      <div className="flex-1 flex overflow-hidden">
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 280, opacity: 1 }}
          className="border-r bg-muted/30 flex-shrink-0 overflow-y-auto"
        >
          <AnimatePresence mode="wait">
            {sidebarTab === 'fields' && (
              <motion.div key="fields" initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="h-full">
                <FieldPalette onAddField={handleAddField} />
              </motion.div>
            )}
            {sidebarTab === 'views' && (
              <motion.div key="views" initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="h-full p-4">
                <ViewsPanel views={currentApp.views} fields={currentApp.fields} />
              </motion.div>
            )}
            {sidebarTab === 'data' && (
              <motion.div key="data" initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="h-full p-4">
                <DataSourcePanel appId={appId || currentApp.id} />
              </motion.div>
            )}
            {sidebarTab === 'settings' && (
              <motion.div key="settings" initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="h-full p-4">
                <SettingsPanel app={currentApp} appId={appId || currentApp.id} onUpdateDescription={updateAppDescription} onUpdateIcon={updateAppIcon} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
        <div className="flex-1 overflow-hidden bg-background">
          <FormCanvas fields={currentApp.fields} selectedFieldId={selectedFieldId} previewMode={previewMode} onSelectField={selectField} onUpdateField={updateField} onRemoveField={removeField} onReorderFields={reorderFields} onAddField={handleAddField} />
        </div>
        <AnimatePresence>
          {!previewMode && (
            <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 300, opacity: 1 }} exit={{ width: 0, opacity: 0 }} className="border-l bg-muted/30 flex-shrink-0 overflow-y-auto">
              <PropertyPanel field={selectedField} onUpdateField={updateField} onRemoveField={removeField} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ViewsPanel({ views, fields }: { views: AppSchema['views']; fields: AppSchema['fields'] }) {
  return (
    <div className="h-full flex flex-col">
      <div className="mb-4">
        <h3 className="font-semibold text-sm">Views</h3>
        <p className="text-xs text-muted-foreground mt-1">Different ways to display your data</p>
      </div>
      <div className="space-y-2">
        {views.map((view) => (
          <Card key={view.id} className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{view.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{view.type}</p>
              </div>
              <Badge variant="outline" className="text-xs">{view.fields.length} fields</Badge>
            </div>
          </Card>
        ))}
      </div>
      <Button variant="outline" className="mt-4 w-full" size="sm">Add View</Button>
    </div>
  );
}

function DataSourcePanel({ appId }: { appId: string }) {
  const [showApiDialog, setShowApiDialog] = useState(false);
  const [apiUrl, setApiUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [connectedApi, setConnectedApi] = useState<{url: string; lastSync?: string} | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch connected REST API status
  useEffect(() => {
    const fetchApiStatus = async () => {
      try {
        const response = await fetch(`/api/integrations/rest-api?appId=${appId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.connected && data.dataSource) {
            setConnectedApi({
              url: data.dataSource.url,
              lastSync: data.dataSource.lastSync,
            });
          }
        }
      } catch (error) {
        console.error('Failed to fetch API status:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchApiStatus();
  }, [appId]);

  const handleConnectApi = async () => {
    if (!apiUrl) {
      toast.error('Please enter an API URL');
      return;
    }
    setConnecting(true);
    try {
      const response = await fetch('/api/integrations/rest-api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appId, url: apiUrl, apiKey: apiKey || undefined }),
      });
      if (response.ok) {
        toast.success('API connected successfully');
        setConnectedApi({ url: apiUrl, lastSync: new Date().toISOString() });
        setShowApiDialog(false);
        setApiUrl('');
        setApiKey('');
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to connect');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to connect to API');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnectApi = async () => {
    try {
      const response = await fetch(`/api/integrations/rest-api?appId=${appId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        toast.success('API disconnected');
        setConnectedApi(null);
      }
    } catch (error) {
      toast.error('Failed to disconnect API');
    }
  };

  const handleSyncApi = async () => {
    setSyncing(true);
    try {
      const response = await fetch('/api/integrations/rest-api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appId }),
      });
      if (response.ok) {
        const data = await response.json();
        toast.success(`Synced ${data.recordsCount || 0} records`);
        setConnectedApi(prev => prev ? { ...prev, lastSync: new Date().toISOString() } : null);
      } else {
        throw new Error('Sync failed');
      }
    } catch (error) {
      toast.error('Failed to sync data');
    } finally {
      setSyncing(false);
    }
  };

  const handleTestConnection = async () => {
    if (!apiUrl) {
      toast.error('Please enter an API URL');
      return;
    }
    setConnecting(true);
    try {
      const response = await fetch('/api/integrations/rest-api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: apiUrl, apiKey: apiKey || undefined }),
      });
      if (response.ok) {
        const data = await response.json();
        toast.success(`Connection successful! Found ${data.recordCount || 'unknown'} records`);
      } else {
        throw new Error('Connection test failed');
      }
    } catch (error) {
      toast.error('Failed to connect to API. Check URL and credentials.');
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4">
        <h3 className="font-semibold text-sm">Data Source</h3>
        <p className="text-xs text-muted-foreground mt-1">Connect your data from various sources</p>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-2">
          {/* Local Database - Always Active */}
          <Card className="p-3 border-green-500/50 bg-green-500/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Database className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Local Database</p>
                <p className="text-xs text-muted-foreground">Built-in data storage</p>
              </div>
              <Badge variant="default" className="bg-green-600">Active</Badge>
            </div>
          </Card>
          
          {/* REST API - Connected or Not */}
          {connectedApi ? (
            <Card className="p-3 border-purple-500/50 bg-purple-500/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <Webhook className="h-5 w-5 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">REST API</p>
                  <p className="text-xs text-muted-foreground truncate">{connectedApi.url}</p>
                  {connectedApi.lastSync && (
                    <p className="text-xs text-muted-foreground">
                      Last sync: {new Date(connectedApi.lastSync).toLocaleString()}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-8 w-8"
                    onClick={handleSyncApi}
                    disabled={syncing}
                    title="Sync now"
                  >
                    {syncing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-1 text-xs"
                  onClick={handleSyncApi}
                  disabled={syncing}
                >
                  {syncing ? (
                    <><Loader2 className="h-3 w-3 mr-1 animate-spin" />Syncing...</>
                  ) : (
                    <><Cable className="h-3 w-3 mr-1" />Sync</>
                  )}
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-xs text-destructive hover:text-destructive"
                  onClick={handleDisconnectApi}
                >
                  Disconnect
                </Button>
              </div>
            </Card>
          ) : (
            <Card 
              className="p-3 border-dashed cursor-pointer hover:border-primary/50 transition-colors" 
              onClick={() => setShowApiDialog(true)}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <Webhook className="h-5 w-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">REST API</p>
                  <p className="text-xs text-muted-foreground">Connect external API</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </Card>
          )}
          
          {/* Google Sheets - Coming Soon */}
          <Card className="p-3 border-dashed opacity-60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Database className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Google Sheets</p>
                <p className="text-xs text-muted-foreground">Requires Google Cloud setup</p>
              </div>
              <Badge variant="outline" className="text-xs">Coming Soon</Badge>
            </div>
          </Card>
        </div>
      )}
      
      <Dialog open={showApiDialog} onOpenChange={setShowApiDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect REST API</DialogTitle>
            <DialogDescription>
              Connect your external API to sync data with your app. The API should return JSON data.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>API URL</Label>
              <Input 
                placeholder="https://api.example.com/data" 
                value={apiUrl} 
                onChange={(e) => setApiUrl(e.target.value)} 
              />
              <p className="text-xs text-muted-foreground">
                The endpoint should return a JSON array of records
              </p>
            </div>
            <div className="space-y-2">
              <Label>API Key (optional)</Label>
              <Input 
                type="password" 
                placeholder="Enter API key if required" 
                value={apiKey} 
                onChange={(e) => setApiKey(e.target.value)} 
              />
              <p className="text-xs text-muted-foreground">
                Will be sent as Authorization: Bearer header
              </p>
            </div>
            <div className="flex justify-between gap-2">
              <Button variant="outline" onClick={handleTestConnection} disabled={connecting || !apiUrl}>
                {connecting ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Testing...</>
                ) : (
                  <><Check className="h-4 w-4 mr-2" />Test</>
                )}
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowApiDialog(false)}>Cancel</Button>
                <Button onClick={handleConnectApi} disabled={connecting || !apiUrl}>
                  {connecting ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Connecting...</>
                  ) : (
                    <><Cable className="h-4 w-4 mr-2" />Connect</>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SettingsPanel({ app, appId, onUpdateDescription, onUpdateIcon }: { app: AppSchema; appId: string; onUpdateDescription: (desc: string) => void; onUpdateIcon: (icon: string, color: string) => void; }) {
  const [copied, setCopied] = useState(false);
  const icons = ['📱', '📋', '📊', '📝', '🗂️', '💼', '🏠', '🛒', '📚', '🎨', '🔧', '⚡'];
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'];

  const embedUrl = typeof window !== 'undefined' ? `${window.location.origin}?app=${appId}&embed=true` : '';
  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}?app=${appId}` : '';

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Copied to clipboard!');
  };

  return (
    <div className="h-full flex flex-col overflow-y-auto">
      <div className="mb-4">
        <h3 className="font-semibold text-sm">App Settings</h3>
        <p className="text-xs text-muted-foreground mt-1">Customize your app appearance</p>
      </div>
      <div className="space-y-4 pb-4">
        <div className="space-y-2">
          <Label className="text-xs">Description</Label>
          <Textarea value={app.description || ''} onChange={(e) => onUpdateDescription(e.target.value)} placeholder="Describe your app..." className="min-h-[80px] text-sm" />
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Icon</Label>
          <div className="flex flex-wrap gap-2">
            {icons.map((icon) => (
              <button key={icon} type="button" onClick={() => onUpdateIcon(icon, app.iconColor || '#3B82F6')} className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg transition-transform hover:scale-110 ${app.icon === icon ? 'ring-2 ring-primary ring-offset-2' : 'bg-muted'}`}>{icon}</button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Color</Label>
          <div className="flex flex-wrap gap-2">
            {colors.map((color) => (
              <button key={color} type="button" onClick={() => onUpdateIcon(app.icon || '📱', color)} className={`w-8 h-8 rounded-full transition-transform hover:scale-110 ${app.iconColor === color ? 'ring-2 ring-offset-2 ring-primary' : ''}`} style={{ backgroundColor: color }} />
            ))}
          </div>
        </div>
        <div className="pt-4 border-t">
          <h4 className="text-xs font-semibold mb-3 flex items-center gap-2"><Link2 className="h-3 w-3" />Share & Embed</h4>
          <div className="space-y-2 mb-3">
            <Label className="text-xs">Share Link</Label>
            <div className="flex gap-2">
              <Input readOnly value={shareUrl} className="text-xs" />
              <Button size="icon" variant="outline" onClick={() => copyToClipboard(shareUrl)}>
                {copied ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Embed Code</Label>
            <Textarea readOnly value={`<iframe src="${embedUrl}" width="100%" height="600" frameborder="0"></iframe>`} className="text-xs font-mono min-h-[60px]" />
            <Button variant="outline" size="sm" className="w-full" onClick={() => copyToClipboard(`<iframe src="${embedUrl}" width="100%" height="600" frameborder="0"></iframe>`)}>
              <Copy className="h-3 w-3 mr-2" />Copy Embed Code
            </Button>
          </div>
        </div>
        <div className="pt-4 border-t">
          <Button variant="outline" className="w-full" onClick={() => window.open(shareUrl, '_blank')}>
            <ExternalLink className="h-4 w-4 mr-2" />Preview App
          </Button>
        </div>
      </div>
    </div>
  );
}
