import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AppSchema, FormField, ViewConfig, DataSource, AppSettings } from '@/types/app-builder';

// App Builder Store
interface AppBuilderState {
  // Current app being edited
  currentApp: AppSchema | null;
  
  // UI State
  selectedFieldId: string | null;
  selectedViewId: string | null;
  previewMode: boolean;
  sidebarTab: 'fields' | 'views' | 'data' | 'settings';
  
  // Dirty state
  isDirty: boolean;
  lastSaved: Date | null;
  
  // Actions
  setCurrentApp: (app: AppSchema | null) => void;
  updateAppName: (name: string) => void;
  updateAppDescription: (description: string) => void;
  updateAppIcon: (icon: string, color: string) => void;
  
  // Field actions
  addField: (field: FormField) => void;
  updateField: (fieldId: string, updates: Partial<FormField>) => void;
  removeField: (fieldId: string) => void;
  reorderFields: (fromIndex: number, toIndex: number) => void;
  selectField: (fieldId: string | null) => void;
  
  // View actions
  addView: (view: ViewConfig) => void;
  updateView: (viewId: string, updates: Partial<ViewConfig>) => void;
  removeView: (viewId: string) => void;
  selectView: (viewId: string | null) => void;
  
  // Data source actions
  setDataSource: (dataSource: DataSource | undefined) => void;
  
  // Settings actions
  updateSettings: (settings: Partial<AppSettings>) => void;
  
  // UI actions
  setPreviewMode: (enabled: boolean) => void;
  setSidebarTab: (tab: 'fields' | 'views' | 'data' | 'settings') => void;
  markSaved: () => void;
  resetState: () => void;
}

export const useAppBuilderStore = create<AppBuilderState>()(
  persist(
    (set, get) => ({
      currentApp: null,
      selectedFieldId: null,
      selectedViewId: null,
      previewMode: false,
      sidebarTab: 'fields',
      isDirty: false,
      lastSaved: null,

      setCurrentApp: (app) => set({ 
        currentApp: app, 
        selectedFieldId: null, 
        selectedViewId: null,
        isDirty: false 
      }),

      updateAppName: (name) => set((state) => ({
        currentApp: state.currentApp ? { ...state.currentApp, name } : null,
        isDirty: true,
      })),

      updateAppDescription: (description) => set((state) => ({
        currentApp: state.currentApp ? { ...state.currentApp, description } : null,
        isDirty: true,
      })),

      updateAppIcon: (icon, iconColor) => set((state) => ({
        currentApp: state.currentApp ? { ...state.currentApp, icon, iconColor } : null,
        isDirty: true,
      })),

      addField: (field) => set((state) => ({
        currentApp: state.currentApp 
          ? { ...state.currentApp, fields: [...state.currentApp.fields, field] }
          : null,
        selectedFieldId: field.id,
        isDirty: true,
      })),

      updateField: (fieldId, updates) => set((state) => ({
        currentApp: state.currentApp
          ? {
              ...state.currentApp,
              fields: state.currentApp.fields.map((f) =>
                f.id === fieldId ? { ...f, ...updates } as FormField : f
              ),
            }
          : null,
        isDirty: true,
      })),

      removeField: (fieldId) => set((state) => ({
        currentApp: state.currentApp
          ? {
              ...state.currentApp,
              fields: state.currentApp.fields.filter((f) => f.id !== fieldId),
              views: state.currentApp.views.map((v) => ({
                ...v,
                fields: v.fields.filter((f) => f !== fieldId),
              })),
            }
          : null,
        selectedFieldId: state.selectedFieldId === fieldId ? null : state.selectedFieldId,
        isDirty: true,
      })),

      reorderFields: (fromIndex, toIndex) => set((state) => {
        if (!state.currentApp) return state;
        const fields = [...state.currentApp.fields];
        const [removed] = fields.splice(fromIndex, 1);
        fields.splice(toIndex, 0, removed);
        return {
          currentApp: { ...state.currentApp, fields },
          isDirty: true,
        };
      }),

      selectField: (fieldId) => set({ 
        selectedFieldId: fieldId,
        previewMode: false,
      }),

      addView: (view) => set((state) => ({
        currentApp: state.currentApp
          ? { ...state.currentApp, views: [...state.currentApp.views, view] }
          : null,
        selectedViewId: view.id,
        isDirty: true,
      })),

      updateView: (viewId, updates) => set((state) => ({
        currentApp: state.currentApp
          ? {
              ...state.currentApp,
              views: state.currentApp.views.map((v) =>
                v.id === viewId ? { ...v, ...updates } : v
              ),
            }
          : null,
        isDirty: true,
      })),

      removeView: (viewId) => set((state) => ({
        currentApp: state.currentApp
          ? {
              ...state.currentApp,
              views: state.currentApp.views.filter((v) => v.id !== viewId),
            }
          : null,
        selectedViewId: state.selectedViewId === viewId ? null : state.selectedViewId,
        isDirty: true,
      })),

      selectView: (viewId) => set({ selectedViewId: viewId }),

      setDataSource: (dataSource) => set((state) => ({
        currentApp: state.currentApp
          ? { ...state.currentApp, dataSource }
          : null,
        isDirty: true,
      })),

      updateSettings: (settings) => set((state) => ({
        currentApp: state.currentApp
          ? { ...state.currentApp, settings: { ...state.currentApp.settings, ...settings } }
          : null,
        isDirty: true,
      })),

      setPreviewMode: (enabled) => set({ 
        previewMode: enabled,
        selectedFieldId: enabled ? null : get().selectedFieldId,
      }),

      setSidebarTab: (tab) => set({ sidebarTab: tab }),

      markSaved: () => set({ 
        isDirty: false, 
        lastSaved: new Date() 
      }),

      resetState: () => set({
        currentApp: null,
        selectedFieldId: null,
        selectedViewId: null,
        previewMode: false,
        isDirty: false,
      }),
    }),
    {
      name: 'appflow-builder-storage',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        currentApp: state.currentApp,
      }),
    }
  )
);

// User Settings Store
interface UserSettingsState {
  theme: 'light' | 'dark' | 'system';
  favoriteApps: string[];
  installedApps: string[];
  sidebarCollapsed: boolean;
  viewMode: 'table' | 'cards';
  
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  toggleFavorite: (appId: string) => void;
  addInstalledApp: (appId: string) => void;
  removeInstalledApp: (appId: string) => void;
  toggleSidebar: () => void;
  setViewMode: (mode: 'table' | 'cards') => void;
}

export const useUserSettingsStore = create<UserSettingsState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      favoriteApps: [],
      installedApps: [],
      sidebarCollapsed: false,
      viewMode: 'cards',

      setTheme: (theme) => set({ theme }),

      toggleFavorite: (appId) => set((state) => ({
        favoriteApps: state.favoriteApps.includes(appId)
          ? state.favoriteApps.filter((id) => id !== appId)
          : [...state.favoriteApps, appId],
      })),

      addInstalledApp: (appId) => set((state) => ({
        installedApps: state.installedApps.includes(appId)
          ? state.installedApps
          : [...state.installedApps, appId],
      })),

      removeInstalledApp: (appId) => set((state) => ({
        installedApps: state.installedApps.filter((id) => id !== appId),
      })),

      toggleSidebar: () => set((state) => ({ 
        sidebarCollapsed: !state.sidebarCollapsed 
      })),

      setViewMode: (mode) => set({ viewMode: mode }),
    }),
    {
      name: 'appflow-user-settings',
    }
  )
);

// Records Store (for data display)
interface AppRecord {
  id: string;
  appId: string;
  data: Record<string, unknown>;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

interface RecordsState {
  records: AppRecord[];
  loading: boolean;
  error: string | null;
  lastFetched: Date | null;
  
  setRecords: (records: AppRecord[]) => void;
  addRecord: (record: AppRecord) => void;
  updateRecord: (recordId: string, data: Record<string, unknown>) => void;
  deleteRecord: (recordId: string) => void;
  toggleFavorite: (recordId: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useRecordsStore = create<RecordsState>()((set) => ({
  records: [],
  loading: false,
  error: null,
  lastFetched: null,

  setRecords: (records) => set({ 
    records, 
    lastFetched: new Date(),
    error: null 
  }),

  addRecord: (record) => set((state) => ({
    records: [record, ...state.records],
  })),

  updateRecord: (recordId, data) => set((state) => ({
    records: state.records.map((r) =>
      r.id === recordId ? { ...r, data: { ...r.data, ...data }, updatedAt: new Date().toISOString() } : r
    ),
  })),

  deleteRecord: (recordId) => set((state) => ({
    records: state.records.filter((r) => r.id !== recordId),
  })),

  toggleFavorite: (recordId) => set((state) => ({
    records: state.records.map((r) =>
      r.id === recordId ? { ...r, isFavorite: !r.isFavorite } : r
    ),
  })),

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error }),
}));
