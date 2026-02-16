'use client';

import { useState, useEffect } from 'react';
import {
  Database, ExternalLink, RefreshCw, Loader2,
  Unlink, Download, Upload
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface GoogleSheetsConnectorProps {
  appId: string;
  onConnectionChange?: (connected: boolean) => void;
}

interface DataSource {
  id: string;
  name: string;
  type: string;
  config: string;
  lastSync: string | null;
}

interface Spreadsheet {
  id: string;
  name: string;
}

export function GoogleSheetsConnector({ appId, onConnectionChange }: GoogleSheetsConnectorProps) {
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [dataSource, setDataSource] = useState<DataSource | null>(null);
  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const [spreadsheets, setSpreadsheets] = useState<Spreadsheet[]>([]);
  const [selectedSpreadsheet, setSelectedSpreadsheet] = useState('');
  const [sheetName, setSheetName] = useState('Sheet1');
  const [syncing, setSyncing] = useState(false);
  const [syncAction, setSyncAction] = useState<'push' | 'pull' | null>(null);

  // Check for existing connection on mount
  useEffect(() => {
    checkConnection();
  }, [appId]);

  // Check for OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const googleConnected = params.get('google_sheets_connected');
    const accessToken = params.get('access_token');
    const spreadsheetsParam = params.get('spreadsheets');

    if (googleConnected === 'true' && accessToken && spreadsheetsParam) {
      try {
        const sheets = JSON.parse(decodeURIComponent(spreadsheetsParam));
        setSpreadsheets(sheets);
        setShowConnectDialog(true);

        // Store tokens temporarily
        localStorage.setItem('gs_access_token', accessToken);
        const refreshToken = params.get('refresh_token');
        if (refreshToken) {
          localStorage.setItem('gs_refresh_token', refreshToken);
        }

        // Clean up URL
        window.history.replaceState({}, '', window.location.pathname);
      } catch (e) {
        console.error('Failed to parse spreadsheets:', e);
      }
    }
  }, []);

  const checkConnection = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/integrations/google-sheets?appId=${appId}`);
      if (response.ok) {
        const data = await response.json();
        setDataSource(data.dataSource || null);
        onConnectionChange?.(!!data.dataSource);
      }
    } catch (error) {
      console.error('Failed to check connection:', error);
    } finally {
      setLoading(false);
    }
  };

  const initiateConnect = async () => {
    setConnecting(true);
    try {
      const response = await fetch(`/api/integrations/google-sheets/auth?appId=${appId}`);
      if (response.ok) {
        const data = await response.json();
        window.location.href = data.authUrl;
      } else {
        throw new Error('Failed to get auth URL');
      }
    } catch (error) {
      console.error('Connect error:', error);
      toast.error('Failed to connect to Google Sheets');
      setConnecting(false);
    }
  };

  const saveConnection = async () => {
    if (!selectedSpreadsheet) {
      toast.error('Please select a spreadsheet');
      return;
    }

    const accessToken = localStorage.getItem('gs_access_token');
    const refreshToken = localStorage.getItem('gs_refresh_token');

    try {
      const response = await fetch('/api/integrations/google-sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appId,
          spreadsheetId: selectedSpreadsheet,
          sheetName,
          accessToken,
          refreshToken,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setDataSource(data.dataSource);
        setShowConnectDialog(false);
        onConnectionChange?.(true);
        toast.success('Connected to Google Sheets!');
      } else {
        throw new Error('Failed to save connection');
      }
    } catch (error) {
      console.error('Save connection error:', error);
      toast.error('Failed to save connection');
    }
  };

  const disconnect = async () => {
    try {
      const response = await fetch(`/api/integrations/google-sheets?appId=${appId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setDataSource(null);
        onConnectionChange?.(false);
        toast.success('Disconnected from Google Sheets');
      } else {
        throw new Error('Failed to disconnect');
      }
    } catch (error) {
      console.error('Disconnect error:', error);
      toast.error('Failed to disconnect');
    }
  };

  const syncData = async (action: 'push' | 'pull') => {
    setSyncing(true);
    setSyncAction(action);
    try {
      const response = await fetch('/api/integrations/google-sheets/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appId, action }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        checkConnection();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Sync failed');
      }
    } catch (error) {
      console.error('Sync error:', error);
      toast.error(error instanceof Error ? error.message : 'Sync failed');
    } finally {
      setSyncing(false);
      setSyncAction(null);
    }
  };

  if (loading) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Checking connection...</span>
        </div>
      </Card>
    );
  }

  // Not connected
  if (!dataSource) {
    return (
      <>
        <Card
          className="p-4 border-dashed cursor-pointer hover:border-green-500/50 transition-colors"
          onClick={initiateConnect}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Database className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Google Sheets</p>
              <p className="text-xs text-muted-foreground">Connect to a spreadsheet</p>
            </div>
            {connecting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </Card>

        <Dialog open={showConnectDialog} onOpenChange={setShowConnectDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Connect Google Sheets</DialogTitle>
              <DialogDescription>
                Select a spreadsheet to sync your app data
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Select Spreadsheet</Label>
                {spreadsheets.length > 0 ? (
                  <Select value={selectedSpreadsheet} onValueChange={setSelectedSpreadsheet}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a spreadsheet" />
                    </SelectTrigger>
                    <SelectContent>
                      {spreadsheets.map((sheet) => (
                        <SelectItem key={sheet.id} value={sheet.id}>
                          {sheet.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    No spreadsheets found. Create one in Google Drive first.
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Sheet Name</Label>
                <Input
                  value={sheetName}
                  onChange={(e) => setSheetName(e.target.value)}
                  placeholder="Sheet1"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowConnectDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={saveConnection} disabled={!selectedSpreadsheet}>
                  Connect
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Connected
  const config = JSON.parse(dataSource.config || '{}');

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Database className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">Google Sheets</p>
                <Badge variant="default" className="text-xs bg-green-600">
                  Connected
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {config.sheetName || 'Sheet1'}
                {dataSource.lastSync && (
                  <span className="ml-2">
                    • Last sync: {new Date(dataSource.lastSync).toLocaleString()}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => syncData('push')}
            disabled={syncing}
          >
            {syncing && syncAction === 'push' ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            Push to Sheets
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => syncData('pull')}
            disabled={syncing}
          >
            {syncing && syncAction === 'pull' ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Pull from Sheets
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={disconnect}
            className="text-destructive"
          >
            <Unlink className="h-4 w-4 mr-2" />
            Disconnect
          </Button>
        </div>
      </div>
    </Card>
  );
}
