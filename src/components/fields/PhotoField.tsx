'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, X, RotateCcw, Check, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface PhotoFieldProps {
  id: string;
  label: string;
  value?: string | null; // Base64 encoded image
  onChange: (value: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  description?: string;
  error?: string;
  allowCamera?: boolean;
  allowGallery?: boolean;
  maxWidth?: number;
  maxHeight?: number;
}

export function PhotoField({
  id,
  label,
  value,
  onChange,
  placeholder = 'Add photo',
  disabled = false,
  required = false,
  description,
  error,
  allowCamera = true,
  allowGallery = true,
  maxWidth = 1920,
  maxHeight = 1080,
}: PhotoFieldProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const processImage = useCallback(async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // Create canvas for resizing
          const canvas = document.createElement('canvas');
          let { width, height } = img;
          
          // Calculate new dimensions
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width *= ratio;
            height *= ratio;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }
          
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to base64 with compression
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          resolve(dataUrl);
        };
        
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }, [maxWidth, maxHeight]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setLocalError('Please select an image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setLocalError('Image size must be less than 10MB');
      return;
    }

    setIsLoading(true);
    setLocalError(null);

    try {
      const base64 = await processImage(file);
      onChange(base64);
    } catch (err) {
      setLocalError('Failed to process image');
      console.error(err);
    } finally {
      setIsLoading(false);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };

  const clearPhoto = useCallback(() => {
    onChange(null);
    setLocalError(null);
  }, [onChange]);

  const triggerCamera = () => {
    cameraInputRef.current?.click();
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Camera className="h-4 w-4 text-muted-foreground" />
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />

      <AnimatePresence mode="wait">
        {!value ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            <div 
              className={cn(
                "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
                error && "border-destructive",
                !disabled && "hover:border-primary/50 hover:bg-primary/5"
              )}
            >
              {isLoading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Processing...</p>
                </div>
              ) : (
                <>
                  <Camera className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-4">{placeholder}</p>
                  
                  <div className="flex gap-2 justify-center">
                    {allowCamera && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={triggerCamera}
                        disabled={disabled}
                      >
                        <Camera className="h-4 w-4 mr-1" />
                        Camera
                      </Button>
                    )}
                    {allowGallery && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={triggerFileInput}
                        disabled={disabled}
                      >
                        <Upload className="h-4 w-4 mr-1" />
                        Gallery
                      </Button>
                    )}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="photo"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-lg border bg-muted/30 p-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400">
                  <Check className="h-4 w-4" />
                  Photo captured
                </div>
              </div>
              {!disabled && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={clearPhoto}
                  title="Remove photo"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            <div className="mt-2 relative">
              <img 
                src={value} 
                alt="Captured" 
                className="max-h-48 rounded border mx-auto"
              />
              
              {!disabled && (
                <div className="mt-2 flex gap-2 justify-center">
                  {allowCamera && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={triggerCamera}
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Retake
                    </Button>
                  )}
                  {allowGallery && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={triggerFileInput}
                    >
                      <Upload className="h-4 w-4 mr-1" />
                      Replace
                    </Button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {(error || localError) && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {error || localError}
        </div>
      )}

      {description && !error && !localError && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
