import { FC } from 'react';
import { motion } from 'framer-motion';
import { Database, Search as SearchIcon, Table, Plus } from 'lucide-react';
import { SmartView } from '../types/search';

interface SearchContentViewProps {
  selectedView: SmartView | null;
  onOpenAddView: () => void;
}

const SearchContentView: FC<SearchContentViewProps> = ({ selectedView, onOpenAddView }) => {
  if (!selectedView) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
          <Database className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Smart Analysis Hub</h2>
        <p className="text-muted-foreground max-w-md mb-8">
          Manage your custom data views and automated filters. Select a view from the sidebar or
          create a new one to get started.
        </p>
        <button
          onClick={onOpenAddView}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:opacity-90 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Create New Smart View
        </button>
      </div>
    );
  }

  return (
    <motion.div
      key={selectedView.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex-1 flex flex-col h-full overflow-hidden"
    >
      <div className="p-6 border-b border-border bg-card/20 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            {selectedView.domain ? (
              <img
                src={`https://www.google.com/s2/favicons?domain=${selectedView.domain}&sz=64`}
                alt=""
                className="w-6 h-6 object-contain"
              />
            ) : (
              <Table className="w-6 h-6" style={{ color: selectedView.color }} />
            )}
            {selectedView.name}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {selectedView.description || 'Custom data view for efficient management'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Filter data..."
              className="h-10 pl-10 pr-4 bg-muted/20 border border-border/50 rounded-lg text-sm focus:outline-none focus:border-primary/50 transition-all w-64"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar p-6">
        {/* Table/Data component will go here */}
        <div className="flex flex-col items-center justify-center h-full opacity-30">
          <Table className="w-12 h-12 mb-4" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">
            Data Pipeline Standby
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default SearchContentView;
