'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Share, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface InstallPromptProps {
  onInstall: () => Promise<boolean>;
  onDismiss: () => void;
  canInstall: boolean;
  isInstalled: boolean;
}

export function InstallPrompt({ onInstall, onDismiss, canInstall, isInstalled }: InstallPromptProps) {
  const [isInstalling, setIsInstalling] = useState(false);
  const [showIosInstructions, setShowIosInstructions] = useState(false);

  // Check if iOS
  const isIos = typeof window !== 'undefined' && 
    /iPad|iPhone|iPod/.test(window.navigator.userAgent);

  const handleInstall = async () => {
    if (isIos) {
      setShowIosInstructions(true);
      return;
    }

    setIsInstalling(true);
    const installed = await onInstall();
    setIsInstalling(false);
    
    if (installed) {
      onDismiss();
    }
  };

  // Don't show if already installed
  if (isInstalled) return null;

  // Show iOS instructions modal
  if (showIosInstructions) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowIosInstructions(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="w-full max-w-sm p-6 space-y-4">
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">Install on iOS</h3>
                <p className="text-sm text-muted-foreground">
                  To install this app on your iOS device:
                </p>
              </div>
              <ol className="space-y-3 text-sm">
                <li className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">1</span>
                  <span>Tap the</span>
                  <Share className="h-4 w-4 text-primary" />
                  <span>Share button at the bottom</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">2</span>
                  <span>Scroll down and tap</span>
                  <span className="font-medium">&quot;Add to Home Screen&quot;</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">3</span>
                  <span>Tap</span>
                  <span className="font-medium">&quot;Add&quot;</span>
                  <span>in the top right</span>
                </li>
              </ol>
              <Button className="w-full" onClick={() => setShowIosInstructions(false)}>
                Got it!
              </Button>
            </Card>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Show install prompt banner
  if (canInstall || isIos) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-4 left-4 right-4 z-40 md:left-auto md:right-4 md:max-w-sm"
        >
          <Card className="p-4 shadow-lg border-primary/20">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Download className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm">Install AppFlow</h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Install this app for a better experience and offline access
                </p>
                <div className="flex gap-2 mt-3">
                  <Button 
                    size="sm" 
                    onClick={handleInstall}
                    disabled={isInstalling}
                    className="flex-1"
                  >
                    {isInstalling ? 'Installing...' : isIos ? (
                      <>
                        <Plus className="h-4 w-4 mr-1" />
                        Add to Home
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-1" />
                        Install
                      </>
                    )}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={onDismiss}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </AnimatePresence>
    );
  }

  return null;
}
