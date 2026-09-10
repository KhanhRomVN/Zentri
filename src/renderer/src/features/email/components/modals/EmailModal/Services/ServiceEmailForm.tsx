/**
 * ------------------------------------------------------------------
 * ServiceForm
 * ------------------------------------------------------------------
 * Editable security and metadata form for a linked service.
 * Handles TOTP secret, live code, backup codes, and dynamic
 * metadata fields. Persists changes via `service_emails:update`
 * when fields are blurred or backup codes are added/removed.
 * ------------------------------------------------------------------
 */

import { FC, useState, useEffect, useCallback } from 'react';
import { ShieldCheck, Eye, EyeOff, List, Copy, Key, Wand } from 'lucide-react';
import { cn } from '../../../../../../shared/lib/utils';
import { generateTotp, isValidBase32 } from '../../../../../../shared/lib/totp';
import Input from '../../../../../../components/ui/Input/Input';
import { EmptyState } from '../../../../../../components/ui/EmptyState';

const normalizeMetadata = (meta: any): Record<string, any> => {
  if (!meta) return {};
  if (typeof meta === 'string') {
    try {
      return normalizeMetadata(JSON.parse(meta));
    } catch {
      return {};
    }
  }
  if (Array.isArray(meta)) {
    const obj: Record<string, any> = {};
    meta.forEach((m: any) => {
      obj[m.key || m.name] = m.value;
    });
    return obj;
  }
  return meta;
};

interface ServiceFormProps {
  service: any;
  autoSave?: boolean;
  onChange?: (data: {
    metadata: Record<string, any>;
    twoFa: { totp: string; backupCodes: string[] };
  }) => void;
}

const ServiceForm: FC<ServiceFormProps> = ({ service, autoSave = true, onChange }) => {
  const linkedTwoFa = service.twoFa || {};
  const linkedTotpSecret: string = linkedTwoFa.totp || '';
  const linkedBackupCodes: string[] = linkedTwoFa.backupCodes || [];

  const [totpSecret, setTotpSecret] = useState(linkedTotpSecret);
  const [backupCodes, setBackupCodes] = useState<string[]>(linkedBackupCodes);
  const [totpCode, setTotpCode] = useState<string | null>(null);
  const [totpTimer, setTotpTimer] = useState(30);
  const [showTotp, setShowTotp] = useState(false);
  const [backupInput, setBackupInput] = useState('');
  const [previewBackupCodes, setPreviewBackupCodes] = useState<string[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [metadataValues, setMetadataValues] = useState<Record<string, any>>(() =>
    normalizeMetadata(service.metadata),
  );
  const [serviceMetadata, setServiceMetadata] = useState<any[]>([]);

  const hasTotpValue = !!totpSecret && isValidBase32(totpSecret);

  const persistServiceLink = useCallback(
    async (overrides?: { metadata?: Record<string, any>; twoFa?: { totp?: string; backupCodes?: string[] } }) => {
      const metadata = overrides?.metadata ?? metadataValues;
      const twoFa = {
        totp: overrides?.twoFa?.totp ?? totpSecret,
        backupCodes: overrides?.twoFa?.backupCodes ?? backupCodes,
      };
      if (autoSave && service.id) {
        try {
          // @ts-ignore
          await window.electron.ipcRenderer.invoke('service_emails:update', {
            linkId: service.id,
            metadata,
            twoFa,
          });
        } catch (err) {
          console.error('Failed to update service link', err);
        }
      } else {
        onChange?.({ metadata, twoFa });
      }
    },
    [service.id, metadataValues, totpSecret, backupCodes, autoSave, onChange],
  );

  const handleAddBackupCode = () => {
    const val = backupInput.trim();
    if (!val || backupCodes.includes(val)) return;
    const next = [...backupCodes, val];
    setBackupCodes(next);
    setBackupInput('');
    persistServiceLink({ twoFa: { totp: totpSecret, backupCodes: next } });
  };

  const handleConvertPreview = () => {
    const parts = backupInput
      .split(',')
      .map((p) => p.trim())
      .filter((p) => p.length >= 6);
    setPreviewBackupCodes(Array.from(new Set(parts)));
  };

  const handleClearPreview = () => {
    setPreviewBackupCodes([]);
    setBackupInput('');
  };

  const handleAddPreview = () => {
    const toAdd = previewBackupCodes.filter((c) => !backupCodes.includes(c));
    if (toAdd.length === 0) return;
    const next = [...backupCodes, ...toAdd];
    setBackupCodes(next);
    setPreviewBackupCodes([]);
    setBackupInput('');
    persistServiceLink({ twoFa: { totp: totpSecret, backupCodes: next } });
  };

  const handleRemoveBackupCode = (code: string) => {
    const next = backupCodes.filter((c) => c !== code);
    setBackupCodes(next);
    persistServiceLink({ twoFa: { totp: totpSecret, backupCodes: next } });
  };

  useEffect(() => {
    if (!hasTotpValue) {
      setTotpCode(null);
      setTotpTimer(30);
      return;
    }
    const tick = () => {
      setTotpCode(generateTotp(totpSecret));
      setTotpTimer(30 - (Math.floor(Date.now() / 1000) % 30));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [totpSecret, hasTotpValue]);

  const copyTotp = useCallback(() => {
    if (totpCode) {
      navigator.clipboard.writeText(totpCode);
    }
  }, [totpCode]);

  useEffect(() => {
    if (!autoSave && onChange) {
      onChange({
        metadata: metadataValues,
        twoFa: { totp: totpSecret, backupCodes },
      });
    }
  }, [autoSave, onChange, metadataValues, totpSecret, backupCodes]);

  useEffect(() => {
    const fetchServiceConfig = async () => {
      try {
        // @ts-ignore
        const rows = await window.electron.ipcRenderer.invoke(
          'sqlite:all',
          'SELECT metadata FROM services WHERE id = ?',
          [service.serviceId],
        );
        if (rows.length > 0) {
          const row = rows[0];
          if (row.metadata) {
            const parsed = JSON.parse(row.metadata);
            setServiceMetadata(Array.isArray(parsed) ? parsed : parsed.fields || []);
          } else {
            setServiceMetadata([]);
          }
        } else {
          setServiceMetadata([]);
        }
      } catch {
        setServiceMetadata([]);
      }
    };
    if (service.serviceId) {
      fetchServiceConfig();
    }
  }, [service.serviceId]);

  return (
    <>
      <section className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-success/10 text-success flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-bold text-foreground">Security</h3>
            <p className="text-sm text-text-secondary">
              TOTP live code and one-time backup codes
            </p>
          </div>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-[1fr_auto] gap-4 items-start">
            <Input
              label="TOTP Key"
              type={showTotp ? 'text' : 'password'}
              value={totpSecret}
              onChange={(e) => setTotpSecret(e.target.value)}
              onBlur={() => persistServiceLink({ twoFa: { totp: totpSecret, backupCodes } })}
              placeholder="Enter TOTP key..."
              leftIcon={<Key className="w-4 h-4" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowTotp((prev) => !prev)}
                  className="flex items-center hover:opacity-70 transition-opacity"
                  aria-label={showTotp ? 'Hide TOTP key' : 'Show TOTP key'}
                >
                  {showTotp ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />

            <div className="flex items-end gap-2">
              {hasTotpValue && (
                <div className="relative h-10 w-10 shrink-0 rounded-lg bg-input-background border border-input-border-default flex items-center justify-center">
                  <svg className="w-6 h-6 -rotate-90" viewBox="0 0 24 24">
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-border"
                    />
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeDasharray="62.83"
                      strokeDashoffset={62.83 * (1 - totpTimer / 30)}
                      className={
                        totpTimer > 10
                          ? 'text-success'
                          : totpTimer > 5
                            ? 'text-warn'
                            : 'text-error'
                      }
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-[9px] font-mono text-text-primary">
                    {totpTimer}
                  </span>
                </div>
              )}
              <Input
                label="Live code"
                value={hasTotpValue && totpCode ? totpCode : ''}
                readOnly
                placeholder="------"
                className="!w-[150px] font-mono tracking-[0.35em] text-center"
                inputClassName="pr-14"
                rightIcon={
                  <button
                    type="button"
                    onClick={copyTotp}
                    disabled={!hasTotpValue}
                    className="flex items-center hover:opacity-70 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="Copy live code"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-text-primary">Backup Codes</label>
            <div className="flex items-start gap-2">
              <Input
                value={backupInput}
                onChange={(e) => setBackupInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddBackupCode();
                  }
                }}
                placeholder='Paste codes, e.g. "ABC123, DEF456"'
                containerClassName="flex-1"
              />
              <button
                type="button"
                onClick={handleConvertPreview}
                disabled={!backupInput.trim()}
                className="flex items-center justify-center w-10 h-10 rounded-lg bg-card-background border border-border text-text-secondary hover:text-primary hover:border-primary/50 transition-colors shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Convert to preview badges"
              >
                <Wand className="w-4 h-4" />
              </button>
            </div>

            {previewBackupCodes.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {previewBackupCodes.map((code) => {
                  const isDuplicate = backupCodes.includes(code);
                  return (
                    <span
                      key={code}
                      onClick={() => {
                        if (!isDuplicate) {
                          setPreviewBackupCodes((prev) => prev.filter((c) => c !== code));
                        }
                      }}
                      className={cn(
                        'inline-flex items-center px-3 py-1.5 rounded-lg text-[13px] font-medium border select-none',
                        isDuplicate
                          ? 'border-dashed border-border/40 bg-muted/20 text-text-tertiary cursor-default'
                          : 'border-dashed border-primary/40 bg-primary/5 text-primary cursor-pointer hover:bg-error/10 hover:border-error/40 hover:text-error transition-colors',
                      )}
                    >
                      {code}
                    </span>
                  );
                })}
              </div>
            )}

            {previewBackupCodes.length > 0 && (
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleClearPreview}
                  className="h-9 px-3 rounded-lg text-sm font-medium text-text-secondary hover:text-foreground border border-border hover:bg-muted transition-colors"
                >
                  Delete All
                </button>
                <button
                  type="button"
                  onClick={handleAddPreview}
                  className="h-9 px-3 rounded-lg text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                >
                  Add
                </button>
              </div>
            )}

            {backupCodes.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {backupCodes.map((code) => (
                  <div
                    key={code}
                    onClick={() => {
                      navigator.clipboard.writeText(code).catch(() => {});
                      setCopiedCode(code);
                      window.setTimeout(() => {
                        setCopiedCode((prev) => (prev === code ? null : prev));
                      }, 1500);
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      handleRemoveBackupCode(code);
                    }}
                    className={cn(
                      'flex items-center px-3 py-2 rounded-lg border bg-input-background cursor-pointer transition-colors',
                      copiedCode === code
                        ? 'border-dashed border-green'
                        : 'border-border/50 hover:border-primary/40',
                    )}
                  >
                    <span className="text-xs font-mono text-text-primary">{code}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-warn/10 text-warn flex items-center justify-center shrink-0">
            <List className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-bold text-foreground">Metadata Fields</h3>
            <p className="text-sm text-text-secondary">
              Custom fields defined by the service template
            </p>
          </div>
        </div>
        {serviceMetadata.length > 0 ? (
          <div className="space-y-3">
            {serviceMetadata.map((item: any, i: number) => {
              const fieldName = item.key || item.name || `Field ${i + 1}`;
              const fieldValue = metadataValues[fieldName] || '';
              return (
                <Input
                  key={i}
                  label={fieldName}
                  value={fieldValue}
                  onChange={(e) =>
                    setMetadataValues((prev) => ({
                      ...prev,
                      [fieldName]: e.target.value,
                    }))
                  }
                  onBlur={() => persistServiceLink()}
                  placeholder={`Enter ${fieldName.toLowerCase()}...`}
                />
              );
            })}
          </div>
        ) : (
          <EmptyState
            variant="default"
            icon={<List className="w-6 h-6" />}
            title="No metadata fields"
            description=""
            className="h-auto py-4"
          />
        )}
      </section>
    </>
  );
};

export default ServiceForm;