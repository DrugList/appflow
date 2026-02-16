'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScanLine, Camera, Check, AlertCircle, X, Keyboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface BarcodeFieldProps {
  id: string;
  label: string;
  value?: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  description?: string;
  error?: string;
  formats?: ('qr' | 'code128' | 'code39' | 'ean13' | 'upc')[];
}

export function BarcodeField({
  id,
  label,
  value,
  onChange,
  placeholder = 'Scan or enter barcode',
  disabled = false,
  required = false,
  description,
  error,
  formats = ['qr', 'code128', 'code39', 'ean13', 'upc'],
}: BarcodeFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [showManualInput, setShowManualInput] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Cleanup camera on unmount or dialog close
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      // Reset state asynchronously to avoid cascading renders
      const timer = setTimeout(() => {
        setScanError(null);
        setIsScanning(false);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen, stopCamera]);

  const startCamera = async () => {
    try {
      setScanError(null);
      setIsScanning(true);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        
        // Start scanning for barcodes
        scanForBarcode();
      }
    } catch (err) {
      console.error('Camera error:', err);
      setScanError('Could not access camera. Please check permissions.');
      setIsScanning(false);
    }
  };

  const scanForBarcode = async () => {
    // Simple implementation - in production you'd use a library like zxing or quagga
    // For now, we'll simulate scanning with a timeout
    // Real implementation would process video frames
    
    const video = videoRef.current;
    if (!video || !streamRef.current) return;

    // For demo purposes, show instructions
    // In production, integrate with a barcode scanning library
    setScanError('Point your camera at a barcode or QR code');
  };

  const handleManualSubmit = () => {
    if (manualInput.trim()) {
      onChange(manualInput.trim());
      setIsOpen(false);
      setManualInput('');
    }
  };

  const handleSimulatedScan = (scannedValue: string) => {
    onChange(scannedValue);
    setIsOpen(false);
    stopCamera();
  };

  const clearValue = useCallback(() => {
    onChange(null);
  }, [onChange]);

  // Demo barcode values for testing
  const demoBarcodes = [
    { type: 'QR Code', value: 'DEMO-QR-12345' },
    { type: 'EAN-13', value: '5901234123457' },
    { type: 'Code128', value: 'CODE128-DEMO' },
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <ScanLine className="h-4 w-4 text-muted-foreground" />
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      </div>

      <AnimatePresence mode="wait">
        {!value ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "w-full h-auto py-4 border-dashed",
                    error && "border-destructive"
                  )}
                  disabled={disabled}
                >
                  <ScanLine className="h-4 w-4 mr-2" />
                  {placeholder}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Scan Barcode/QR Code</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {/* Camera view */}
                  <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                    <video
                      ref={videoRef}
                      className="w-full h-full object-cover"
                      playsInline
                      muted
                    />
                    
                    {/* Scanning overlay */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-48 h-48 border-2 border-white/50 rounded-lg">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-white text-sm text-center p-4">
                            {isScanning ? 'Align barcode within frame' : 'Starting camera...'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {scanError && (
                    <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                      <AlertCircle className="h-4 w-4" />
                      {scanError}
                    </div>
                  )}

                  {/* Camera controls */}
                  <div className="flex gap-2">
                    {!isScanning ? (
                      <Button 
                        type="button"
                        className="flex-1" 
                        onClick={startCamera}
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        Start Camera
                      </Button>
                    ) : (
                      <Button 
                        type="button"
                        variant="outline" 
                        className="flex-1" 
                        onClick={stopCamera}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Stop Camera
                      </Button>
                    )}
                  </div>

                  {/* Manual input toggle */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs text-muted-foreground">or</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>

                  {!showManualInput ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => setShowManualInput(true)}
                    >
                      <Keyboard className="h-4 w-4 mr-2" />
                      Enter Manually
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <Input
                        value={manualInput}
                        onChange={(e) => setManualInput(e.target.value)}
                        placeholder="Enter barcode value"
                        onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
                      />
                      <Button 
                        type="button"
                        className="w-full" 
                        onClick={handleManualSubmit}
                        disabled={!manualInput.trim()}
                      >
                        Submit
                      </Button>
                    </div>
                  )}

                  {/* Demo buttons for testing */}
                  <div className="space-y-2">
                    <div className="text-xs text-muted-foreground">Demo values (for testing):</div>
                    <div className="flex flex-wrap gap-2">
                      {demoBarcodes.map((demo) => (
                        <Button
                          key={demo.value}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleSimulatedScan(demo.value)}
                        >
                          {demo.type}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </motion.div>
        ) : (
          <motion.div
            key="scanned"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-lg border bg-muted/30 p-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400">
                  <Check className="h-4 w-4" />
                  Code scanned
                </div>
                <div className="mt-1 font-mono text-sm bg-background px-2 py-1 rounded inline-block">
                  {value}
                </div>
              </div>

              <div className="flex gap-1">
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                  <DialogTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={disabled}
                    >
                      <ScanLine className="h-4 w-4 mr-1" />
                      Rescan
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Scan Barcode/QR Code</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                        <video
                          ref={videoRef}
                          className="w-full h-full object-cover"
                          playsInline
                          muted
                        />
                      </div>
                      <Button 
                        type="button"
                        className="w-full" 
                        onClick={startCamera}
                        disabled={isScanning}
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        {isScanning ? 'Scanning...' : 'Start Camera'}
                      </Button>
                      {demoBarcodes.map((demo) => (
                        <Button
                          key={demo.value}
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mr-2"
                          onClick={() => handleSimulatedScan(demo.value)}
                        >
                          {demo.type}
                        </Button>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
                {!disabled && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={clearValue}
                    title="Clear"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {description && !error && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
