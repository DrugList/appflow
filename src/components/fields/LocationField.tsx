'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Loader2, Check, AlertCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: number;
  address?: string;
}

interface LocationFieldProps {
  id: string;
  label: string;
  value?: LocationData | null;
  onChange: (value: LocationData | null) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  description?: string;
  error?: string;
}

export function LocationField({
  id,
  label,
  value,
  onChange,
  placeholder = 'Capture location',
  disabled = false,
  required = false,
  description,
  error,
}: LocationFieldProps) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureError, setCaptureError] = useState<string | null>(null);

  const captureLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setCaptureError('Geolocation is not supported by your browser');
      return;
    }

    setIsCapturing(true);
    setCaptureError(null);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          (err) => reject(err),
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          }
        );
      });

      const locationData: LocationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp,
      };

      // Try to get address via reverse geocoding
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${locationData.latitude}&lon=${locationData.longitude}`,
          {
            headers: {
              'Accept-Language': 'en',
            },
          }
        );
        if (response.ok) {
          const data = await response.json();
          locationData.address = data.display_name;
        }
      } catch {
        // Ignore geocoding errors
      }

      onChange(locationData);
    } catch (err) {
      const geoError = err as GeolocationPositionError;
      let message = 'Failed to capture location';
      
      switch (geoError.code) {
        case geoError.PERMISSION_DENIED:
          message = 'Location permission denied. Please enable location access.';
          break;
        case geoError.POSITION_UNAVAILABLE:
          message = 'Location information unavailable.';
          break;
        case geoError.TIMEOUT:
          message = 'Location request timed out.';
          break;
      }
      
      setCaptureError(message);
    } finally {
      setIsCapturing(false);
    }
  }, [onChange]);

  const clearLocation = useCallback(() => {
    onChange(null);
    setCaptureError(null);
  }, [onChange]);

  const openInMaps = useCallback(() => {
    if (value) {
      const url = `https://www.google.com/maps?q=${value.latitude},${value.longitude}`;
      window.open(url, '_blank');
    }
  }, [value]);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4 text-muted-foreground" />
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      </div>

      <AnimatePresence mode="wait">
        {!value ? (
          <motion.div
            key="capture"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            <Button
              type="button"
              variant="outline"
              className={cn(
                "w-full h-auto py-4 border-dashed",
                error && "border-destructive"
              )}
              onClick={captureLocation}
              disabled={disabled || isCapturing}
            >
              {isCapturing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Capturing location...
                </>
              ) : (
                <>
                  <MapPin className="h-4 w-4 mr-2" />
                  {placeholder}
                </>
              )}
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="location"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-lg border bg-muted/30 p-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400">
                  <Check className="h-4 w-4" />
                  Location captured
                </div>
                
                <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                  <div className="font-mono">
                    {value.latitude.toFixed(6)}, {value.longitude.toFixed(6)}
                  </div>
                  {value.accuracy && (
                    <div>Accuracy: ±{Math.round(value.accuracy)}m</div>
                  )}
                  {value.address && (
                    <div className="truncate" title={value.address}>
                      {value.address}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={openInMaps}
                  title="Open in Google Maps"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
                {!disabled && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={clearLocation}
                    title="Clear location"
                  >
                    ×
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {(error || captureError) && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="flex items-center gap-2 text-sm text-destructive"
        >
          <AlertCircle className="h-4 w-4" />
          {error || captureError}
        </motion.div>
      )}

      {description && !error && !captureError && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
