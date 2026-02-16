'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import {
  Plus, Search, Moon, Sun, Smartphone, Grid, List,
  Filter, SortAsc, MoreVertical, Trash2, Edit, ExternalLink,
  Copy, Share2, Star, StarOff, Loader2, Sparkles, Database,
  FileText, ClipboardList, Users, ShoppingCart, BookOpen, Wrench
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { PWAProvider } from '@/components/pwa/PWAProvider';
import { usePWA } from '@/hooks/use-pwa';
import { AppBuilder } from '@/components/app-builder/AppBuilder';
import { AppRuntime } from '@/components/app-builder/AppRuntime';
import type { AppSchema } from '@/types/app-builder';

interface AppData {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  iconColor: string;
  published: boolean;
  schema: string;
  recordCount: number;
  createdAt: string;
  updatedAt: string;
}

// App templates
const APP_TEMPLATES = [
  {
    name: 'Blank App',
    description: 'Start from scratch',
    icon: Smartphone,
    color: '#3B82F6',
    template: { fields: [], views: [{ id: 'default', name: 'All Records', type: 'cards', fields: [] }] }
  },
  {
    name: 'Inventory Tracker',
    description: 'Track items, stock, and inventory',
    icon: Database,
    color: '#10B981',
    template: {
      fields: [
        { id: 'f1', type: 'text', label: 'Item Name', required: true },
        { id: 'f2', type: 'number', label: 'Quantity', required: true },
        { id: 'f3', type: 'text', label: 'Category' },
        { id: 'f4', type: 'number', label: 'Price' },
        { id: 'f5', type: 'photo', label: 'Photo' },
        { id: 'f6', type: 'barcode', label: 'Barcode' },
      ],
      views: [{ id: 'default', name: 'All Items', type: 'cards', fields: ['f1', 'f2', 'f3'] }]
    }
  },
  {
    name: 'Contact Directory',
    description: 'Manage contacts and information',
    icon: Users,
    color: '#8B5CF6',
    template: {
      fields: [
        { id: 'f1', type: 'text', label: 'Name', required: true },
        { id: 'f2', type: 'email', label: 'Email' },
        { id: 'f3', type: 'phone', label: 'Phone' },
        { id: 'f4', type: 'text', label: 'Company' },
        { id: 'f5', type: 'textarea', label: 'Notes' },
      ],
      views: [{ id: 'default', name: 'All Contacts', type: 'cards', fields: ['f1', 'f2', 'f3'] }]
    }
  },
  {
    name: 'Daily Journal',
    description: 'Capture daily thoughts and memories',
    icon: FileText,
    color: '#F59E0B',
    template: {
      fields: [
        { id: 'f1', type: 'date', label: 'Date', required: true },
        { id: 'f2', type: 'textarea', label: 'Entry', required: true },
        { id: 'f3', type: 'photo', label: 'Photo' },
        { id: 'f4', type: 'location', label: 'Location' },
        { id: 'f5', type: 'select', label: 'Mood', options: [
          { label: 'Happy', value: 'happy' },
          { label: 'Neutral', value: 'neutral' },
          { label: 'Sad', value: 'sad' },
          { label: 'Excited', value: 'excited' }
        ]},
      ],
      views: [{ id: 'default', name: 'All Entries', type: 'cards', fields: ['f1', 'f2'] }]
    }
  },
  {
    name: 'Task Manager',
    description: 'Track tasks and to-dos',
    icon: ClipboardList,
    color: '#EF4444',
    template: {
      fields: [
        { id: 'f1', type: 'text', label: 'Task', required: true },
        { id: 'f2', type: 'date', label: 'Due Date' },
        { id: 'f3', type: 'select', label: 'Priority', options: [
          { label: 'High', value: 'high' },
          { label: 'Medium', value: 'medium' },
          { label: 'Low', value: 'low' }
        ]},
        { id: 'f4', type: 'checkbox', label: 'Completed', options: [] },
        { id: 'f5', type: 'textarea', label: 'Notes' },
      ],
      views: [{ id: 'default', name: 'All Tasks', type: 'cards', fields: ['f1', 'f2', 'f3'] }]
    }
  },
  {
    name: 'Shopping List',
    description: 'Track shopping items and prices',
    icon: ShoppingCart,
    color: '#06B6D4',
    template: {
      fields: [
        { id: 'f1', type: 'text', label: 'Item', required: true },
        { id: 'f2', type: 'number', label: 'Quantity' },
        { id: 'f3', type: 'number', label: 'Price' },
        { id: 'f4', type: 'checkbox', label: 'Purchased', options: [] },
        { id: 'f5', type: 'select', label: 'Category', options: [
          { label: 'Groceries', value: 'groceries' },
          { label: 'Household', value: 'household' },
          { label: 'Electronics', value: 'electronics' },
          { label: 'Other', value: 'other' }
        ]},
      ],
      views: [{ id: 'default', name: 'Shopping List', type: 'cards', fields: ['f1', 'f2', 'f4'] }]
    }
  },
];

export default function Home() {
  const { theme, setTheme } = useTheme();
  const { isOnline, canInstall, install } = usePWA();
  const [mounted, setMounted] = useState(false);
  const [apps, setApps] = useState<AppData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterPublished, setFilterPublished] = useState<'all' | 'published' | 'draft'>('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<AppData | null>(null);
  const [viewingApp, setViewingApp] = useState<AppData | null>(null);
  const [newAppName, setNewAppName] = useState('');
  const [newAppDescription, setNewAppDescription] = useState('');
  const [newAppIcon, setNewAppIcon] = useState('📱');
  const [newAppColor, setNewAppColor] = useState('#3B82F6');
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);

  // Icons and colors for app creation
  const icons = ['📱', '📋', '📊', '📝', '🗂️', '💼', '🏠', '🛒', '📚', '🎨', '🔧', '⚡', '📅', '✅', '🎯', '💡'];
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'];

  useEffect(() => {
    setMounted(true);
    fetchApps();
  }, []);

  const fetchApps = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/apps');
      if (response.ok) {
        const data = await response.json();
        setApps(data.apps || []);
      }
    } catch (error) {
      console.error('Failed to fetch apps:', error);
      toast.error('Failed to load apps');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateApp = async () => {
    if (!newAppName.trim()) {
      toast.error('Please enter an app name');
      return;
    }

    setCreating(true);
    try {
      const template = selectedTemplate !== null ? APP_TEMPLATES[selectedTemplate].template : null;
      
      const response = await fetch('/api/apps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newAppName,
          description: newAppDescription,
          icon: newAppIcon,
          iconColor: newAppColor,
          schema: JSON.stringify(template || {
            fields: [],
            views: [{ id: 'default', name: 'All Records', type: 'cards', fields: [] }],
            settings: { primaryColor: newAppColor }
          }),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setApps([data.app, ...apps]);
        setCreateDialogOpen(false);
        resetCreateForm();
        toast.success('App created successfully');
        // Open the new app for editing
        setEditingApp(data.app);
      } else {
        throw new Error('Failed to create app');
      }
    } catch (error) {
      console.error('Create error:', error);
      toast.error('Failed to create app');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteApp = async (appId: string) => {
    try {
      const response = await fetch(`/api/apps/${appId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setApps(apps.filter(a => a.id !== appId));
        toast.success('App deleted');
      } else {
        throw new Error('Failed to delete');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete app');
    }
  };

  const handlePublishApp = async (appId: string) => {
    try {
      const response = await fetch(`/api/apps/${appId}/publish`, {
        method: 'POST',
      });

      if (response.ok) {
        setApps(apps.map(a => 
          a.id === appId ? { ...a, published: !a.published } : a
        ));
        toast.success('App published! Share the link with others.');
      } else {
        throw new Error('Failed to publish');
      }
    } catch (error) {
      console.error('Publish error:', error);
      toast.error('Failed to publish app');
    }
  };

  const resetCreateForm = () => {
    setNewAppName('');
    setNewAppDescription('');
    setNewAppIcon('📱');
    setNewAppColor('#3B82F6');
    setSelectedTemplate(null);
  };

  const copyShareLink = (appId: string) => {
    const url = `${window.location.origin}?app=${appId}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard');
  };

  // Filter apps
  const filteredApps = apps.filter(app => {
    const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchesFilter = filterPublished === 'all' ||
      (filterPublished === 'published' && app.published) ||
      (filterPublished === 'draft' && !app.published);
    return matchesSearch && matchesFilter;
  });

  // If viewing a published app, show the runtime
  if (viewingApp) {
    return (
      <AppRuntime
      app={viewingApp}
      onBack={() => setViewingApp(null)}
      />
    );
  }

  // If editing an app, show the builder
  if (editingApp) {
    const appSchema: AppSchema = {
      id: editingApp.id,
      name: editingApp.name,
      description: editingApp.description || '',
      icon: editingApp.icon || '📱',
      iconColor: editingApp.iconColor,
      version: '1.0.0',
      fields: JSON.parse(editingApp.schema).fields || [],
      views: JSON.parse(editingApp.schema).views || [],
      settings: JSON.parse(editingApp.schema).settings,
      createdAt: editingApp.createdAt,
      updatedAt: editingApp.updatedAt,
    };

    return (
      <AppBuilder
        initialApp={appSchema}
        appId={editingApp.id}
        onBack={() => setEditingApp(null)}
      />
    );
  }

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <PWAProvider>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-xl">AppFlow</h1>
                <p className="text-xs text-muted-foreground hidden sm:block">No-Code PWA Builder</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Offline indicator */}
              {!isOnline && (
                <Badge variant="destructive" className="text-xs">
                  Offline
                </Badge>
              )}

              {/* View mode toggle */}
              <div className="hidden sm:flex items-center border rounded-lg p-1">
                <Button
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>

              {/* Theme toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              >
                {theme === 'dark' ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </Button>

              {/* Create app button */}
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetCreateForm}>
                    <Plus className="h-4 w-4 mr-2" />
                    New App
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create New App</DialogTitle>
                    <DialogDescription>
                      Choose a template or start from scratch
                    </DialogDescription>
                  </DialogHeader>

                  <Tabs defaultValue="templates" className="mt-4">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="templates">Templates</TabsTrigger>
                      <TabsTrigger value="blank">Blank App</TabsTrigger>
                    </TabsList>

                    <TabsContent value="templates" className="mt-4">
                      <div className="grid grid-cols-2 gap-3 max-h-[250px] overflow-y-auto">
                        {APP_TEMPLATES.slice(1).map((template, index) => (
                          <Card
                            key={index}
                            className={cn(
                              "cursor-pointer transition-all hover:shadow-md",
                              selectedTemplate === index + 1 && "ring-2 ring-primary"
                            )}
                            onClick={() => {
                              setSelectedTemplate(index + 1);
                              setNewAppName(template.name);
                              setNewAppIcon('📱');
                              setNewAppColor(template.color);
                            }}
                          >
                            <CardContent className="p-4">
                              <div
                                className="w-10 h-10 rounded-lg flex items-center justify-center mb-2"
                                style={{ backgroundColor: template.color + '20' }}
                              >
                                <template.icon className="h-5 w-5" style={{ color: template.color }} />
                              </div>
                              <h4 className="font-medium text-sm">{template.name}</h4>
                              <p className="text-xs text-muted-foreground">{template.description}</p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </TabsContent>

                    <TabsContent value="blank" className="mt-4">
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          Start with a blank app and add your own fields.
                        </p>
                        <div className="p-4 border rounded-lg bg-muted/30">
                          <p className="text-sm font-medium">You can add:</p>
                          <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                            <li>• Text, Email, Phone, Number fields</li>
                            <li>• Date, Time, DateTime pickers</li>
                            <li>• Photos, Signatures, Locations</li>
                            <li>• Dropdowns, Checkboxes, Radio buttons</li>
                          </ul>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>

                  <div className="space-y-4 mt-4 pt-4 border-t">
                    <div className="space-y-2">
                      <Label htmlFor="name">App Name</Label>
                      <Input
                        id="name"
                        value={newAppName}
                        onChange={(e) => setNewAppName(e.target.value)}
                        placeholder="My Awesome App"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description (optional)</Label>
                      <Textarea
                        id="description"
                        value={newAppDescription}
                        onChange={(e) => setNewAppDescription(e.target.value)}
                        placeholder="What does this app do?"
                        className="min-h-[80px]"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Icon</Label>
                        <div className="flex flex-wrap gap-1">
                          {icons.map((icon) => (
                            <button
                              key={icon}
                              type="button"
                              onClick={() => setNewAppIcon(icon)}
                              className={cn(
                                "w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-transform hover:scale-110",
                                newAppIcon === icon ? "ring-2 ring-primary ring-offset-2 bg-muted" : "bg-muted"
                              )}
                            >
                              {icon}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Color</Label>
                        <div className="flex flex-wrap gap-1">
                          {colors.map((color) => (
                            <button
                              key={color}
                              type="button"
                              onClick={() => setNewAppColor(color)}
                              className={cn(
                                "w-9 h-9 rounded-full transition-transform hover:scale-110",
                                newAppColor === color ? "ring-2 ring-offset-2 ring-primary" : ""
                              )}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                      <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateApp} disabled={creating}>
                        {creating ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-2" />
                            Create App
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          {/* Hero Section (when no apps) */}
          {apps.length === 0 && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Smartphone className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold mb-3">Build Your First App</h2>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Create powerful no-code apps that work offline, install on any device, and sync with Google Sheets.
              </p>
              <Button size="lg" onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-5 w-5 mr-2" />
                Create Your First App
              </Button>
            </motion.div>
          )}

          {/* Apps Grid/List */}
          {apps.length > 0 && (
            <>
              {/* Search and Filter Bar */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search apps..."
                    className="pl-10"
                  />
                </div>

                <div className="flex gap-2">
                  <div className="flex items-center border rounded-lg p-1">
                    <Button
                      variant={filterPublished === 'all' ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setFilterPublished('all')}
                    >
                      All
                    </Button>
                    <Button
                      variant={filterPublished === 'published' ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setFilterPublished('published')}
                    >
                      Published
                    </Button>
                    <Button
                      variant={filterPublished === 'draft' ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setFilterPublished('draft')}
                    >
                      Drafts
                    </Button>
                  </div>
                </div>
              </div>

              {/* Apps Display */}
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredApps.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-muted-foreground">No apps found</p>
                </div>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  <AnimatePresence>
                    {filteredApps.map((app, index) => (
                      <motion.div
                        key={app.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <AppCard
                          app={app}
                          onEdit={() => setEditingApp(app)}
                          onView={() => setViewingApp(app)}
                          onDelete={() => handleDeleteApp(app.id)}
                          onPublish={() => handlePublishApp(app.id)}
                          onCopyLink={() => copyShareLink(app.id)}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="space-y-2">
                  <AnimatePresence>
                    {filteredApps.map((app, index) => (
                      <motion.div
                        key={app.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ delay: index * 0.03 }}
                      >
                        <AppListItem
                          app={app}
                          onEdit={() => setEditingApp(app)}
                          onView={() => setViewingApp(app)}
                          onDelete={() => handleDeleteApp(app.id)}
                          onPublish={() => handlePublishApp(app.id)}
                          onCopyLink={() => copyShareLink(app.id)}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </>
          )}
        </main>

        {/* Footer */}
        <footer className="border-t py-6 mt-auto">
          <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
            <p>AppFlow - Build powerful apps without code</p>
            <p className="mt-1">
              Works offline • Install on any device • Sync with Google Sheets
            </p>
          </div>
        </footer>
      </div>
    </PWAProvider>
  );
}

// App Card Component
function AppCard({ app, onEdit, onView, onDelete, onPublish, onCopyLink }: {
  app: AppData;
  onEdit: () => void;
  onView: () => void;
  onDelete: () => void;
  onPublish: () => void;
  onCopyLink: () => void;
}) {
  return (
    <Card className="group cursor-pointer hover:shadow-lg transition-all">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
            style={{ backgroundColor: app.iconColor + '20' }}
          >
            {app.icon || '📱'}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onView}>
                <ExternalLink className="h-4 w-4 mr-2" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onCopyLink}>
                <Copy className="h-4 w-4 mr-2" />
                Copy Link
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onPublish}>
                <Share2 className="h-4 w-4 mr-2" />
                {app.published ? 'Unpublish' : 'Publish'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <CardTitle className="text-lg mt-3">{app.name}</CardTitle>
        {app.description && (
          <CardDescription className="line-clamp-2">{app.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            {app.published ? (
              <Badge variant="default" className="text-xs">Published</Badge>
            ) : (
              <Badge variant="secondary" className="text-xs">Draft</Badge>
            )}
          </div>
          <span className="text-muted-foreground">
            {app.recordCount} record{app.recordCount !== 1 ? 's' : ''}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// App List Item Component
function AppListItem({ app, onEdit, onView, onDelete, onPublish, onCopyLink }: {
  app: AppData;
  onEdit: () => void;
  onView: () => void;
  onDelete: () => void;
  onPublish: () => void;
  onCopyLink: () => void;
}) {
  return (
    <Card className="group cursor-pointer hover:shadow-md transition-all">
      <CardContent className="p-4 flex items-center gap-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
          style={{ backgroundColor: app.iconColor + '20' }}
        >
          {app.icon || '📱'}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium truncate">{app.name}</h3>
            {app.published ? (
              <Badge variant="default" className="text-xs">Published</Badge>
            ) : (
              <Badge variant="secondary" className="text-xs">Draft</Badge>
            )}
          </div>
          {app.description && (
            <p className="text-sm text-muted-foreground truncate">{app.description}</p>
          )}
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{app.recordCount} records</span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onView}>
              <ExternalLink className="h-4 w-4 mr-2" />
              View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onCopyLink}>
              <Copy className="h-4 w-4 mr-2" />
              Copy Link
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onPublish}>
              <Share2 className="h-4 w-4 mr-2" />
              {app.published ? 'Unpublish' : 'Publish'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onDelete} className="text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardContent>
    </Card>
  );
}
