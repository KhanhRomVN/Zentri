import { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, X, ChevronDown, Shield, RefreshCw, Play, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
} from '../../../components/ui/Dropdown';
import { Toggle } from '../../../components/ui/Toggle';
import { COUNTRIES, getCountryFlag } from '../../../constants';

interface ProxyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// --- Parsed proxy from import ---
interface ParsedProxy {
  raw: string;
  valid: boolean;
  dupe: boolean;
  reason?: string;
  protocol: string;
  host: string;
  port: string;
  user?: string;
  pass?: string;
  key: string;
}

type TestStatus = 'idle' | 'testing' | 'success' | 'failed';

interface TestResult {
  status: TestStatus;
  message?: string;
}

// --- Mock existing registry for duplicate detection ---
const MOCK_EXISTING: Set<string> = new Set();

// --- Country helpers ---
function getCountryDisplay(code: string): string {
  const flag = getCountryFlag(code);
  const country = COUNTRIES.find((c) => c.code === code);
  const name = country?.name || code;
  return flag ? `${flag} ${name}` : name;
}

export default function ProxyModal({ isOpen, onClose, onSuccess }: ProxyModalProps) {
  // --- Import ---
  const [quickImport, setQuickImport] = useState('');
  const [defaultProtocol, setDefaultProtocol] = useState('HTTP');
  const [defaultSource, setDefaultSource] = useState('Datacenter');
  const [defaultCountry, setDefaultCountry] = useState('VN');
  const [isp, setIsp] = useState('');

  // --- Tags ---
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  // --- Sticky session ---
  const [stickyEnabled, setStickyEnabled] = useState(false);
  const [stickyTtl, setStickyTtl] = useState('30');
  const [stickyMax, setStickyMax] = useState('5');

  // --- Advanced ---
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [rotationInterval, setRotationInterval] = useState('0');
  const [maxConns, setMaxConns] = useState('10');

  // --- Test connection ---
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  const [batchTesting, setBatchTesting] = useState(false);

  // --- Dropdown open states ---
  const [openProtocol, setOpenProtocol] = useState(false);
  const [openSource, setOpenSource] = useState(false);
  const [openCountry, setOpenCountry] = useState(false);

  // --- Reset on close ---
  useEffect(() => {
    if (!isOpen) {
      setQuickImport('');
      setDefaultProtocol('HTTP');
      setDefaultSource('Datacenter');
      setDefaultCountry('VN');
      setIsp('');
      setTags([]);
      setTagInput('');
      setStickyEnabled(false);
      setStickyTtl('30');
      setStickyMax('5');
      setAdvancedOpen(false);
      setRotationInterval('0');
      setMaxConns('10');
      setTestResults({});
      setBatchTesting(false);
    }
  }, [isOpen]);

  // --- Parse proxies ---
  const parsedProxies: ParsedProxy[] = useMemo(() => {
    const lines = quickImport.split('\n');
    const result: ParsedProxy[] = [];
    const seen = new Set<string>();

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      let proto = defaultProtocol;
      let host = '';
      let port = '';
      let user: string | undefined;
      let pass: string | undefined;

      // protocol://user:pass@host:port  OR protocol://host:port
      const protoMatch = line.match(/^([a-zA-Z0-9]+):\/\/(.+)$/);
      if (protoMatch) {
        proto = protoMatch[1].toUpperCase();
        let rest = protoMatch[2];
        if (rest.includes('@')) {
          const [cred, hp] = rest.split('@');
          const credParts = cred.split(':');
          user = credParts[0] || undefined;
          pass = credParts[1] || undefined;
          const hpParts = hp.split(':');
          host = hpParts[0] || '';
          port = hpParts[1] || '';
        } else {
          const hpParts = rest.split(':');
          host = hpParts[0] || '';
          port = hpParts[1] || '';
        }
      } else {
        const parts = line.split(':');
        if (parts.length === 2) {
          [host, port] = parts;
        } else if (parts.length >= 4) {
          [host, port, user, pass] = parts;
        } else if (parts.length === 3) {
          [host, port, user] = parts;
        } else {
          result.push({
            raw: line,
            valid: false,
            dupe: false,
            reason: 'unrecognized format',
            protocol: proto,
            host: '',
            port: '',
            key: '',
          });
          continue;
        }
      }

      const ipRe = /^(\d{1,3}\.){3}\d{1,3}$/;
      const hostOk = host && (ipRe.test(host) || /^[a-zA-Z0-9.-]+$/.test(host));
      const portOk = port && /^\d{2,5}$/.test(port) && +port > 0 && +port <= 65535;

      if (!hostOk || !portOk) {
        result.push({
          raw: line,
          valid: false,
          dupe: false,
          reason: !hostOk ? 'invalid host' : 'invalid port',
          protocol: proto,
          host,
          port,
          key: '',
        });
        continue;
      }

      const key = `${host}:${port}`;
      const dupe = MOCK_EXISTING.has(key) || seen.has(key);
      seen.add(key);

      result.push({ raw: line, valid: true, dupe, protocol: proto, host, port, user, pass, key });
    }

    return result;
  }, [quickImport, defaultProtocol]);

  const validCount = parsedProxies.filter((p) => p.valid && !p.dupe).length;
  const invalidCount = parsedProxies.filter((p) => !p.valid).length;
  const dupeCount = parsedProxies.filter((p) => p.valid && p.dupe).length;
  const hasMultipleProxies = validCount > 1;

  const removeParsedLine = (idx: number) => {
    const lines = quickImport.split('\n');
    let skipped = 0;
    const newLines = lines.filter((_l, i) => {
      const trimmed = lines[i].trim();
      if (!trimmed) return true;
      if (skipped === idx) {
        skipped++;
        return false;
      }
      skipped++;
      return true;
    });
    setQuickImport(newLines.join('\n'));
  };

  // --- Tags ---
  const addTag = () => {
    const val = tagInput.trim();
    if (val && !tags.includes(val)) {
      setTags([...tags, val]);
    }
    setTagInput('');
  };

  const removeTag = (idx: number) => {
    setTags(tags.filter((_, i) => i !== idx));
  };

  // --- Test single proxy ---
  const testSingleProxy = useCallback(async (key: string) => {
    setTestResults((prev) => ({ ...prev, [key]: { status: 'testing' } }));
    // Simulate test — replace with real IPC when available
    await new Promise((r) => setTimeout(r, 800 + Math.random() * 600));
    const ok = Math.random() > 0.25;
    const latency = (80 + Math.random() * 260).toFixed(0);
    setTestResults((prev) => ({
      ...prev,
      [key]: {
        status: ok ? 'success' : 'failed',
        message: ok ? `${latency}ms` : 'Timeout',
      },
    }));
  }, []);

  // --- Batch test all valid proxies ---
  const handleBatchTest = async () => {
    const toTest = parsedProxies.filter((p) => p.valid && !p.dupe);
    if (toTest.length === 0) return;

    setBatchTesting(true);
    for (const p of toTest) {
      await testSingleProxy(p.key);
    }
    setBatchTesting(false);
  };

  // --- Submit ---
  const handleSubmit = async () => {
    let added = 0;

    const pushProxy = async (
      h: string,
      p: string,
      u: string | undefined,
      pw: string | undefined,
      proto: string,
    ) => {
      try {
        // @ts-ignore
        await window.electron.ipcRenderer.invoke('proxy:create', {
          host: h,
          port: parseInt(p) || 8080,
          username: u || undefined,
          password: pw || undefined,
          protocol: proto.toLowerCase(),
          proxyType: 'private',
          sourceType: defaultSource.toLowerCase(),
          country: defaultCountry || undefined,
          isp: isp || undefined,
          status: 'active',
          tags: tags.length > 0 ? JSON.stringify(tags) : undefined,
          sticky_session: stickyEnabled,
          sticky_ttl: stickyEnabled ? parseInt(stickyTtl) || 30 : undefined,
          sticky_max: stickyEnabled ? parseInt(stickyMax) || 5 : undefined,
          rotation_interval: parseInt(rotationInterval) || 0,
          max_conns: parseInt(maxConns) || 10,
        });
        added++;
      } catch (err) {
        console.error('[ProxyModal] Create error:', err);
      }
    };

    const toAdd = parsedProxies.filter((p) => p.valid && !p.dupe);
    for (const p of toAdd) {
      await pushProxy(p.host, p.port, p.user, p.pass, p.protocol);
    }

    if (added === 0) {
      toast.error('No proxies to add');
      return;
    }

    toast.success(`Added ${added} proxy(s) — running health check…`);
    onSuccess();
    onClose();
  };

  // --- Test status icon ---
  const TestIcon = ({ status }: { status: TestStatus }) => {
    switch (status) {
      case 'testing':
        return <RefreshCw className="size-3 animate-spin text-text-secondary/60" />;
      case 'success':
        return <CheckCircle className="size-3 text-green" />;
      case 'failed':
        return <XCircle className="size-3 text-red" />;
      default:
        return null;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[640px]" hideCloseButton>
      <ModalHeader
        title="Add Proxy"
        description="Paste a list of proxies to bulk import."
        onClose={onClose}
      />

      <ModalBody className="space-y-4">
        {/* Proxy list textarea */}
        <div>
          <label className="block text-[10.5px] uppercase tracking-wider text-text-secondary/60 font-bold mb-1.5">
            Paste proxy list{' '}
            <span className="normal-case tracking-normal font-normal text-text-secondary/40">
              — one per line
            </span>
          </label>
          <textarea
            value={quickImport}
            onChange={(e) => setQuickImport(e.target.value)}
            placeholder={
              '45.2.11.6:8080:user1:pass123\n103.14.5.90:1080:user2:pass456\nsocks5://user3:pass789@192.0.2.14:3128'
            }
            className="w-full bg-input-background border border-border rounded-lg p-3 text-text-primary font-mono text-[12.5px] leading-relaxed outline-none focus:border-teal resize-y min-h-[96px]"
            rows={5}
            spellCheck={false}
          />
        </div>

        {/* Preview panel */}
        <div className="border border-border rounded-lg bg-card-background overflow-hidden">
          <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-border/30">
            <span className="text-[11.5px] text-text-secondary">
              Parsed <strong className="text-text-primary font-mono">{parsedProxies.length}</strong>{' '}
              proxies
            </span>
            <div className="flex items-center gap-3">
              <div className="flex gap-3 text-[11px] font-mono">
                <span className="flex items-center gap-1 text-green">
                  <span className="size-1.5 rounded-full bg-green" />
                  {validCount} valid
                </span>
                <span className="flex items-center gap-1 text-red">
                  <span className="size-1.5 rounded-full bg-red" />
                  {invalidCount} invalid
                </span>
                <span className="flex items-center gap-1 text-amber">
                  <span className="size-1.5 rounded-full bg-amber" />
                  {dupeCount} duplicate
                </span>
              </div>
              {validCount > 0 && (
                <button
                  type="button"
                  className="flex items-center gap-1.5 text-[11px] font-semibold text-text-secondary hover:text-teal transition-colors disabled:opacity-50"
                  onClick={handleBatchTest}
                  disabled={batchTesting}
                >
                  {batchTesting ? (
                    <RefreshCw className="size-3 animate-spin" />
                  ) : (
                    <Play className="size-3" />
                  )}
                  Test All
                </button>
              )}
            </div>
          </div>
          {parsedProxies.length === 0 ? (
            <div className="py-10 text-center text-[12px] text-text-secondary/50">
              Paste proxies above to see a live, validated preview here.
            </div>
          ) : (
            <div className="max-h-[180px] overflow-y-auto custom-scrollbar">
              {parsedProxies.map((p, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2.5 px-3.5 py-2 border-b border-border/20 last:border-b-0 font-mono text-[11.5px]"
                >
                  {p.valid && !p.dupe ? (
                    <span className="shrink-0 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-green/10 text-green border border-green/20 w-[42px] text-center font-sans">
                      Valid
                    </span>
                  ) : p.dupe ? (
                    <span className="shrink-0 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber/10 text-amber border border-amber/20 w-[42px] text-center font-sans">
                      Dupe
                    </span>
                  ) : (
                    <span className="shrink-0 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-red/10 text-red border border-red/20 w-[42px] text-center font-sans">
                      Invalid
                    </span>
                  )}
                  <span className="shrink-0 text-[10px] text-text-secondary/60 bg-muted/30 border border-border/30 rounded px-1.5 py-0.5">
                    {p.protocol}
                  </span>
                  <span className="flex-1 text-text-primary truncate" title={p.raw}>
                    {p.valid ? `${p.host}:${p.port}${p.user ? ` · ${p.user}` : ''}` : p.raw}
                  </span>

                  {/* Test result indicator */}
                  {p.valid &&
                    !p.dupe &&
                    testResults[p.key] &&
                    testResults[p.key].status !== 'idle' && (
                      <span
                        className={`shrink-0 flex items-center gap-1 text-[10px] font-sans ${
                          testResults[p.key].status === 'success'
                            ? 'text-green'
                            : testResults[p.key].status === 'failed'
                              ? 'text-red'
                              : 'text-text-secondary/60'
                        }`}
                      >
                        <TestIcon status={testResults[p.key].status} />
                        {testResults[p.key].message && <span>{testResults[p.key].message}</span>}
                      </span>
                    )}

                  {/* Test button per proxy */}
                  {p.valid && !p.dupe && (
                    <button
                      type="button"
                      className="shrink-0 size-5 flex items-center justify-center rounded text-text-secondary/40 hover:text-teal hover:bg-teal/10 transition-colors"
                      onClick={() => testSingleProxy(p.key)}
                      disabled={testResults[p.key]?.status === 'testing'}
                      title="Test connection"
                    >
                      {testResults[p.key]?.status === 'testing' ? (
                        <RefreshCw className="size-3 animate-spin" />
                      ) : (
                        <Play className="size-3" />
                      )}
                    </button>
                  )}

                  <button
                    type="button"
                    className="shrink-0 size-5 flex items-center justify-center rounded text-text-secondary/40 hover:text-red hover:bg-red/10 transition-colors"
                    onClick={() => removeParsedLine(i)}
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Shared settings warning */}
        {hasMultipleProxies && (
          <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-amber/10 border border-amber/20 text-[11.5px] text-amber">
            <span className="shrink-0 mt-0.5">⚠</span>
            <span>
              Multiple proxies detected. All proxies will share the same settings below:{' '}
              <strong>
                Protocol, Source, Country, ISP, Tags, Rotation interval, Max concurrent conns
              </strong>
              .
            </span>
          </div>
        )}

        {/* Default settings */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10.5px] uppercase tracking-wider text-text-secondary/60 font-bold mb-1.5">
              Protocol
            </label>
            <Dropdown open={openProtocol} onOpenChange={setOpenProtocol} className="w-full">
              <DropdownTrigger asChild>
                <button className="w-full flex items-center justify-between bg-input-background border border-border rounded-lg px-2.5 py-2 text-text-primary text-[12.5px] outline-none focus:border-teal font-sans transition-colors">
                  <span>{defaultProtocol}</span>
                  <ChevronDown className="size-3.5 text-text-secondary/60 shrink-0 ml-2" />
                </button>
              </DropdownTrigger>
              <DropdownContent className="w-[var(--trigger-width)]">
                <DropdownItem
                  onClick={() => {
                    setDefaultProtocol('HTTP');
                    setOpenProtocol(false);
                  }}
                >
                  HTTP
                </DropdownItem>
                <DropdownItem
                  onClick={() => {
                    setDefaultProtocol('HTTPS');
                    setOpenProtocol(false);
                  }}
                >
                  HTTPS
                </DropdownItem>
                <DropdownItem
                  onClick={() => {
                    setDefaultProtocol('SOCKS4');
                    setOpenProtocol(false);
                  }}
                >
                  SOCKS4
                </DropdownItem>
                <DropdownItem
                  onClick={() => {
                    setDefaultProtocol('SOCKS5');
                    setOpenProtocol(false);
                  }}
                >
                  SOCKS5
                </DropdownItem>
              </DropdownContent>
            </Dropdown>
          </div>
          <div>
            <label className="block text-[10.5px] uppercase tracking-wider text-text-secondary/60 font-bold mb-1.5">
              Source
            </label>
            <Dropdown open={openSource} onOpenChange={setOpenSource} className="w-full">
              <DropdownTrigger asChild>
                <button className="w-full flex items-center justify-between bg-input-background border border-border rounded-lg px-2.5 py-2 text-text-primary text-[12.5px] outline-none focus:border-teal font-sans transition-colors">
                  <span>{defaultSource}</span>
                  <ChevronDown className="size-3.5 text-text-secondary/60 shrink-0 ml-2" />
                </button>
              </DropdownTrigger>
              <DropdownContent className="w-[var(--trigger-width)]">
                <DropdownItem
                  onClick={() => {
                    setDefaultSource('Datacenter');
                    setOpenSource(false);
                  }}
                >
                  Datacenter
                </DropdownItem>
                <DropdownItem
                  onClick={() => {
                    setDefaultSource('Residential');
                    setOpenSource(false);
                  }}
                >
                  Residential
                </DropdownItem>
                <DropdownItem
                  onClick={() => {
                    setDefaultSource('Mobile');
                    setOpenSource(false);
                  }}
                >
                  Mobile
                </DropdownItem>
                <DropdownItem
                  onClick={() => {
                    setDefaultSource('ISP');
                    setOpenSource(false);
                  }}
                >
                  ISP
                </DropdownItem>
              </DropdownContent>
            </Dropdown>
          </div>
          <div>
            <label className="block text-[10.5px] uppercase tracking-wider text-text-secondary/60 font-bold mb-1.5">
              Country
            </label>
            <Dropdown open={openCountry} onOpenChange={setOpenCountry} className="w-full">
              <DropdownTrigger asChild>
                <button className="w-full flex items-center justify-between bg-input-background border border-border rounded-lg px-2.5 py-2 text-text-primary text-[12.5px] outline-none focus:border-teal font-sans transition-colors">
                  <span>{getCountryDisplay(defaultCountry)}</span>
                  <ChevronDown className="size-3.5 text-text-secondary/60 shrink-0 ml-2" />
                </button>
              </DropdownTrigger>
              <DropdownContent className="w-[var(--trigger-width)]">
                {COUNTRIES.map((c) => (
                  <DropdownItem
                    key={c.code}
                    onClick={() => {
                      setDefaultCountry(c.code);
                      setOpenCountry(false);
                    }}
                  >
                    {getCountryDisplay(c.code)}
                  </DropdownItem>
                ))}
              </DropdownContent>
            </Dropdown>
          </div>
          <div>
            <label className="block text-[10.5px] uppercase tracking-wider text-text-secondary/60 font-bold mb-1.5">
              ISP{' '}
              <span className="normal-case tracking-normal font-normal text-text-secondary/40">
                optional
              </span>
            </label>
            <input
              value={isp}
              onChange={(e) => setIsp(e.target.value)}
              placeholder="Viettel"
              className="w-full bg-input-background border border-border rounded-lg px-2.5 py-2 text-text-primary font-mono text-[12.5px] outline-none focus:border-teal"
            />
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-[10.5px] uppercase tracking-wider text-text-secondary/60 font-bold mb-1.5">
            Tags{' '}
            <span className="normal-case tracking-normal font-normal text-text-secondary/40">
              press Enter to add
            </span>
          </label>
          <div className="flex flex-wrap gap-1.5 items-center bg-input-background border border-border rounded-lg px-2.5 py-2 min-h-[38px] focus-within:border-teal transition-colors">
            {tags.map((tag, i) => (
              <span
                key={i}
                className="flex items-center gap-1 bg-card-background border border-border/50 text-text-primary font-mono text-[11px] px-2 py-0.5 rounded-md"
              >
                {tag}
                <button
                  type="button"
                  className="text-text-secondary/50 hover:text-red transition-colors"
                  onClick={() => removeTag(i)}
                >
                  <X className="size-2.5" />
                </button>
              </span>
            ))}
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addTag();
                } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
                  removeTag(tags.length - 1);
                }
              }}
              placeholder={tags.length === 0 ? 'e.g. checkout, priority-1' : ''}
              className="flex-1 min-w-[100px] bg-transparent border-none outline-none text-text-primary font-mono text-[12px] py-0.5 placeholder:text-text-secondary/40"
            />
          </div>
        </div>

        {/* Sticky session */}
        <div className="flex items-center justify-between px-3.5 py-3 bg-card-background border border-border rounded-lg">
          <div>
            <div className="text-[13px] font-semibold text-text-primary">Sticky session</div>
            <div className="text-[11px] text-text-secondary/50 mt-0.5">
              Keep the same exit IP bound to an account for a set duration.
            </div>
          </div>
          <Toggle
            checked={stickyEnabled}
            onChange={setStickyEnabled}
            className="shrink-0 ml-4"
          />
        </div>

        {stickyEnabled && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10.5px] uppercase tracking-wider text-text-secondary/60 font-bold mb-1.5">
                Session TTL{' '}
                <span className="normal-case tracking-normal font-normal text-text-secondary/40">
                  minutes
                </span>
              </label>
              <input
                value={stickyTtl}
                onChange={(e) => setStickyTtl(e.target.value)}
                placeholder="30"
                className="w-full bg-input-background border border-border rounded-lg px-2.5 py-2 text-text-primary font-mono text-[12.5px] outline-none focus:border-teal"
              />
            </div>
            <div>
              <label className="block text-[10.5px] uppercase tracking-wider text-text-secondary/60 font-bold mb-1.5">
                Max bindings
              </label>
              <input
                value={stickyMax}
                onChange={(e) => setStickyMax(e.target.value)}
                placeholder="5"
                className="w-full bg-input-background border border-border rounded-lg px-2.5 py-2 text-text-primary font-mono text-[12.5px] outline-none focus:border-teal"
              />
            </div>
          </div>
        )}

        {/* Advanced accordion */}
        <div className="border border-border rounded-lg overflow-hidden bg-card-background">
          <button
            type="button"
            className="flex items-center justify-between w-full px-3.5 py-3 text-left hover:bg-table-row-hover transition-colors"
            onClick={() => setAdvancedOpen(!advancedOpen)}
          >
            <span className="text-[13px] font-semibold text-text-primary flex items-center gap-2">
              <Shield className="size-3.5 text-text-secondary/60" />
              Advanced settings
            </span>
            <ChevronDown
              className={`size-4 text-text-secondary/60 transition-transform ${advancedOpen ? 'rotate-180' : ''}`}
            />
          </button>
          {advancedOpen && (
            <div className="px-3.5 pb-4 space-y-3 border-t border-border/30 pt-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10.5px] uppercase tracking-wider text-text-secondary/60 font-bold mb-1.5">
                    Rotation interval{' '}
                    <span className="normal-case tracking-normal font-normal text-text-secondary/40">
                      min, 0 = off
                    </span>
                  </label>
                  <input
                    value={rotationInterval}
                    onChange={(e) => setRotationInterval(e.target.value)}
                    placeholder="0"
                    className="w-full bg-input-background border border-border rounded-lg px-2.5 py-2 text-text-primary font-mono text-[12.5px] outline-none focus:border-teal"
                  />
                </div>
                <div>
                  <label className="block text-[10.5px] uppercase tracking-wider text-text-secondary/60 font-bold mb-1.5">
                    Max concurrent conns
                  </label>
                  <input
                    value={maxConns}
                    onChange={(e) => setMaxConns(e.target.value)}
                    placeholder="10"
                    className="w-full bg-input-background border border-border rounded-lg px-2.5 py-2 text-text-primary font-mono text-[12.5px] outline-none focus:border-teal"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </ModalBody>

      <ModalFooter>
        <div className="flex items-center justify-end w-full gap-2.5">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="solid" onClick={handleSubmit} disabled={validCount === 0}>
            <Plus className="size-3.5" />
            {validCount > 1 ? `Add ${validCount} to Registry` : 'Add to Registry'}
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  );
}
