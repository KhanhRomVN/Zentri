/**
 * ------------------------------------------------------------------
 * FootprintModal
 * ------------------------------------------------------------------
 * Modal hiển thị chi tiết footprint của một domain
 * Có 5 tabs: Overview, IP Address, Fingerprint, Sync, Alert
 * ------------------------------------------------------------------
 */

import { useState } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../../../../../shared/lib/utils';

import { FingerprintEntry } from '../FootprintTable';

// Import các tab components
import OverviewTab from './OverviewTab';
import IPAddressTab from './IPAddressTab';
import FingerprintTab from './FingerprintTab';
import SyncTab from './SyncTab';
import AlertTab from './AlertTab';

// ─── Interfaces ─────────────────────────────────────────────────────────
interface FootprintModalProps {
  isOpen: boolean;
  onClose: () => void;
  domain: string;
  entries: FingerprintEntry[];
  onDeleteSession?: (id: string) => void | Promise<void>;
}

type TabType = 'overview' | 'ip-address' | 'fingerprint' | 'sync' | 'alert';

// ─── Component ──────────────────────────────────────────────────────────
export default function FootprintModal({
  isOpen,
  onClose,
  domain,
  entries,
  onDeleteSession,
}: FootprintModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Favicon URL
  const getFaviconUrl = (domain: string): string => {
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  };

  const tabs: Array<{ id: TabType; label: string; count?: number }> = [
    { id: 'overview', label: 'Overview' },
    { id: 'ip-address', label: 'IP Address', count: new Set(entries.map((e) => e.public_ip)).size },
    {
      id: 'fingerprint',
      label: 'Fingerprint',
      count: new Set(entries.map((e) => e.fingerprint_hash)).size,
    },
    { id: 'sync', label: 'Sync' },
    { id: 'alert', label: 'Alert', count: 0 }, // TODO: calculate real alert count
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-5xl h-[80vh] bg-background border border-border rounded-lg shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start gap-3 px-5 py-4 border-b border-border shrink-0">
              <img
                src={getFaviconUrl(domain)}
                alt=""
                className="w-10 h-10 rounded-lg shrink-0 mt-0.5"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold text-text-primary truncate">{domain}</h2>
                <p className="text-sm text-text-secondary/70 mt-0.5">
                  {entries.length} session{entries.length !== 1 ? 's' : ''} recorded
                </p>
              </div>
              <button
                onClick={onClose}
                className="shrink-0 w-8 h-8 rounded-md flex items-center justify-center text-text-secondary/60 hover:text-text-primary hover:bg-muted/20 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 px-4 pt-2 border-b border-border shrink-0 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'relative px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap',
                    activeTab === tab.id
                      ? 'text-primary'
                      : 'text-text-secondary/60 hover:text-text-secondary',
                  )}
                >
                  <span className="flex items-center gap-2">
                    {tab.label}
                    {tab.count !== undefined && tab.count > 0 && (
                      <span
                        className={cn(
                          'inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-full text-[10px] font-bold',
                          activeTab === tab.id
                            ? 'bg-primary/20 text-primary'
                            : 'bg-muted/30 text-text-secondary/50',
                        )}
                      >
                        {tab.count}
                      </span>
                    )}
                  </span>
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
              {activeTab === 'overview' && (
                <OverviewTab domain={domain} entries={entries} onDeleteSession={onDeleteSession} />
              )}
              {activeTab === 'ip-address' && <IPAddressTab entries={entries} />}
              {activeTab === 'fingerprint' && <FingerprintTab entries={entries} />}
              {activeTab === 'sync' && <SyncTab domain={domain} entries={entries} />}
              {activeTab === 'alert' && <AlertTab domain={domain} entries={entries} />}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
