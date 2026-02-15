'use client';

import { useState, useEffect, useCallback } from 'react';

interface QueuedAction {
  id: string;
  type: 'create' | 'update' | 'delete';
  endpoint: string;
  data: Record<string, unknown>;
  timestamp: number;
  retries: number;
}

const QUEUE_STORAGE_KEY = 'appflow-offline-queue';
const MAX_RETRIES = 3;

export function useOffline() {
  const [isOnline, setIsOnline] = useState(true);
  const [queue, setQueue] = useState<QueuedAction[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Initialize from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(QUEUE_STORAGE_KEY);
    if (stored) {
      try {
        setQueue(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse offline queue:', e);
        localStorage.removeItem(QUEUE_STORAGE_KEY);
      }
    }
  }, []);

  // Persist queue to localStorage
  useEffect(() => {
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
  }, [queue]);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncQueue();
    };
    const handleOffline = () => setIsOnline(false);

    // Check initial status
    setIsOnline(navigator.onLine);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Add action to queue
  const queueAction = useCallback((
    type: QueuedAction['type'],
    endpoint: string,
    data: Record<string, unknown>
  ): string => {
    const id = `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const action: QueuedAction = {
      id,
      type,
      endpoint,
      data,
      timestamp: Date.now(),
      retries: 0,
    };

    setQueue((prev) => [...prev, action]);
    return id;
  }, []);

  // Remove action from queue
  const removeAction = useCallback((id: string) => {
    setQueue((prev) => prev.filter((a) => a.id !== id));
  }, []);

  // Sync queued actions
  const syncQueue = useCallback(async () => {
    if (isSyncing || queue.length === 0) return;

    setIsSyncing(true);
    const failedActions: QueuedAction[] = [];

    for (const action of queue) {
      try {
        const response = await fetch(action.endpoint, {
          method: action.type === 'create' ? 'POST' : 
                  action.type === 'update' ? 'PUT' : 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(action.data),
        });

        if (response.ok) {
          removeAction(action.id);
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      } catch (error) {
        console.error('Sync failed for action:', action.id, error);
        
        if (action.retries < MAX_RETRIES) {
          failedActions.push({
            ...action,
            retries: action.retries + 1,
          });
        } else {
          console.warn('Max retries exceeded for action:', action.id);
          // Could dispatch event for UI notification
          window.dispatchEvent(new CustomEvent('offline-sync-failed', { 
            detail: action 
          }));
        }
      }
    }

    // Update queue with failed actions that can retry
    setQueue(failedActions);
    setIsSyncing(false);
  }, [queue, isSyncing, removeAction]);

  // Clear queue
  const clearQueue = useCallback(() => {
    setQueue([]);
    localStorage.removeItem(QUEUE_STORAGE_KEY);
  }, []);

  // Execute with offline fallback
  const executeWithFallback = useCallback(async <T,>(
    endpoint: string,
    options: RequestInit,
    fallbackData?: Record<string, unknown>
  ): Promise<{ success: boolean; data?: T; queued?: boolean; error?: string }> => {
    // If online, try direct execution
    if (isOnline) {
      try {
        const response = await fetch(endpoint, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
        });

        if (response.ok) {
          const data = await response.json();
          return { success: true, data };
        }

        return { 
          success: false, 
          error: `HTTP ${response.status}` 
        };
      } catch (error) {
        console.error('Request failed:', error);
        // Fall through to offline handling
      }
    }

    // Offline - queue the action
    if (fallbackData) {
      const method = options.method?.toUpperCase() || 'POST';
      const type: QueuedAction['type'] = 
        method === 'POST' ? 'create' :
        method === 'PUT' ? 'update' : 'delete';

      const actionId = queueAction(type, endpoint, fallbackData);
      return { 
        success: true, 
        queued: true, 
        data: { id: actionId, offline: true } as T 
      };
    }

    return { 
      success: false, 
      error: 'Offline and no fallback data provided' 
    };
  }, [isOnline, queueAction]);

  return {
    isOnline,
    queue,
    queueSize: queue.length,
    isSyncing,
    queueAction,
    removeAction,
    syncQueue,
    clearQueue,
    executeWithFallback,
  };
}

// Hook for managing offline form submissions
export function useOfflineSubmission(appId: string) {
  const { isOnline, executeWithFallback, queueSize } = useOffline();

  const submitForm = useCallback(async (
    data: Record<string, unknown>
  ): Promise<{ success: boolean; recordId?: string; offline?: boolean; error?: string }> => {
    const result = await executeWithFallback<{ record?: { id: string } }>(
      `/api/apps/${appId}/records`,
      {
        method: 'POST',
        body: JSON.stringify({ data }),
      },
      { data, appId }
    );

    if (result.success) {
      return {
        success: true,
        recordId: result.data?.record?.id,
        offline: result.queued,
      };
    }

    return {
      success: false,
      error: result.error,
    };
  }, [appId, executeWithFallback]);

  return {
    isOnline,
    submitForm,
    pendingCount: queueSize,
  };
}
