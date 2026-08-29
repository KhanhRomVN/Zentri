import { useState } from 'react';
import { Search, RefreshCw, Plus, LayoutGrid, List } from 'lucide-react';
import Sidebar from './components/Sidebar';
import HeaderBar from './components/HeaderBar';
import FooterBar from './components/FooterBar';
import DeviceTable from './components/WorkspacePanel/DeviceTable';
import DeviceGrid from './components/WorkspacePanel/DeviceGrid';
import AddDeviceModal from './components/WorkspacePanel/modal/AddDeviceModal';
import DeviceDetailModal from './components/WorkspacePanel/modal/DeviceDetailModal/DeviceDetailModal';
import { Button } from '../../components/ui/Button';
import { cn } from '../../shared/lib/utils';
import { useDeviceData } from './hooks/useDeviceData';
import { Device } from './types';

const DevicePage = () => {
  const { devices, filteredDevices, loading, error, facetCounts, filters, setFilters, refresh } =
    useDeviceData();

  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);

  return (
    <div className="flex flex-col h-full bg-background text-foreground overflow-hidden">
      <HeaderBar title="Device" />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          devices={devices}
          facetCounts={facetCounts}
          filters={filters}
          onFiltersChange={setFilters}
        />

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-2 h-[52px] border-b border-border bg-background/80 backdrop-blur-xl shrink-0">
            <div className="ml-auto w-80 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-text-tertiary" />
              <input
                type="text"
                placeholder="Search by name, IP, platform, group..."
                value={filters.searchQuery}
                onChange={(e) => setFilters((prev) => ({ ...prev, searchQuery: e.target.value }))}
                className="w-full h-full pl-9 pr-3 rounded-md bg-input-background border border-border text-sm text-foreground placeholder:text-text-tertiary outline-none focus:border-primary/50 transition-colors"
              />
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-full aspect-square px-0 py-0"
                onClick={refresh}
                title="Refresh"
              >
                <RefreshCw className="size-3.5" />
              </Button>
              <Button
                variant="solid"
                size="sm"
                className="h-full aspect-square px-0 py-0"
                onClick={() => setIsAddModalOpen(true)}
                title="Add Device"
              >
                <Plus className="size-3.5" />
              </Button>

              <div className="flex items-stretch rounded-md border border-border overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    'px-2.5 h-full flex items-center justify-center transition-colors',
                    viewMode === 'grid'
                      ? 'bg-primary/20 text-primary'
                      : 'bg-panel text-text-secondary hover:text-text-primary',
                  )}
                  title="Grid view"
                >
                  <LayoutGrid className="size-4" />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={cn(
                    'px-2.5 h-full flex items-center justify-center transition-colors',
                    viewMode === 'table'
                      ? 'bg-primary/20 text-primary'
                      : 'bg-panel text-text-secondary hover:text-text-primary',
                  )}
                  title="Table view"
                >
                  <List className="size-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            {loading ? (
              <div className="text-sm text-text-tertiary">Loading devices...</div>
            ) : error ? (
              <div className="text-sm text-red">{error}</div>
            ) : viewMode === 'grid' ? (
              <DeviceGrid devices={filteredDevices} onRowClick={setSelectedDevice} />
            ) : (
              <DeviceTable devices={filteredDevices} onRowClick={setSelectedDevice} />
            )}
          </div>
        </div>
      </div>

      <AddDeviceModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          setIsAddModalOpen(false);
          refresh();
        }}
      />

      <DeviceDetailModal device={selectedDevice} onClose={() => setSelectedDevice(null)} />
      <FooterBar />
    </div>
  );
};

export default DevicePage;