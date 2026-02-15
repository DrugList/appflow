'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, CloudOff, Cloud } from 'lucide-react';

interface OfflineIndicatorProps {
  isOnline: boolean;
}

export function OfflineIndicator({ isOnline }: OfflineIndicatorProps) {
  return (
    <>
      {/* Status bar indicator */}
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-amber-950 py-1.5 px-4 text-center text-sm font-medium flex items-center justify-center gap-2"
          >
            <CloudOff className="h-4 w-4" />
            <span>You&apos;re offline. Changes will sync when you&apos;re back online.</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fixed position badge */}
      <motion.div
        className="fixed bottom-4 right-4 z-40"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1 }}
      >
        <div 
          className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${
            isOnline 
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
              : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
          }`}
        >
          {isOnline ? (
            <>
              <Cloud className="h-3 w-3" />
              <Wifi className="h-3 w-3" />
            </>
          ) : (
            <>
              <CloudOff className="h-3 w-3" />
              <WifiOff className="h-3 w-3" />
            </>
          )}
        </div>
      </motion.div>
    </>
  );
}
