import { useState } from 'react';
import HeaderBar from '../../components/HeaderBar';
import Sidebar from './components/Sidebar';
import WorkspacePanelBar from './components/WorkspacePanel/WorkspacePanelBar';
import DeviceTable from './components/WorkspacePanel/DeviceTable';
import DeviceGrid from './components/WorkspacePanel/DeviceGrid';
import AddDeviceModal from './components/WorkspacePanel/AddDeviceModal';
import DeviceDetailModal from './components/WorkspacePanel/DeviceDetailModal/DeviceDetailModal';
import { useDeviceData } from './hooks/useDeviceData';
import { Device } from './types';

const DevicePage = () => {
  const {
    devices,
    filteredDevices,
    loading,
    error,
    facetCounts,
    filters,
    setFilters,
    refresh,
  } = useDeviceData();

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
          <WorkspacePanelBar
            searchQuery={filters.searchQuery}
            onSearchChange={(value) =>
              setFilters((prev) => ({ ...prev, searchQuery: value }))
            }
            onRefresh={refresh}
            onAddDevice={() => setIsAddModalOpen(true)}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />

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
    </div>
  );
};

export default DevicePage;