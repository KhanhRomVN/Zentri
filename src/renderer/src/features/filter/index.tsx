import { useState, useEffect, useCallback, useMemo } from 'react';
import FilterList from './components/FilterList';
import FilterTable from './components/FilterTable';
import HeaderBar from './components/HeaderBar';
import { SmartView } from './types/search';
import { useSearchTableState } from './hooks/useSearchTableState';
import { useSearchFilter } from './hooks/useSearchFilter';
import useSearchData from '../../hooks/useSearchData';
import FilterModal from './components/modal/FilterModal';
import { AVAILABLE_FIELDS, FilterCard } from './components/modal/FilterModal/types';

const STORAGE_KEY = 'zentri_search_views';
const CACHE_KEY = 'zentri_search_recent';

// In-memory cache for recently used timestamps (survives session)
let recentCache: Record<string, string> = {};

const saveRecentCache = async () => {
  try {
    // @ts-ignore
    await window.electron.ipcRenderer.invoke('storage:set', CACHE_KEY, recentCache);
  } catch {
    // ignore
  }
};

const FilterPage = () => {
  const [views, setViews] = useState<SmartView[]>([]);
  const [selectedViewId, setSelectedViewId] = useState<string | null>(null);
  const [, setIsBuilderOpen] = useState(false);
  const [, setEditingView] = useState<SmartView | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [tableSearch, setTableSearch] = useState('');
  const [showFilterBar, setShowFilterBar] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;

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

  // Pagination calculations
  const totalRecords = data.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const startRecord = totalRecords > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const endRecord = Math.min(currentPage * pageSize, totalRecords);
  const paginatedData = data.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Reset to page 1 when data or selectedView changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedView, data.length]);

  // Views are temporarily disabled — no data fetching for now
  useEffect(() => {
    setLoaded(true);
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
        totalRecords={totalRecords}
        onRefresh={refresh}
        currentPage={currentPage}
        totalPages={totalPages}
        startRecord={startRecord}
        endRecord={endRecord}
        onPageChange={handlePageChange}
      />

      <div className="flex-1 flex overflow-hidden">
        <FilterList
          views={views}
          selectedViewId={selectedViewId}
          onSelectView={handleSelectView}
          onOpenAddView={() => setIsFilterModalOpen(true)}
          onEditView={handleEditView}
          onDeleteView={handleDeleteView}
          onFavoriteView={handleFavoriteView}
        />

        <FilterTable
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
          data={paginatedData}
          loading={loading}
          onRefresh={refresh}
          onOpenAddView={() => setIsBuilderOpen(true)}
        />
      </div>

      <FilterModal
        open={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        onSave={(_name: string, _filters: FilterCard[]) => {
          // TODO: handle saving the new view
          setIsFilterModalOpen(false);
        }}
        availableFields={AVAILABLE_FIELDS}
      />
    </div>
  );
};

export default FilterPage;
