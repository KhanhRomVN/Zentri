/**
 * ------------------------------------------------------------------
 * TwoFactorAuthFields
 * ------------------------------------------------------------------
 * Shared, fully-controlled UI for the TOTP key + live code + backup
 * codes block, used by both AccountForm (Information tab) and
 * ServiceEmailForm (Services tab). It owns no state and no
 * persistence logic — each parent keeps its own state/handlers and
 * just wires them into these props. This only removes the duplicated
 * markup between the two forms; behavior stays where it already was.
 * ------------------------------------------------------------------
 */

import { FC, ChangeEvent, KeyboardEvent } from 'react';
import { ShieldCheck, Key, Eye, EyeOff, Copy, QrCode } from 'lucide-react';
import { cn } from '../../../../../shared/lib/utils';
import Input from '../../../../../components/ui/Input/Input';

export interface TwoFactorAuthFieldsProps {
  title?: string;
  description?: string;

  // ── TOTP ──
  totpValue: string;
  onTotpChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onTotpBlur?: (e: ChangeEvent<HTMLInputElement>) => void;
  totpError?: string;
  showTotp: boolean;
  onToggleShowTotp: () => void;
  /** Whether a TOTP secret has been entered at all (controls ring/live-code visibility). */
  hasTotp: boolean;
  /** Whether the current secret produces a real code (controls error styling). */
  totpValid: boolean;
  liveCode: string;
  /** Seconds remaining in the current 30s TOTP window. */
  totpRemaining: number;
  onCopyLiveCode: () => void;
  /** Renders the QR-scan button next to the TOTP input when provided. */
  onScanQr?: () => void;

  // ── Backup codes ──
  backupCodes: string[];
  onCopyBackupCode: (code: string) => void;
  onRemoveBackupCode: (code: string) => void;
  copiedCode: string | null;

  backupCodeInput: string;
  onBackupCodeInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onBackupCodeInputKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void;
  /** Shown as the input's own error (e.g. too short / duplicate code). */
  backupCodeError?: string;
  /** Shown under the "Backup Codes" label (e.g. invalid-character validation). */
  backupCodeLabelError?: string;

  previewBackupCodes: string[];
  onRemovePreviewCode: (code: string) => void;
  onClearPreviewCodes: () => void;
  onAddPreviewCodes: () => void;
}

const TwoFactorAuthFields: FC<TwoFactorAuthFieldsProps> = ({
  title = 'Two-factor authentication',
  description = 'TOTP app codes and one-time backup codes',
  totpValue,
  onTotpChange,
  onTotpBlur,
  totpError,
  showTotp,
  onToggleShowTotp,
  hasTotp,
  totpValid,
  liveCode,
  totpRemaining,
  onCopyLiveCode,
  onScanQr,
  backupCodes,
  onCopyBackupCode,
  onRemoveBackupCode,
  copiedCode,
  backupCodeInput,
  onBackupCodeInputChange,
  onBackupCodeInputKeyDown,
  backupCodeError,
  backupCodeLabelError,
  previewBackupCodes,
  onRemovePreviewCode,
  onClearPreviewCodes,
  onAddPreviewCodes,
}) => {
  return (
    <section className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-success/10 text-success flex items-center justify-center shrink-0">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <h3 className="text-base font-bold text-foreground">{title}</h3>
          <p className="text-sm text-text-secondary">{description}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-[1fr_auto] gap-4 items-start">
          <div className="flex items-start gap-2">
            <Input
              label="TOTP Key"
              type={showTotp ? 'text' : 'password'}
              value={totpValue}
              onChange={onTotpChange}
              onBlur={onTotpBlur}
              placeholder="Enter TOTP key..."
              leftIcon={<Key className="w-4 h-4" />}
              rightIcon={
                <button
                  type="button"
                  onClick={onToggleShowTotp}
                  className="flex items-center justify-center hover:opacity-70 transition-opacity"
                  aria-label={showTotp ? 'Hide TOTP key' : 'Show TOTP key'}
                >
                  {showTotp ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
              error={totpError}
              containerClassName="flex-1"
            />
            {onScanQr && (
              <div className="flex flex-col gap-1.5 shrink-0">
                <label
                  className="text-sm font-medium text-text-primary invisible select-none"
                  aria-hidden="true"
                >
                  &nbsp;
                </label>
                <button
                  type="button"
                  onClick={onScanQr}
                  className="w-10 h-[38px] rounded-lg bg-card-background border border-border text-text-secondary hover:text-primary hover:border-primary/50 flex items-center justify-center transition-colors"
                  title="Scan QR code from image/clipboard"
                >
                  <QrCode className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <div className="flex items-end gap-2">
            {hasTotp && (
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
                    strokeDashoffset={62.83 * (1 - totpRemaining / 30)}
                    className={
                      totpRemaining > 10
                        ? 'text-success'
                        : totpRemaining > 5
                          ? 'text-warn'
                          : 'text-error'
                    }
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[9px] font-mono text-text-primary">
                  {totpRemaining}
                </span>
              </div>
            )}
            <Input
              label="Live code"
              value={hasTotp ? liveCode : ''}
              readOnly
              placeholder="------"
              error={hasTotp && !totpValid ? 'Invalid TOTP key' : undefined}
              className={cn(
                '!w-[150px] font-mono tracking-[0.35em] text-center',
                hasTotp && !totpValid ? 'text-error' : 'text-primary',
              )}
              inputClassName="pr-14"
              rightIcon={
                <button
                  type="button"
                  onClick={onCopyLiveCode}
                  disabled={!hasTotp}
                  className="flex items-center justify-center hover:opacity-70 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Copy live code"
                >
                  <Copy className="w-4 h-4" />
                </button>
              }
            />
          </div>
        </div>

        <div className="space-y-2.5">
          <label className="text-sm font-medium text-text-primary">Backup Codes</label>
          {backupCodeLabelError && (
            <span className="text-xs text-error">{backupCodeLabelError}</span>
          )}

          <Input
            value={backupCodeInput}
            onChange={onBackupCodeInputChange}
            onKeyDown={onBackupCodeInputKeyDown}
            placeholder='Paste codes, e.g. "ABC123 DEF456" or "ABC123, DEF456"'
            error={backupCodeError}
          />

          {previewBackupCodes.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {previewBackupCodes.map((code) => {
                const isDuplicate = backupCodes.includes(code);
                return (
                  <span
                    key={code}
                    onClick={() => {
                      if (!isDuplicate) onRemovePreviewCode(code);
                    }}
                    className={cn(
                      'inline-flex items-center px-3 py-1.5 rounded-lg text-[13px] font-medium border select-none',
                      isDuplicate
                        ? 'border-dashed border-border/40 bg-muted/20 text-text-tertiary cursor-default'
                        : 'border-dashed border-primary/40 bg-primary/5 text-primary cursor-pointer hover:bg-error/10 hover:border-error/40 hover:text-error transition-colors',
                    )}
                    title={isDuplicate ? 'Already exists — cannot add' : 'Click to remove'}
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
                onClick={onClearPreviewCodes}
                className="h-9 px-3 rounded-lg text-sm font-medium text-text-secondary hover:text-foreground border border-border hover:bg-muted transition-colors"
              >
                Delete All
              </button>
              <button
                type="button"
                onClick={onAddPreviewCodes}
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
                  onClick={() => onCopyBackupCode(code)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    onRemoveBackupCode(code);
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
  );
};

export default TwoFactorAuthFields;