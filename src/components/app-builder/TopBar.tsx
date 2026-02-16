'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Sun, Moon, Monitor, Save, Eye, EyeOff, Play, Settings,
  ChevronDown, Palette, Database, Layout, Undo2, Redo2,
  Smartphone, Tablet, MonitorSmartphone, Download, Share2, ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

interface TopBarProps {
  appName: string;
  onAppNameChange: (name: string) => void;
  previewMode: boolean;
  onTogglePreview: () => void;
  isDirty: boolean;
  lastSaved: Date | null;
  onSave: () => void;
  onPublish: () => void;
  sidebarTab: 'fields' | 'views' | 'data' | 'settings';
  onSidebarTabChange: (tab: 'fields' | 'views' | 'data' | 'settings') => void;
  onBack?: () => void;
}

export function TopBar({
  appName,
  onAppNameChange,
  previewMode,
  onTogglePreview,
  isDirty,
  lastSaved,
  onSave,
  onPublish,
  sidebarTab,
  onSidebarTabChange,
  onBack,
}: TopBarProps) {
  const { theme, setTheme } = useTheme();
  const [isEditingName, setIsEditingName] = useState(false);
  const [devicePreview, setDevicePreview] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  const formatLastSaved = (date: Date | null) => {
    if (!date) return 'Not saved yet';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just saved';
    if (minutes === 1) return 'Saved 1 minute ago';
    if (minutes < 60) return `Saved ${minutes} minutes ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours === 1) return 'Saved 1 hour ago';
    return `Saved ${hours} hours ago`;
  };

  return (
    <div className="h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-between px-4 gap-4">
      {/* Left section - Back button and App name */}
      <div className="flex items-center gap-3">
        {onBack && (
          <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Layout className="h-4 w-4 text-white" />
          </div>
          {isEditingName ? (
            <Input
              autoFocus
              value={appName}
              onChange={(e) => onAppNameChange(e.target.value)}
              onBlur={() => setIsEditingName(false)}
              onKeyDown={(e) => e.key === 'Enter' && setIsEditingName(false)}
              className="h-8 w-48 text-sm font-semibold"
            />
          ) : (
            <button
              onClick={() => setIsEditingName(true)}
              className="font-semibold text-sm hover:text-primary transition-colors"
            >
              {appName || 'Untitled App'}
            </button>
          )}
        </div>
        
        {isDirty && (
          <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
            Unsaved
          </Badge>
        )}
      </div>

      {/* Center section - Tabs */}
      <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
        <TabButton
          active={sidebarTab === 'fields'}
          onClick={() => onSidebarTabChange('fields')}
          icon={<Layout className="h-4 w-4" />}
          label="Fields"
        />
        <TabButton
          active={sidebarTab === 'views'}
          onClick={() => onSidebarTabChange('views')}
          icon={<Database className="h-4 w-4" />}
          label="Views"
        />
        <TabButton
          active={sidebarTab === 'data'}
          onClick={() => onSidebarTabChange('data')}
          icon={<Database className="h-4 w-4" />}
          label="Data"
        />
        <TabButton
          active={sidebarTab === 'settings'}
          onClick={() => onSidebarTabChange('settings')}
          icon={<Settings className="h-4 w-4" />}
          label="Settings"
        />
      </div>

      {/* Right section - Actions */}
      <div className="flex items-center gap-2">
        {/* Device preview selector */}
        <div className="hidden md:flex items-center gap-1 mr-2">
          <Button
            variant={devicePreview === 'desktop' ? 'default' : 'ghost'}
            size="icon"
            className="h-8 w-8"
            onClick={() => setDevicePreview('desktop')}
          >
            <MonitorSmartphone className="h-4 w-4" />
          </Button>
          <Button
            variant={devicePreview === 'tablet' ? 'default' : 'ghost'}
            size="icon"
            className="h-8 w-8"
            onClick={() => setDevicePreview('tablet')}
          >
            <Tablet className="h-4 w-4" />
          </Button>
          <Button
            variant={devicePreview === 'mobile' ? 'default' : 'ghost'}
            size="icon"
            className="h-8 w-8"
            onClick={() => setDevicePreview('mobile')}
          >
            <Smartphone className="h-4 w-4" />
          </Button>
        </div>

        <Separator className="h-6 hidden md:block" />

        {/* Preview toggle */}
        <Button
          variant={previewMode ? 'default' : 'outline'}
          size="sm"
          onClick={onTogglePreview}
        >
          {previewMode ? (
            <>
              <EyeOff className="h-4 w-4 mr-1" />
              Exit Preview
            </>
          ) : (
            <>
              <Eye className="h-4 w-4 mr-1" />
              Preview
            </>
          )}
        </Button>

        {/* Theme toggle */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setTheme('light')}>
              <Sun className="h-4 w-4 mr-2" />
              Light
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('dark')}>
              <Moon className="h-4 w-4 mr-2" />
              Dark
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('system')}>
              <Monitor className="h-4 w-4 mr-2" />
              System
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Save button */}
        <Button size="sm" onClick={onSave} disabled={!isDirty}>
          <Save className="h-4 w-4 mr-1" />
          Save
        </Button>

        {/* Publish/Share dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="default">
              <Share2 className="h-4 w-4 mr-1" />
              Publish
              <ChevronDown className="h-4 w-4 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Share Options</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onPublish}>
              <Share2 className="h-4 w-4 mr-2" />
              Publish App
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Download className="h-4 w-4 mr-2" />
              Export Schema
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

// Tab button component
interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

function TabButton({ active, onClick, icon, label }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
        active 
          ? "bg-background text-foreground shadow-sm" 
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

// Separator component
function Separator({ className }: { className?: string }) {
  return <div className={cn("w-px bg-border", className)} />;
}
