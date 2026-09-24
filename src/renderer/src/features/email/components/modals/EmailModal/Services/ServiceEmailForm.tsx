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

import { FC, useState, useEffect, useCallback, useRef } from 'react';
import { List } from 'lucide-react';
import { generateTotp, isValidBase32 } from '../../../../../../shared/lib/totp';
import Input from '../../../../../../components/ui/Input/Input';
import { EmptyState } from '../../../../../../components/ui/EmptyState';
import TwoFactorAuthFields from '../TwoFactorAuthFields';
import QRCodeTOTPScannerModal from '../../../modals/QRCodeTOTPScannerModal';

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
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [backupInput, setBackupInput] = useState('');
  const [previewBackupCodes, setPreviewBackupCodes] = useState<string[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [metadataValues, setMetadataValues] = useState<Record<string, any>>(() =>
    normalizeMetadata(service.metadata),
  );
  const [serviceMetadata, setServiceMetadata] = useState<any[]>([]);

  const hasTotpValue = !!totpSecret && isValidBase32(totpSecret);

  // [DEBUG] latest-value refs so mount/unmount logs report current state, not the
  // values captured at mount time.
  const totpSecretRef = useRef(totpSecret);
  totpSecretRef.current = totpSecret;
  const backupCodesRef = useRef(backupCodes);
  backupCodesRef.current = backupCodes;

  // Notify the parent list (EmailTable) to refetch account data after a save.
  // Without this, reopening the modal reads stale `focusedAccount.services`
  // and the TOTP/backup values appear to be lost even though they are in the DB.
  const notifyServiceLinkChanged = useCallback(() => {
    try {
      window.dispatchEvent(new Event('account-services-changed'));
    } catch (err) {
      console.error('Failed to dispatch account-services-changed', err);
    }
  }, []);

  const persistServiceLink = useCallback(
    async (overrides?: { metadata?: Record<string, any>; twoFa?: { totp?: string; backupCodes?: string[] } }) => {
      const metadata = overrides?.metadata ?? metadataValues;
      const twoFa = {
        totp: overrides?.twoFa?.totp ?? totpSecret,
        backupCodes: overrides?.twoFa?.backupCodes ?? backupCodes,
      };
      // [DEBUG] trace every explicit persist call path (blur + handlers).
      console.log('[DEBUG ServiceEmailForm] persistServiceLink called', {
        serviceId: service.id,
        autoSave,
        totp: twoFa.totp,
        backupCodesCount: twoFa.backupCodes.length,
        metadataKeys: Object.keys(metadata).length,
      });
      if (autoSave && service.id) {
        try {
          // @ts-ignore
          await window.electron.ipcRenderer.invoke('service_emails:update', {
            linkId: service.id,
            metadata,
            twoFa,
          });
          // [DEBUG] confirm the IPC round-trip actually succeeded.
          console.log('[DEBUG ServiceEmailForm] service_emails:update OK', {
            serviceId: service.id,
          });
          notifyServiceLinkChanged();
        } catch (err) {
          console.error('Failed to update service link', err);
        }
      } else {
        // [DEBUG] early-return path: draft link or autoSave disabled.
        console.log('[DEBUG ServiceEmailForm] skip persist (no autoSave or no service.id)', {
          autoSave,
          hasId: !!service.id,
        });
        onChange?.({ metadata, twoFa });
      }
    },
    [service.id, metadataValues, totpSecret, backupCodes, autoSave, onChange, notifyServiceLinkChanged],
  );

  // [DEBUG] mount/unmount trace. Unmount is the prime suspect for the
  // "value lost on close" bug since Modal.tsx returns null when isOpen=false.
  useEffect(() => {
    console.log('[DEBUG ServiceEmailForm] MOUNTED', {
      serviceId: service.id,
      linkedTotp: linkedTotpSecret,
    });
    return () => {
      console.log('[DEBUG ServiceEmailForm] UNMOUNTED', {
        serviceId: service.id,
        localTotp: totpSecretRef.current,
        localBackupCodesCount: backupCodesRef.current.length,
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // [DEBUG] log each change of the TOTP input value.
  useEffect(() => {
    console.log('[DEBUG ServiceEmailForm] totpSecret changed', {
      serviceId: service.id,
      value: totpSecret,
      linked: linkedTotpSecret,
      dirty: totpSecret !== linkedTotpSecret,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totpSecret]);

  // Debounced auto-save: persist any change 400ms after the last keystroke,
  // following the InfoTab pattern of saving on input instead of waiting for
  // blur (which never fires when the modal is closed while an input is focused).
  const isFirstRenderRef = useRef(true);
  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      console.log('[DEBUG ServiceEmailForm] debounce effect: first render, skip', {
        serviceId: service.id,
      });
      return;
    }
    if (!autoSave || !service.id) {
      console.log('[DEBUG ServiceEmailForm] debounce effect: skip (no autoSave or no service.id)', {
        autoSave,
        hasId: !!service.id,
      });
      return;
    }
    const linkedTotp = (service.twoFa || {}).totp || '';
    const linkedBackupCodes: string[] = (service.twoFa || {}).backupCodes || [];
    const linkedMetadata = normalizeMetadata(service.metadata);
    const changed =
      totpSecret !== linkedTotp ||
      JSON.stringify(backupCodes) !== JSON.stringify(linkedBackupCodes) ||
      JSON.stringify(metadataValues) !== JSON.stringify(linkedMetadata);
    // [DEBUG] show whether the effect schedules a save or exits early.
    console.log('[DEBUG ServiceEmailForm] debounce effect: evaluating', {
      serviceId: service.id,
      changed,
      localTotp: totpSecret,
      linkedTotp,
    });
    if (!changed) return;
    const timer = setTimeout(() => {
      // [DEBUG] the critical log: does the timer actually fire before unmount?
      console.log('[DEBUG ServiceEmailForm] debounce timer FIRED → invoking IPC', {
        serviceId: service.id,
        totp: totpSecret,
      });
     // @ts-ignore
      window.electron.ipcRenderer
        .invoke('service_emails:update', {
          linkId: service.id,
          metadata: metadataValues,
          twoFa: { totp: totpSecret, backupCodes },
        })
        .then(() => {
          console.log('[DEBUG ServiceEmailForm] debounce IPC resolved OK', {
            serviceId: service.id,
          });
          notifyServiceLinkChanged();
        })
        .catch((err: any) => console.error('Failed to persist service link', err));
    }, 400);
    return () => {
      // [DEBUG] if this fires before the timer, the value is lost on unmount.
      console.log('[DEBUG ServiceEmailForm] debounce cleanup (timer cleared before fire)', {
        serviceId: service.id,
        localTotp: totpSecret,
      });
      clearTimeout(timer);
    };
    // Only re-run when the editable values actually change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totpSecret, backupCodes, metadataValues]);

  const handleAddBackupCode = () => {
    const val = backupInput.trim();
    if (!val || backupCodes.includes(val)) return;
    const next = [...backupCodes, val];
    setBackupCodes(next);
    setBackupInput('');
    persistServiceLink({ twoFa: { totp: totpSecret, backupCodes: next } });
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
      // [DEBUG] trace onChange propagation to parent when in draft mode
      console.log('[DEBUG ServiceEmailForm] onChange fired (autoSave=false)', {
        serviceId: service.id,
        metadata: metadataValues,
        totp: totpSecret,
        backupCodesCount: backupCodes.length,
      });
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
      // ServiceFormModal dispatches this after editing a service; re-fetch the
      // definition so the rendered fields update without remounting.
      const handler = () => fetchServiceConfig();
      window.addEventListener('services-changed', handler);
      return () => window.removeEventListener('services-changed', handler);
    }
    return undefined;
  }, [service.serviceId]);

  return (
    <>
      <TwoFactorAuthFields
        title="Security"
        description="TOTP live code and one-time backup codes"
        totpValue={totpSecret}
        onTotpChange={(e) => {
          // [DEBUG] confirm the input event fires and value propagates.
          console.log('[DEBUG ServiceEmailForm] TOTP input onChange', {
            serviceId: service.id,
            value: e.target.value,
          });
          setTotpSecret(e.target.value);
        }}
        onTotpBlur={() => {
          // [DEBUG] confirm whether blur fires before unmount.
          console.log('[DEBUG ServiceEmailForm] TOTP input onBlur → persist', {
            serviceId: service.id,
            value: totpSecret,
          });
          persistServiceLink({ twoFa: { totp: totpSecret, backupCodes } });
        }}
        showTotp={showTotp}
        onToggleShowTotp={() => setShowTotp((prev) => !prev)}
        hasTotp={hasTotpValue}
        totpValid={hasTotpValue}
        liveCode={totpCode ?? ''}
        totpRemaining={totpTimer}
        onCopyLiveCode={copyTotp}
        onScanQr={() => setQrModalOpen(true)}
        backupCodes={backupCodes}
        onCopyBackupCode={(code) => {
          navigator.clipboard.writeText(code).catch(() => {});
          setCopiedCode(code);
          window.setTimeout(() => {
            setCopiedCode((prev) => (prev === code ? null : prev));
          }, 1500);
        }}
        onRemoveBackupCode={handleRemoveBackupCode}
        copiedCode={copiedCode}
        backupCodeInput={backupInput}
        onBackupCodeInputChange={(e) => {
          const val = e.target.value;
          setBackupInput(val);
          // Auto-derive preview badges live — accepts comma- or
          // whitespace-separated codes, no separate "convert" step.
          const parts = val
            .split(/[,\s]+/)
            .map((p) => p.trim())
            .filter((p) => p.length >= 6);
          setPreviewBackupCodes(Array.from(new Set(parts)));
        }}
        onBackupCodeInputKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            handleAddBackupCode();
          }
        }}
        previewBackupCodes={previewBackupCodes}
        onRemovePreviewCode={(code) =>
          setPreviewBackupCodes((prev) => prev.filter((c) => c !== code))
        }
        onClearPreviewCodes={handleClearPreview}
        onAddPreviewCodes={handleAddPreview}
      />

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
      <QRCodeTOTPScannerModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        onScanSuccess={(secret) => {
          setTotpSecret(secret);
          persistServiceLink({ twoFa: { totp: secret, backupCodes } });
        }}
      />
    </>
  );
};

export default ServiceForm;