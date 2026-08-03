import { FC, useState, useEffect, useMemo } from 'react';
import { generateFingerprints, IpApiResponse } from '../fingerprint-generator';
import { Fingerprint } from '../fingerprint';
import { extractFilters } from './types';
import MainView from './MainView';
import PickerView from './PickerView';
import DetailView from './DetailView';
import { BrowserLaunchModalProps } from './types';

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
          const ipRes = await fetch('http://ip-api.com/json');
          if (ipRes.ok) {
            const data: IpApiResponse = await ipRes.json();
            if (data.status === 'success') {
              setIpData(data);
              setFingerprints(generateFingerprints(data));
            } else setIpError('Failed to get IP info');
          } else setIpError('IP API unavailable');
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
      return { ...prev, [type]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value] };
    });
  };

  const handleSelectFingerprint = (fp: Fingerprint) => {
    setPreviewFp(fp);
    setView('detail');
  };

  const handleConfirmSelection = () => {
    if (previewFp) setSelectedFingerprintId(previewFp.id);
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

  // ── Render ─────────────────────────────────────────────────────────
  if (view === 'detail' && previewFp) {
    return (
      <DetailView
        isOpen={isOpen}
        onClose={onClose}
        fingerprint={previewFp}
        onConfirm={handleConfirmSelection}
        onBack={() => setView('picker')}
      />
    );
  }

  if (view === 'picker') {
    return (
      <PickerView
        isOpen={isOpen}
        onClose={onClose}
        fingerprints={fingerprints}
        selectedFingerprintId={selectedFingerprintId}
        fpSearch={fpSearch}
        fpFilters={fpFilters}
        filterOptions={filterOptions}
        filteredFingerprints={filteredFingerprints}
        onSearchChange={setFpSearch}
        onToggleFilter={toggleFilter}
        onSelect={handleSelectFingerprint}
        onBack={() => {
          setView('main');
          setFpSearch('');
          setFpFilters({ groups: [], browsers: [] });
        }}
      />
    );
  }

  return (
    <MainView
      isOpen={isOpen}
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
      onSelectProxy={(id) => { setSelectedProxyId(id); setProxySearch(''); }}
      onOpenPicker={() => setView('picker')}
      onLaunch={handleLaunch}
    />
  );
};

export default BrowserLaunchModal;