import { FC, useState } from 'react';
import RegisBatchCard from './RegisBatchCard';
import { BatchType, ServiceType } from '../index';
import { Plus, Search, Trash2, LayoutGrid, Info } from 'lucide-react';

interface RegisGridViewProps {
  selectedService: ServiceType | undefined;
  onSelectBatch: (batch: BatchType) => void;
  onDeleteService: (id: string) => void;
  batches?: BatchType[];
}

const RegisGridView: FC<RegisGridViewProps> = ({
  selectedService,
  onSelectBatch,
  onDeleteService,
  batches = [],
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredBatches = batches.filter((batch) => {
    const matchesService = selectedService ? batch.serviceId === selectedService.id : true;
    const matchesSearch =
      batch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      batch.sessionID.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesService && matchesSearch;
  });

  if (!selectedService) {
    return (
      <div className="h-full flex flex-col items-center justify-center opacity-30 select-none">
        <LayoutGrid className="w-16 h-16 mb-4 text-muted-foreground/50" />
        <h3 className="text-xl font-black uppercase tracking-[0.25em]">Registry System</h3>
        <p className="text-xs font-medium mt-2 tracking-widest opacity-60">
          Select a service node to begin orchestration
        </p>
        <div className="mt-8 flex items-center gap-2 px-4 py-2 rounded-full border border-border/30 bg-card/5">
          <Info className="w-4 h-4" />
          <span className="text-[10px] font-bold uppercase tracking-widest">
            Awaiting active node selection
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500">
      {/* Sub-Navbar for Grid Controls - Flush and Standardized UI */}
      <div className="flex items-center justify-between gap-4 h-14 shrink-0 bg-transparent border-b border-border/50 px-6">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative group max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search batches...`}
              className="w-full h-9 pl-9 pr-4 bg-black/20 border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/20"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onDeleteService(selectedService.id)}
            className="h-9 w-9 flex items-center justify-center rounded-lg text-muted-foreground/30 hover:text-rose-500 hover:bg-rose-500/10 transition-all active:scale-90"
            title="Decommission Node"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button className="h-9 px-4 flex items-center gap-2 bg-primary/10 text-primary border border-primary/20 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-primary/20 transition-all active:scale-95 shadow-sm">
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            New Batch
          </button>
        </div>
      </div>

      {/* Grid Section */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 pb-32">
        {filteredBatches.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center py-32 opacity-20 border-2 border-dashed border-border/30 rounded-[32px]">
            <LayoutGrid className="w-12 h-12 mb-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">
              No batches provisioned
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(350px,1fr))] gap-8">
            {filteredBatches.map((batch) => (
              <RegisBatchCard key={batch.id} batch={batch} onClick={() => onSelectBatch(batch)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RegisGridView;
