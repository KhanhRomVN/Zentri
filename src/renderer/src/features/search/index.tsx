import { useState, useEffect, useCallback, useMemo } from 'react';
import LeftPanel from './components/LeftPanel';
import RightPanel from './components/RightPanel/RightPanel';
import HeaderBar from './components/HeaderBar';
import ViewEditorDrawer from './components/view-editor/ViewEditorDrawer';
import { SmartView } from './types/search';
import { useSearchTableState } from './hooks/useSearchTableState';
import { useSearchFilter } from './hooks/useSearchFilter';
import useSearchData from '../../hooks/useSearchData';

const STORAGE_KEY = 'zentri_search_views';
const CACHE_KEY = 'zentri_search_recent';

// In-memory cache for recently used timestamps (survives session)
let recentCache: Record<string, string> = {};

const loadRecentCache = async () => {
  try {
    // @ts-ignore
    const cached = await window.electron.ipcRenderer.invoke('storage:get', CACHE_KEY);
    if (cached && typeof cached === 'object') {
      recentCache = cached;
    }
  } catch {
    // ignore
  }
};

const saveRecentCache = async () => {
  try {
    // @ts-ignore
    await window.electron.ipcRenderer.invoke('storage:set', CACHE_KEY, recentCache);
  } catch {
    // ignore
  }
};

const SearchManager = () => {
  const [views, setViews] = useState<SmartView[]>([]);
  const [selectedViewId, setSelectedViewId] = useState<string | null>(null);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [editingView, setEditingView] = useState<SmartView | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [tableSearch, setTableSearch] = useState('');
  const [showFilterBar, setShowFilterBar] = useState(false);

  const selectedView = views.find((v) => v.id === selectedViewId) || null;

  // Get available columns from selected view
  const availableColumns = useMemo(() => {
    if (!selectedView) return [];
    return selectedView.columns.filter((c) => c.isVisible).map((c) => c.field || c.id);
  }, [selectedView]);

  // Table state
  const {
    sorting,
    setSorting,
    columnVisibility,
    setColumnVisibility,
    columnSizing,
    setColumnSizing,
    columnOrder,
    setColumnOrder,
  } = useSearchTableState({
    viewId: selectedViewId,
    defaultColumns: availableColumns,
  });

  // Filter state
  const { filters, addFilter, removeFilter, clearFilters, updateFilter, filterCount } =
    useSearchFilter({
      viewId: selectedViewId,
      availableColumns,
    });

  // Data state
  const { data, loading, refresh } = useSearchData({
    selectedView,
    autoLoad: true,
  });

  // Load views from storage + fetch services on mount
  useEffect(() => {
    const loadViews = async () => {
      try {
        // @ts-ignore
        const [saved, dbServices, accountCounts] = await Promise.all([
          window.electron.ipcRenderer.invoke('storage:get', STORAGE_KEY),
          window.electron.ipcRenderer.invoke(
            'sqlite:all',
            'SELECT * FROM services ORDER BY name ASC',
          ),
          window.electron.ipcRenderer.invoke(
            'sqlite:all',
            'SELECT se.service_id, COUNT(DISTINCT se.email_id) as cnt FROM service_emails se GROUP BY se.service_id',
          ),
        ]);

        console.log('[SearchManager] DB query results:', {
          saved: saved ? (Array.isArray(saved) ? saved.length : typeof saved) : 'null/undefined',
          dbServicesCount: dbServices?.length ?? 0,
          accountCountsCount: accountCounts?.length ?? 0,
        });

        await loadRecentCache();

        // Only keep user-created views (not service cards from previous save)
        // Normalize: views without explicit source or with non-service source → 'manual'
        const userViews: SmartView[] =
          saved && Array.isArray(saved)
            ? saved
                .filter((v: SmartView) => v.source !== 'service')
                .map((v: SmartView) => ({
                  ...v,
                  source: v.source && v.source !== 'service' ? v.source : 'manual',
                }))
            : [];
        console.log(
          '[SearchManager] userViews:',
          userViews.length,
          userViews.map((v) => `${v.name}(${v.source})`),
        );

        // Build account count map from DB
        const countMap: Record<string, number> = {};
        (accountCounts || []).forEach((row: any) => {
          countMap[row.service_id] = row.cnt;
        });

        // Build DB services map for quick lookup (id -> db row)
        const dbServiceMap: Record<string, any> = {};
        (dbServices || []).forEach((svc: any) => {
          dbServiceMap[svc.id] = svc;
        });
        console.log('[SearchManager] dbServiceMap keys:', Object.keys(dbServiceMap).length);

        // Create service views from DB services only
        const serviceViews: SmartView[] = (dbServices || []).map((svc: any) => ({
          id: `svc_${svc.id}`,
          name: svc.name,
          description: svc.url || '',
          domain: svc.url
            ? (() => {
                try {
                  return new URL(svc.url).hostname;
                } catch {
                  return '';
                }
              })()
            : '',
          color: '#3B82F6',
          icon: '',
          source: 'service' as const,
          serviceId: svc.id,
          accountCount: countMap[svc.id] || 0,
          lastUsedAt: recentCache[`svc_${svc.id}`] || undefined,
          columns: [
            {
              id: 'col_stt',
              label: 'STT',
              type: 'number' as const,
              field: '_stt',
              isVisible: true,
              isSortable: false,
              isFilterable: false,
            },
            {
              id: 'col_email',
              label: 'Email',
              type: 'email' as const,
              field: 'email',
              isVisible: true,
              isSortable: true,
              isFilterable: true,
              template: { operator: '', value: '', sortOrder: 'none' },
            },
          ],
          createdAt: svc.created_at || new Date().toISOString(),
          updatedAt: svc.updated_at || new Date().toISOString(),
        }));

        console.log('[SearchManager] serviceViews from DB:', serviceViews.length);

        // Merge and sort: Custom views (manual) ALWAYS on top of service cards
        const allViews = [...userViews, ...serviceViews];
        console.log('[SearchManager] allViews before sort:', allViews.length);
        console.log(
          '[SearchManager] First 5 view names:',
          allViews.slice(0, 5).map((v) => v.name),
        );

        allViews.sort((a, b) => {
          const aIsManual = a.source !== 'service';
          const bIsManual = b.source !== 'service';

          // 1. Custom views (non-service) always above service cards
          if (aIsManual && !bIsManual) return -1;
          if (!aIsManual && bIsManual) return 1;

          // 2. Within same source group: Favorites first
          if (a.favorite && !b.favorite) return -1;
          if (!a.favorite && b.favorite) return 1;

          // 3. Within same source group: Recently used
          const aRecent = a.lastUsedAt ? new Date(a.lastUsedAt).getTime() : 0;
          const bRecent = b.lastUsedAt ? new Date(b.lastUsedAt).getTime() : 0;
          if (aRecent !== bRecent) return bRecent - aRecent;

          // 4. Service cards: higher account count first
          if (!aIsManual && !bIsManual) {
            return (b.accountCount || 0) - (a.accountCount || 0);
          }

          // 5. Alphabetical
          return a.name.localeCompare(b.name);
        });

        console.log('[SearchManager] allViews after sort:', allViews.length);
        console.log(
          '[SearchManager] First 5 after sort:',
          allViews.slice(0, 5).map((v) => `${v.name} (${v.source})`),
        );

        if (allViews.length > 0) {
          console.log('[SearchManager] Setting views + selectedViewId:', allViews[0].id);
          setViews(allViews);
          setSelectedViewId(allViews[0].id);
        } else {
          console.warn('[SearchManager] allViews is EMPTY!');
        }
      } catch (err) {
        console.error('[SearchManager] Failed to load search views:', err);
      }
      console.log('[SearchManager] loadViews DONE, setLoaded(true)');
      setLoaded(true);
    };
    loadViews();
  }, []);

  // Save only user-created views to storage
  useEffect(() => {
    if (!loaded) return;
    try {
      const userViews = views.filter((v) => v.source !== 'service');
      // @ts-ignore
      window.electron.ipcRenderer.invoke('storage:set', STORAGE_KEY, userViews);
    } catch (err) {
      console.error('Failed to save search views:', err);
    }
  }, [views, loaded]);

  const handleSelectView = useCallback((id: string) => {
    const viewId = id === 'all' ? null : id;
    setSelectedViewId(viewId);
    // Update lastUsedAt in cache
    if (id && id !== 'all') {
      const now = new Date().toISOString();
      recentCache[id] = now;
      saveRecentCache();
      setViews((prev) => prev.map((v) => (v.id === id ? { ...v, lastUsedAt: now } : v)));
    }
  }, []);

  const handleCreateView = (newView: SmartView) => {
    if (editingView) {
      setViews((prev) =>
        prev.map((v) =>
          v.id === editingView.id
            ? { ...newView, id: editingView.id, source: 'manual' as const }
            : v,
        ),
      );
      setEditingView(null);
    } else {
      setViews((prev) => [...prev, { ...newView, source: 'manual' as const }]);
    }
    setIsBuilderOpen(false);
  };

  const handleEditView = (view: SmartView) => {
    // Only allow editing manual views
    if (view.source === 'service') return;
    setEditingView(view);
    setIsBuilderOpen(true);
  };

  const handleDeleteView = (id: string) => {
    // Only allow deleting manual views
    const view = views.find((v) => v.id === id);
    if (view?.source === 'service') return;
    setViews((prev) => prev.filter((v) => v.id !== id));
    if (selectedViewId === id) setSelectedViewId(null);
  };

  const handleFavoriteView = (id: string) => {
    setViews((prev) => prev.map((v) => (v.id === id ? { ...v, favorite: !v.favorite } : v)));
  };

  const handleCloseBuilder = () => {
    setIsBuilderOpen(false);
    setEditingView(null);
  };

  const resetSelection = () => {
    setSelectedViewId(null);
  };

  return (
    <div className="flex flex-col h-full w-full bg-background overflow-hidden relative selection:bg-primary/10">
      <HeaderBar
        selectedView={selectedView}
        onReset={resetSelection}
        searchQuery={tableSearch}
        onSearchChange={setTableSearch}
        filtersCount={filterCount}
        showFilterBar={showFilterBar}
        onToggleFilterBar={() => setShowFilterBar(!showFilterBar)}
        sorting={sorting}
        onSortingChange={setSorting}
        availableColumns={availableColumns}
        columnVisibility={columnVisibility}
        onColumnVisibilityChange={setColumnVisibility}
        totalRecords={data.length}
        onRefresh={refresh}
      />

      <div className="flex-1 flex overflow-hidden">
        <LeftPanel
          views={views}
          selectedViewId={selectedViewId}
          onSelectView={handleSelectView}
          onOpenAddView={() => setIsBuilderOpen(true)}
          onEditView={handleEditView}
          onDeleteView={handleDeleteView}
          onFavoriteView={handleFavoriteView}
        />

        <RightPanel
          selectedView={selectedView}
          searchQuery={tableSearch}
          filters={filters}
          filterCount={filterCount}
          showFilterBar={showFilterBar}
          onToggleFilterBar={() => setShowFilterBar(!showFilterBar)}
          onAddFilter={addFilter}
          onRemoveFilter={removeFilter}
          onClearFilters={clearFilters}
          onUpdateFilter={updateFilter}
          sorting={sorting}
          onSortingChange={setSorting}
          availableColumns={availableColumns}
          columnVisibility={columnVisibility}
          onColumnVisibilityChange={setColumnVisibility}
          columnSizing={columnSizing}
          onColumnSizingChange={setColumnSizing}
          columnOrder={columnOrder}
          onColumnOrderChange={setColumnOrder}
          data={data}
          loading={loading}
          onRefresh={refresh}
          onOpenAddView={() => setIsBuilderOpen(true)}
        />
      </div>

      <ViewEditorDrawer
        isOpen={isBuilderOpen}
        onClose={handleCloseBuilder}
        onSave={handleCreateView}
        editView={editingView}
      />
    </div>
  );
};

export default SearchManager;