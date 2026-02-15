'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  MoreVertical, Edit, Eye, Trash2, Star, StarOff, 
  ExternalLink, Copy, Share2, Globe, Lock, Clock
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

interface AppData {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  iconColor: string;
  published: boolean;
  recordCount: number;
  createdAt: string;
  updatedAt: string;
}

interface AppCardProps {
  app: AppData;
  viewMode: 'grid' | 'list';
  onEdit: () => void;
  onView: () => void;
  onDelete: () => void;
}

export function AppCard({ app, viewMode, onEdit, onView, onDelete }: AppCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString();
  };

  const handleDelete = () => {
    setShowDeleteDialog(false);
    onDelete();
  };

  if (viewMode === 'list') {
    return (
      <>
        <Card className="p-4 hover:shadow-md transition-all cursor-pointer group">
          <div className="flex items-center gap-4">
            {/* Icon */}
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 shadow-sm"
              style={{ backgroundColor: app.iconColor || '#3B82F6' }}
            >
              {app.icon || '📱'}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold truncate">{app.name}</h3>
                {app.published ? (
                  <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
                    <Globe className="h-3 w-3 mr-1" />
                    Published
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800">
                    <Lock className="h-3 w-3 mr-1" />
                    Draft
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground truncate">
                {app.description || 'No description'}
              </p>
            </div>

            {/* Stats */}
            <div className="hidden sm:flex items-center gap-4 text-sm text-muted-foreground">
              <span>{app.recordCount} records</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDate(app.updatedAt)}
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onEdit}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit App
                  </DropdownMenuItem>
                  {app.published && (
                    <DropdownMenuItem onClick={onView}>
                      <Eye className="h-4 w-4 mr-2" />
                      View App
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => setIsFavorite(!isFavorite)}
                  >
                    {isFavorite ? (
                      <>
                        <StarOff className="h-4 w-4 mr-2" />
                        Remove from Favorites
                      </>
                    ) : (
                      <>
                        <Star className="h-4 w-4 mr-2" />
                        Add to Favorites
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="text-destructive focus:text-destructive"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </Card>

        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete App</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete &quot;{app.name}&quot;? This will also delete all 
                {app.recordCount} records and cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  // Grid view
  return (
    <>
      <Card className="group overflow-hidden hover:shadow-lg transition-all cursor-pointer">
        {/* Color bar */}
        <div 
          className="h-2"
          style={{ backgroundColor: app.iconColor || '#3B82F6' }}
        />

        <div className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-sm"
              style={{ backgroundColor: app.iconColor || '#3B82F6' }}
            >
              {app.icon || '📱'}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit App
                </DropdownMenuItem>
                {app.published && (
                  <DropdownMenuItem onClick={onView}>
                    <Eye className="h-4 w-4 mr-2" />
                    View App
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setIsFavorite(!isFavorite)}>
                  {isFavorite ? (
                    <>
                      <StarOff className="h-4 w-4 mr-2" />
                      Unfavorite
                    </>
                  ) : (
                    <>
                      <Star className="h-4 w-4 mr-2" />
                      Favorite
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-destructive focus:text-destructive"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Info */}
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold truncate">{app.name}</h3>
              {isFavorite && (
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              )}
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {app.description || 'No description'}
            </p>
          </div>

          {/* Status and Stats */}
          <div className="flex items-center justify-between">
            {app.published ? (
              <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
                <Globe className="h-3 w-3 mr-1" />
                Published
              </Badge>
            ) : (
              <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800">
                <Lock className="h-3 w-3 mr-1" />
                Draft
              </Badge>
            )}

            <div className="text-xs text-muted-foreground">
              {app.recordCount} records
            </div>
          </div>

          {/* Updated time */}
          <div className="mt-3 pt-3 border-t flex items-center justify-between">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDate(app.updatedAt)}
            </span>

            {/* Quick actions on hover */}
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                className="h-7"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
              >
                <Edit className="h-3 w-3 mr-1" />
                Edit
              </Button>
              {app.published && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7"
                  onClick={(e) => {
                    e.stopPropagation();
                    onView();
                  }}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Open
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete App</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{app.name}&quot;? This will also delete all 
              {app.recordCount} records and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
