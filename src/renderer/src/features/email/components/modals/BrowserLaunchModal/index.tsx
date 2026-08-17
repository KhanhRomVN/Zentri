import { FC, useState, useEffect, useMemo } from 'react';
import { Fingerprint, FingerprintConfig } from '../../../../../types/fingerprint-profile';
import Modal from '../../../../../components/ui/Modal/Modal';
import LaunchConfig from './LaunchConfig';
import FingerprintPicker from './FingerprintPicker';
import FingerprintDetail from './FingerprintDetail';
import { IpApiResponse } from '../../../../../types/ip-api';
import { generateFingerprints } from '../../../../../services/fingerprintGenerator';
import { fetchIpInfo } from '../../../../../services/ipApi';

/**
 * ------------------------------------------------------------------
 * BrowserLaunchModal Types
 * ------------------------------------------------------------------
 * Type definitions and helpers for the BrowserLaunchModal.
 * Includes launch configuration props, filter options extraction,
 * and OS icon mappings.
 *
 * Main types:
 * - BrowserLaunchModalProps : Props for the launch modal
 * - FilterOptions           : Available filter groups and browsers
 * - extractFilters()        : Extract unique groups/browsers from fingerprints
 * ------------------------------------------------------------------
 */

export interface BrowserLaunchModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  accountId: string;
  targetUrl?: string;
  targetTitle?: string;
  onLaunch: (config: {
    fingerprintId?: string;
    proxyId?: string;
    fingerprintConfig?: object;
  }) => void;
}

export interface FilterOptions {
  groups: string[];
  browsers: string[];
}

// ─── Constants ──────────────────────────────────────────────────────────
export const OS_ICONS: Record<string, string> = {
  Windows: '\u{1FA9F}',
  macOS: '\u{1F34E}',
  Linux: '\u{1F427}',
  Android: '\u{1F4F1}',
  Other: '\u{1F4BB}',
};

// ─── Functions ──────────────────────────────────────────────────────────
export function extractFilters(fps: Fingerprint[]): FilterOptions {
  const groups = new Set<string>();
  const browsers = new Set<string>();
  for (const fp of fps) {
    if (fp.group) groups.add(fp.group);
    if (fp.browser) browsers.add(fp.browser);
  }
  return { groups: Array.from(groups).sort(), browsers: Array.from(browsers).sort() };
}

const BrowserLaunchModal: FC<BrowserLaunchModalProps> = (props) => {
  const { isOpen, onClose, email, targetUrl, targetTitle, onLaunch } = props;

  const [ipData, setIpData] = useState<IpApiResponse | null>(null);
  const [isLoadingIp, setIsLoadingIp] = useState(false);
  const [ipError, setIpError] = useState('');

  const [fingerprints, setFingerprints] = useState<Fingerprint[]>([]);
  const [selectedFingerprintId, setSelectedFingerprintId] = useState<string | undefined>();

  const [view, setView] = useState<'main' | 'picker' | 'detail'>('main');
  const [previewFp, setPreviewFp] = useState<Fingerprint | null>(null);
  const [fpSearch, setFpSearch] = useState('');
  const [fpFilters, setFpFilters] = useState<{ groups: string[]; browsers: string[] }>({
    groups: [],
    browsers: [],
  });

  const [proxies, setProxies] = useState<any[]>([]);
  const [selectedProxyId, setSelectedProxyId] = useState<string | undefined>();
  const [proxySearch, setProxySearch] = useState('');
  const [proxyHistory, setProxyHistory] = useState<any[]>([]);

  // ── Fetch on open ──────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        setIsLoadingIp(true);
        setIpError('');
        setSelectedFingerprintId(undefined);
        setView('main');
        setPreviewFp(null);
        setFpSearch('');
        setFpFilters({ groups: [], browsers: [] });

        try {
          const data = await fetchIpInfo();
          setIpData(data);
          setFingerprints(generateFingerprints(data));
        } catch (err) {
          console.error('[IP] Fetch error:', err);
          setIpError('Network error fetching IP');
        } finally {
          setIsLoadingIp(false);
        }

        try {
          const pxs = await window.electron.ipcRenderer.invoke(
            'sqlite:all',
            "SELECT id, host, port, protocol, country, city, isp FROM proxies WHERE status = 'active' ORDER BY created_at DESC",
          );
          setProxies(pxs || []);
        } catch (error) {
          console.error('Failed to fetch proxies:', error);
        }
      };
      fetchData();
    }
  }, [isOpen]);

  // ── Proxy history ──────────────────────────────────────────────────
  useEffect(() => {
    if (selectedProxyId) {
      (async () => {
        try {
          setProxyHistory(
            (await window.electron.ipcRenderer.invoke('proxy:get-history', selectedProxyId)) || [],
          );
        } catch (error) {
          console.error('Failed to fetch proxy history:', error);
        }
      })();
    } else setProxyHistory([]);
  }, [selectedProxyId]);

  // ── Computed ───────────────────────────────────────────────────────
  const filterOptions = useMemo(() => extractFilters(fingerprints), [fingerprints]);
  const selectedFingerprint = fingerprints.find((f) => f.id === selectedFingerprintId);
  const selectedProxy = proxies.find((p) => p.id === selectedProxyId);

  const filteredProxies = proxies.filter((p) => {
    const s = proxySearch.toLowerCase();
    return (
      p.host.toLowerCase().includes(s) ||
      p.country?.toLowerCase().includes(s) ||
      p.city?.toLowerCase().includes(s) ||
      p.isp?.toLowerCase().includes(s)
    );
  });

  const filteredFingerprints = useMemo(() => {
    let list = fingerprints;
    const s = fpSearch.toLowerCase();
    if (s) {
      list = list.filter(
        (f) =>
          f.name.toLowerCase().includes(s) ||
          f.description.toLowerCase().includes(s) ||
          (f.group && f.group.toLowerCase().includes(s)) ||
          (f.browser && f.browser.toLowerCase().includes(s)),
      );
    }
    if (fpFilters.groups.length > 0)
      list = list.filter((f) => f.group && fpFilters.groups.includes(f.group));
    if (fpFilters.browsers.length > 0)
      list = list.filter((f) => f.browser && fpFilters.browsers.includes(f.browser));
    return list;
  }, [fingerprints, fpSearch, fpFilters]);

  // ── Handlers ───────────────────────────────────────────────────────
  const toggleFilter = (type: 'groups' | 'browsers', value: string) => {
    setFpFilters((prev) => {
      const arr = prev[type];
      return {
        ...prev,
        [type]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value],
      };
    });
  };

  const handleSelectFingerprint = (fp: Fingerprint) => {
    setPreviewFp(fp);
    setView('detail');
  };

  const handleConfirmSelection = (config: FingerprintConfig) => {
    if (previewFp) {
      const updatedFp = { ...previewFp, config };
      setSelectedFingerprintId(updatedFp.id);
      setFingerprints((prev) => prev.map((f) => (f.id === updatedFp.id ? updatedFp : f)));
    }
    setView('main');
    setPreviewFp(null);
    setFpSearch('');
    setFpFilters({ groups: [], browsers: [] });
  };

  const handleLaunch = () => {
    onLaunch({
      fingerprintId: selectedFingerprintId,
      proxyId: selectedProxyId,
      fingerprintConfig: selectedFingerprint?.config,
    });
  };

  const handleBackToMain = () => {
    setView('main');
    setFpSearch('');
    setFpFilters({ groups: [], browsers: [] });
  };

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-xl" hideCloseButton hideBackButton>
      {view === 'detail' && previewFp && (
        <FingerprintDetail
          onClose={onClose}
          onBack={() => setView('picker')}
          fingerprint={previewFp}
          onConfirm={handleConfirmSelection}
        />
      )}

      {view === 'picker' && (
        <FingerprintPicker
          onClose={onClose}
          onBack={handleBackToMain}
          fingerprints={fingerprints}
          selectedFingerprintId={selectedFingerprintId}
          fpSearch={fpSearch}
          fpFilters={fpFilters}
          filterOptions={filterOptions}
          filteredFingerprints={filteredFingerprints}
          onSearchChange={setFpSearch}
          onToggleFilter={toggleFilter}
          onSelect={handleSelectFingerprint}
        />
      )}

      {view === 'main' && (
        <LaunchConfig
          onClose={onClose}
          email={email}
          targetUrl={targetUrl}
          targetTitle={targetTitle}
          ipData={ipData}
          isLoadingIp={isLoadingIp}
          ipError={ipError}
          fingerprints={fingerprints}
          selectedFingerprintId={selectedFingerprintId}
          selectedFingerprint={selectedFingerprint}
          proxies={proxies}
          selectedProxyId={selectedProxyId}
          selectedProxy={selectedProxy}
          proxySearch={proxySearch}
          proxyHistory={proxyHistory}
          filteredProxies={filteredProxies}
          onProxySearchChange={setProxySearch}
          onSelectProxy={(id) => {
            setSelectedProxyId(id);
            setProxySearch('');
          }}
          onOpenPicker={() => setView('picker')}
          onLaunch={handleLaunch}
        />
      )}
    </Modal>
  );
};

export default BrowserLaunchModal;
