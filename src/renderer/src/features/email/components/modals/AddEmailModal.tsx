/**
 * ------------------------------------------------------------------
 * AddEmailModal
 * ------------------------------------------------------------------
 * Modal for adding a new email account to the repository.
 * Extracted from Email.tsx drawer to keep the main component lean.
 * ------------------------------------------------------------------
 */

import { FC } from 'react';
import { Shield, Key, Hash, X } from 'lucide-react';
import { cn } from '../../../../shared/lib/utils';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../../../../components/ui/Modal';
import { Button } from '../../../../components/ui/Button';

export interface NewEmailData {
  email: string;
  password: string;
  recoveryEmail: string;
  phoneNumber: string;
  totpSecretKey: string;
  backupCodes: string[];
}

interface AddEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  newEmailData: NewEmailData;
  setNewEmailData: React.Dispatch<React.SetStateAction<NewEmailData>>;
  backupCodeSearch: string;
  setBackupCodeSearch: (val: string) => void;
  errors: Record<string, string>;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  validateField: (name: string, value: string) => void;
  handleAddEmail: () => void;
}

const AddEmailModal: FC<AddEmailModalProps> = ({
  isOpen,
  onClose,
  newEmailData,
  setNewEmailData,
  backupCodeSearch,
  setBackupCodeSearch,
  errors,
  setErrors,
  validateField,
  handleAddEmail,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg">
      <ModalHeader
        title="Add Account"
        description="Add a new email account to your repository"
        onClose={onClose}
      />
      <ModalBody className="space-y-6">
        {/* Account Credentials */}
        <div className="space-y-4">
          <div className="space-y-2.5">
            <label className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground/70">
              Email
              <span className="text-destructive ml-1">*</span>
            </label>
            <input
              type="text"
              placeholder="identity@example.com"
              value={newEmailData.email}
              onChange={(e) => {
                setNewEmailData((d) => ({ ...d, email: e.target.value }));
                if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
              }}
              onBlur={() => validateField('email', newEmailData.email)}
              className={cn(
                'w-full h-10 px-3 rounded-xl bg-input-background border text-sm text-foreground placeholder:text-muted-foreground/40 outline-none transition-colors focus:border-primary/50',
                errors.email ? 'border-destructive' : 'border-border',
              )}
            />
          </div>
          <div className="space-y-2.5">
            <label className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground/70">
              Password
              <span className="text-destructive ml-1">*</span>
            </label>
            <input
              type="password"
              placeholder="••••••••••••"
              value={newEmailData.password}
              onChange={(e) => {
                setNewEmailData((d) => ({ ...d, password: e.target.value }));
                if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
              }}
              onBlur={() => validateField('password', newEmailData.password)}
              className={cn(
                'w-full h-10 px-3 rounded-xl bg-input-background border text-sm text-foreground placeholder:text-muted-foreground/40 outline-none transition-colors focus:border-primary/50',
                errors.password ? 'border-destructive' : 'border-border',
              )}
            />
          </div>
          <div className="space-y-2.5">
            <label className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground/70">
              Recovery Email
            </label>
            <input
              type="text"
              placeholder="backup@proton.me"
              value={newEmailData.recoveryEmail}
              onChange={(e) => {
                setNewEmailData((d) => ({ ...d, recoveryEmail: e.target.value }));
                if (errors.recoveryEmail) setErrors((prev) => ({ ...prev, recoveryEmail: '' }));
              }}
              onBlur={() => validateField('recoveryEmail', newEmailData.recoveryEmail)}
              className={cn(
                'w-full h-10 px-3 rounded-xl bg-input-background border text-sm text-foreground placeholder:text-muted-foreground/40 outline-none transition-colors focus:border-primary/50',
                errors.recoveryEmail ? 'border-destructive' : 'border-border',
              )}
            />
          </div>
          <div className="space-y-2.5">
            <label className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground/70">
              Phone Number
            </label>
            <input
              type="text"
              placeholder="+84 ••• ••• •••"
              value={newEmailData.phoneNumber}
              onChange={(e) => {
                setNewEmailData((d) => ({ ...d, phoneNumber: e.target.value }));
                if (errors.phoneNumber) setErrors((prev) => ({ ...prev, phoneNumber: '' }));
              }}
              onBlur={() => validateField('phoneNumber', newEmailData.phoneNumber)}
              className={cn(
                'w-full h-10 px-3 rounded-xl bg-input-background border text-sm text-foreground placeholder:text-muted-foreground/40 outline-none transition-colors focus:border-primary/50',
                errors.phoneNumber ? 'border-destructive' : 'border-border',
              )}
            />
          </div>
        </div>

        {/* Security Secrets */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-primary" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground/90">
              Security Settings
            </h3>
          </div>
          <div className="space-y-2.5">
            <label className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground/70">
              TOTP Secret Key
            </label>
            <div className="relative flex items-center">
              <Key className="absolute left-3 w-4 h-4 text-muted-foreground/50" />
              <input
                type="text"
                placeholder="Paste TOTP secret key..."
                value={newEmailData.totpSecretKey}
                onChange={(e) =>
                  setNewEmailData((d) => ({ ...d, totpSecretKey: e.target.value }))
                }
                className="w-full h-10 pl-10 pr-3 rounded-xl bg-input-background border border-border text-sm text-foreground placeholder:text-muted-foreground/40 outline-none transition-colors focus:border-primary/50"
              />
            </div>
          </div>

          <div className="space-y-2.5">
            <label className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground/70">
              Backup Codes
            </label>
            <div className="bg-input-background border border-border rounded-xl">
              {newEmailData.backupCodes.length > 0 && (
                <div className="flex flex-wrap gap-1.5 p-2 pb-0">
                  {newEmailData.backupCodes.map((code, idx) => {
                    const colors = [
                      'bg-blue-500/20 text-blue-400 border-blue-500/30',
                      'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
                      'bg-amber-500/20 text-amber-400 border-amber-500/30',
                      'bg-pink-500/20 text-pink-400 border-pink-500/30',
                      'bg-purple-500/20 text-purple-400 border-purple-500/30',
                      'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
                    ];
                    const colorClass = colors[idx % colors.length];
                    return (
                      <span
                        key={code}
                        className={cn(
                          'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border',
                          colorClass,
                        )}
                      >
                        {code}
                        <button
                          type="button"
                          onClick={() =>
                            setNewEmailData((d) => ({
                              ...d,
                              backupCodes: d.backupCodes.filter((c) => c !== code),
                            }))
                          }
                          className="hover:opacity-70 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
              <div className="relative flex items-center">
                <Hash className="absolute left-3 w-4 h-4 text-muted-foreground/50" />
                <input
                  type="text"
                  placeholder="Type code and press Enter..."
                  value={backupCodeSearch}
                  onChange={(e) => setBackupCodeSearch(e.target.value)}
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === 'Enter' && backupCodeSearch.trim()) {
                      const newVal = backupCodeSearch.trim();
                      if (!newEmailData.backupCodes.includes(newVal)) {
                        setNewEmailData((d) => ({
                          ...d,
                          backupCodes: [...d.backupCodes, newVal],
                        }));
                      }
                      setBackupCodeSearch('');
                    }
                  }}
                  className="w-full h-10 pl-10 pr-3 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 outline-none rounded-xl"
                />
              </div>
            </div>
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="outline" className="flex-1" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="solid"
          className="flex-1"
          disabled={!newEmailData.email || !newEmailData.password}
          onClick={handleAddEmail}
        >
          Save Account
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default AddEmailModal;