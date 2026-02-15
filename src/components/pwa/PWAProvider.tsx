'use client';

import { useState, useEffect } from 'react';
import { InstallPrompt } from './InstallPrompt';
import { OfflineIndicator } from './OfflineIndicator';
import { usePWA } from '@/hooks/use-pwa';

interface PWAProviderProps {
  children: React.ReactNode;
}

export function PWAProvider({ children }: PWAProviderProps) {
  const { isOnline, canInstall, isInstalled, install } = usePWA();
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    // Check if user has dismissed the prompt before
    const dismissed = localStorage.getItem('appflow-install-dismissed');
    const dismissedTime = dismissed ? new Date(dismissed).getTime() : 0;
    const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);

    // Show prompt if not dismissed recently (within 7 days) and can install
    if ((canInstall || isIOSSafari()) && (!dismissed || daysSinceDismissed > 7)) {
      // Delay showing the prompt for better UX
      const timer = setTimeout(() => {
        setShowInstallPrompt(true);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [canInstall]);

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    localStorage.setItem('appflow-install-dismissed', new Date().toISOString());
  };

  return (
    <>
      {children}
      
      {/* Offline indicator */}
      <OfflineIndicator isOnline={isOnline} />
      
      {/* Install prompt */}
      {showInstallPrompt && (
        <InstallPrompt
          onInstall={install}
          onDismiss={handleDismiss}
          canInstall={canInstall}
          isInstalled={isInstalled}
        />
      )}
    </>
  );
}

// Helper to detect iOS Safari
function isIOSSafari(): boolean {
  if (typeof window === 'undefined') return false;
  
  const userAgent = window.navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(userAgent);
  const isSafari = /Safari/.test(userAgent) && !/CriOS|FxiOS/.test(userAgent);
  
  return isIOS && isSafari;
}
