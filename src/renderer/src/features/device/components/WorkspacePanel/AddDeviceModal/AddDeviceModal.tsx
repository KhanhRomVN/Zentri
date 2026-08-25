import { FC, useState, useMemo } from 'react';
import { PenLine, RefreshCw, Search } from 'lucide-react';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../../../../../components/ui/Modal';
import DeviceScanList from './DeviceScanList';
import DeviceDetailPanel from './DeviceDetailPanel';
import ManualAddForm from './ManualAddForm';
import { ScannedDevice, AddDeviceMode, SourceFilter, StatusFilter } from './types';
import { showToast } from './toast';
import { cn } from '../../../../../shared/lib/utils';

interface AddDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const GROUPS = ['Uncategorized', 'Farm A', 'Farm B', 'QA Lab', 'Livestream', 'Warm-up'];

const SOURCE_FILTERS: Array<{ id: SourceFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'usb', label: 'USB / ADB' },
  { id: 'lan', label: 'LAN' },
  { id: 'emulator', label: 'Emulator' },
];

const AddDeviceModal: FC<AddDeviceModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [mode, setMode] = useState<AddDeviceMode>('scan');
  const [scannedDevices, setScannedDevices] = useState<ScannedDevice[]>([]);
  const [addedSerials, setAddedSerials] = useState<Set<string>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [scanning, setScanning] = useState(false);
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [batchGroup, setBatchGroup] = useState(GROUPS[0]);
  const [lastScan, setLastScan] = useState('—');

  const filteredDevices = useMemo(() => {
    let list = scannedDevices.slice();
    if (sourceFilter !== 'all') list = list.filter((d) => d.connectionType === sourceFilter);
    if (statusFilter === 'new') list = list.filter((d) => !addedSerials.has(d.serial));
    if (statusFilter === 'added') list = list.filter((d) => addedSerials.has(d.serial));
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (d) => d.model.toLowerCase().includes(q) || d.serial.toLowerCase().includes(q),
      );
    }
    return list;
  }, [scannedDevices, addedSerials, sourceFilter, statusFilter, searchQuery]);

  const countBySource = (source: SourceFilter) => {
    if (source === 'all') return scannedDevices.length;
    return scannedDevices.filter((d) => d.connectionType === source).length;
  };

  const handleScan = async () => {
    setScanning(true);
    try {
      // @ts-ignore
      const devices = await window.electron.ipcRenderer.invoke('device:scan');
      setScannedDevices(devices || []);
      setLastScan('just now');
      showToast(`Found ${devices?.length || 0} devices`);
    } catch (err) {
      console.error('[AddDeviceModal] scan failed:', err);
      showToast('Scan failed', 'err');
    } finally {
      setScanning(false);
    }
  };

  const createDevice = async (
    device: ScannedDevice,
    extra?: { name?: string; group?: string; tags?: string[] },
  ) => {
    const isVirtual = device.connectionType === 'emulator' ? 1 : 0;
    const ipAddress = device.serial.includes(':') ? device.serial.split(':')[0] : null;
    // @ts-ignore
    await window.electron.ipcRenderer.invoke('device:create', {
      name: extra?.name || device.model,
      type: device.deviceType,
      isVirtual,
      platform: 'Android',
      groupName: extra?.group || null,
      tags: extra?.tags || [],
      ipAddress,
      status: 'online',
    });
    setAddedSerials((prev) => new Set(prev).add(device.serial));
  };

  const handleQuickAdd = async (id: string) => {
    const device = scannedDevices.find((d) => d.id === id);
    if (!device) return;
    try {
      await createDevice(device);
      showToast(`Added ${device.model} to Fleet`);
      onSuccess();
    } catch (err) {
      showToast('Add failed', 'err');
    }
  };

  const handleDetailAdd = async (data: {
    name: string;
    group: string;
    tags: string[];
    notes: string;
  }) => {
    if (!selectedId) return;
    const device = scannedDevices.find((d) => d.id === selectedId);
    if (!device) return;
    try {
      await createDevice(device, data);
      showToast(`Added ${data.name} to Fleet (group: ${data.group})`);
      onSuccess();
    } catch (err) {
      showToast('Add failed', 'err');
    }
  };

  const handleBatchAdd = async () => {
    const selected = scannedDevices.filter((d) => checkedIds.has(d.id));
    let count = 0;
    for (const device of selected) {
      try {
        await createDevice(device, { group: batchGroup });
        count++;
      } catch (err) {
        console.error('[batch] add failed:', device.serial, err);
      }
    }
    if (count > 0) {
      setCheckedIds(new Set());
      showToast(`Added ${count} devices to Fleet (group: ${batchGroup})`);
      onSuccess();
    }
  };

  const handleManualAdd = async (data: {
    name: string;
    address: string;
    group: string;
    tags: string[];
    notes: string;
    deviceType: string;
  }) => {
    try {
      const parts = data.address.split(':');
      // @ts-ignore
      await window.electron.ipcRenderer.invoke('device:create', {
        name: data.name,
        type: data.deviceType.startsWith('mobile') ? 'mobile' : 'desktop',
        isVirtual: data.deviceType.endsWith('virtual') ? 1 : 0,
        platform: 'Android',
        groupName: data.group,
        tags: data.tags,
        ipAddress: parts[0] || null,
        status: 'online',
      });
      showToast(`Added ${data.name} to Fleet (manually)`);
      setMode('scan');
      onSuccess();
    } catch (err) {
      showToast('Add failed', 'err');
    }
  };

  const selectedDevice = scannedDevices.find((d) => d.id === selectedId) || null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      hideCloseButton
      className="w-full max-w-[1060px] h-[min(720px,90vh)] rounded-[14px] border border-border bg-card-background shadow-2xl flex flex-col overflow-hidden"
    >
      <ModalHeader
        title="Add Device to Fleet"
        description="Scan devices via USB/ADB, LAN, emulator — or add manually by connection address."
        onClose={onClose}
      />

      {/* Mode bar */}
      <div className="flex items-center gap-2 px-5 pt-3 shrink-0 flex-wrap">
        <div className="flex bg-input-background border border-border rounded-lg p-0.5 gap-0.5">
          {SOURCE_FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setSourceFilter(f.id)}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors',
                sourceFilter === f.id
                  ? 'bg-card-hover text-text-primary'
                  : 'text-text-tertiary hover:text-text-secondary',
              )}
            >
              {f.label}
              <span className="font-mono text-[10.5px] opacity-75">{countBySource(f.id)}</span>
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <button
          onClick={() => setMode(mode === 'manual' ? 'scan' : 'manual')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-colors',
            mode === 'manual'
              ? 'border-primary/50 text-primary bg-primary/10 border-solid'
              : 'border-dashed border-border text-text-secondary hover:border-primary/50 hover:text-primary',
          )}
        >
          <PenLine className="size-3.5" />
          Add manually
        </button>
      </div>

      {/* Toolbar (scan mode) */}
      {mode === 'scan' && (
        <div className="flex items-center gap-2 px-5 py-3 shrink-0 flex-wrap">
          <div className="relative w-[230px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-text-tertiary" />
            <input
              type="text"
              placeholder="Search by name, model, IP, serial..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-8 pl-8 pr-2 rounded-md bg-input-background border border-border text-xs text-text-primary outline-none focus:border-primary/50"
            />
          </div>
          <div className="flex gap-1.5">
            {(['all', 'new', 'added'] as StatusFilter[]).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  'px-2.5 py-1.5 rounded-md text-[11.5px] font-medium border transition-colors',
                  statusFilter === s
                    ? 'border-primary/50 text-primary bg-primary/10'
                    : 'border-border bg-input-background text-text-secondary hover:text-text-primary',
                )}
              >
                {s === 'all' ? 'All' : s === 'new' ? 'New' : 'Added'}
              </button>
            ))}
          </div>
          <div className="flex-1" />
          <span className="font-mono text-[10.5px] text-text-tertiary">Last scan: {lastScan}</span>
          <button
            onClick={handleScan}
            disabled={scanning}
            className="flex items-center gap-1.5 h-8 px-3 rounded-md bg-input-background border border-border text-xs font-semibold text-text-primary hover:bg-card-hover disabled:opacity-60"
          >
            <RefreshCw className={cn('size-3.5', scanning && 'animate-spin')} />
            {scanning ? 'Scanning...' : 'Rescan'}
          </button>
        </div>
      )}

      {/* Batch bar */}
      {mode === 'scan' && checkedIds.size > 0 && (
        <div className="flex items-center gap-2.5 mx-5 mb-2.5 px-3 py-2 rounded-lg bg-primary/10 border border-primary/50 text-xs shrink-0 flex-wrap">
          <span>
            <strong className="text-primary font-mono">{checkedIds.size}</strong> unadded devices
            selected
          </span>
          <div className="flex-1" />
          <label className="text-xs text-text-secondary">Assign group:</label>
          <select
            value={batchGroup}
            onChange={(e) => setBatchGroup(e.target.value)}
            className="h-7 px-1.5 rounded-md bg-input-background border border-border text-xs text-text-primary outline-none"
          >
            {GROUPS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
          <button
            onClick={handleBatchAdd}
            className="h-7 px-3 rounded-md bg-primary text-white text-xs font-semibold hover:bg-primary/90"
          >
            Add all to Fleet
          </button>
          <button
            onClick={() => setCheckedIds(new Set())}
            className="text-xs text-text-tertiary underline hover:text-text-secondary"
          >
            Clear
          </button>
        </div>
      )}

      {/* Body */}
      <ModalBody className="flex overflow-hidden px-5 pb-4 pt-0 gap-3.5">
        {mode === 'scan' ? (
          <div className="flex-1 flex overflow-hidden gap-3.5">
            <div className="w-[320px] shrink-0 flex flex-col">
              {scanning ? (
                <div className="space-y-1.5">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-[66px] rounded-lg bg-input-background animate-pulse" />
                  ))}
                </div>
              ) : (
                <DeviceScanList
                  devices={filteredDevices}
                  addedSerials={addedSerials}
                  selectedId={selectedId}
                  checkedIds={checkedIds}
                  onSelect={setSelectedId}
                  onToggleCheck={(id) =>
                    setCheckedIds((prev) => {
                      const next = new Set(prev);
                      if (next.has(id)) next.delete(id);
                      else next.add(id);
                      return next;
                    })
                  }
                  onQuickAdd={handleQuickAdd}
                />
              )}
            </div>
            <div className="flex-1 min-w-0 rounded-[10px] border border-border bg-background overflow-hidden flex flex-col">
              <DeviceDetailPanel
                device={selectedDevice}
                isAdded={selectedDevice ? addedSerials.has(selectedDevice.serial) : false}
                onAdd={handleDetailAdd}
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto flex justify-center">
            <ManualAddForm onAdd={handleManualAdd} />
          </div>
        )}
      </ModalBody>

      {/* Footer */}
      <ModalFooter className="items-center">
        {mode === 'scan' ? (
          <span className="text-[11.5px] text-text-tertiary flex-1 text-left">
            {selectedDevice
              ? `Viewing: ${selectedDevice.model} · adjust the information below before adding`
              : 'Select a device to view details'}
          </span>
        ) : (
          <span className="text-[11.5px] text-text-tertiary flex-1 text-left">
            No devices found via scan? Add manually here.
          </span>
        )}
        <button
          onClick={onClose}
          className="h-8 px-3 rounded-md border border-border text-xs font-medium text-text-secondary hover:text-text-primary"
        >
          Cancel
        </button>
      </ModalFooter>
    </Modal>
  );
};

export default AddDeviceModal;