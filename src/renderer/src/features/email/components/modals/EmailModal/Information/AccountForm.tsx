/**
 * ------------------------------------------------------------------
 * AccountForm
 * ------------------------------------------------------------------
 * Presentational form for editing/creating an email account.
 * Exposes the same 4 sections used by InfoTab (Identity, Recovery
 * access, Two-factor authentication, Classification) but is fully
 * controlled — it knows nothing about Account or NewEmailData.
 * InfoTab and AddEmailModal map their own data shapes onto this
 * component.
 * ------------------------------------------------------------------
 */

import { FC, useState, useEffect, useMemo, ChangeEvent, KeyboardEvent } from 'react';
import {
  Mail,
  Copy,
  Eye,
  EyeOff,
  LifeBuoy,
  Tags,
  ChevronDown,
  X,
  User,
  Briefcase,
  CreditCard,
  MessageCircle,
  Gamepad2,
  ShoppingCart,
  GraduationCap,
  Clapperboard,
  type LucideIcon,
} from 'lucide-react';
import Input from '../../../../../../components/ui/Input/Input';
import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
} from '../../../../../../components/ui/Dropdown';
import QRCodeTOTPScannerModal from '../../../modals/QRCodeTOTPScannerModal';
import TwoFactorAuthFields from '../TwoFactorAuthFields';
import { cn } from '../../../../../../shared/lib/utils';
import { getCountryFlagComponent } from '../../../../../../utils/countryFlags';
import { getIsoFromDialCode, parsePhoneParts } from '../../../../../../utils/phoneNumber';
import { generateTOTP, getTOTPTimeRemaining } from '../../../../utils/totp';

export interface AccountFormValues {
  email: string;
  password: string;
  recoveryEmail: string;
  phoneNumber: string;
  totp: string;
  backupCodes: string[];
  category: string;
  tags: string[];
}

export interface AccountFormProps {
  values: AccountFormValues;
  onChange: <K extends keyof AccountFormValues>(field: K, value: AccountFormValues[K]) => void;
  onBlur?: (field: keyof AccountFormValues, value: string) => void;
  errors?: Record<string, string>;
  backupCodeSearch: string;
  onBackupCodeSearchChange: (val: string) => void;
  recoveryEmailSuggestions?: string[];
}

interface CategoryOption {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
  color: string;
}

const CATEGORIES: CategoryOption[] = [
  { id: 'personal', icon: User, title: 'Personal', description: 'Personal emails and communication', color: 'bg-blue-500/10 text-blue-400' },
  { id: 'work', icon: Briefcase, title: 'Work', description: 'Professional and business accounts', color: 'bg-purple-500/10 text-purple-400' },
  { id: 'finance', icon: CreditCard, title: 'Finance', description: 'Banking, payments and crypto', color: 'bg-emerald-500/10 text-emerald-400' },
  { id: 'social', icon: MessageCircle, title: 'Social', description: 'Social media and messaging', color: 'bg-pink-500/10 text-pink-400' },
  { id: 'gaming', icon: Gamepad2, title: 'Gaming', description: 'Game platforms and communities', color: 'bg-amber-500/10 text-amber-400' },
  { id: 'shopping', icon: ShoppingCart, title: 'Shopping', description: 'Retail and e-commerce accounts', color: 'bg-orange-500/10 text-orange-400' },
  { id: 'education', icon: GraduationCap, title: 'Education', description: 'Schools and learning platforms', color: 'bg-cyan-500/10 text-cyan-400' },
  { id: 'entertainment', icon: Clapperboard, title: 'Entertainment', description: 'Streaming and media services', color: 'bg-red-500/10 text-red-400' },
];

const TAG_SUGGESTIONS = ['primary', 'backup', 'verified', 'temp', 'spam', 'important'];

const LATIN_ALLOWED = /^[a-zA-Z0-9@.\-_!#$%&*+/=?^`{|}~]*$/;
const PHONE_ALLOWED = /^[0-9+\s\-()]*$/;

const sanitizeLatin = (val: string) =>
  val.replace(/[^a-zA-Z0-9@.\-_!#$%&*+/=?^`{|}~]/g, '');
const sanitizePhone = (val: string) => val.replace(/[^0-9+\s\-()]/g, '');

const AccountForm: FC<AccountFormProps> = ({
  values,
  onChange,
  onBlur,
  errors = {},
  backupCodeSearch,
  onBackupCodeSearchChange,
  recoveryEmailSuggestions,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showTotp, setShowTotp] = useState(false);
  const [liveCode, setLiveCode] = useState('000000');
  const [totpRemaining, setTotpRemaining] = useState(30);
  const [tagSearch, setTagSearch] = useState('');
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false);
  const [previewBackupCodes, setPreviewBackupCodes] = useState<string[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [recoveryDropdownOpen, setRecoveryDropdownOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);

  const passwordStrength = useMemo(() => {
    const pwd = values.password || '';
    if (!pwd) return { level: 0, label: '' };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
    if (/\d/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    if (score <= 2) return { level: 1, label: 'weak' };
    if (score === 3) return { level: 2, label: 'medium' };
    return { level: 3, label: 'strong' };
  }, [values.password]);

  const strengthBarClass = (barIndex: number) => {
    if (passwordStrength.level === 0) return 'bg-border';
    if (barIndex > passwordStrength.level) return 'bg-border';
    if (passwordStrength.level === 1) return 'bg-error';
    if (passwordStrength.level === 2) return 'bg-warn';
    return 'bg-success';
  };

  const backupCodeError = useMemo(() => {
    const val = backupCodeSearch.trim();
    if (!val) return '';
    if (/[,\s]/.test(val)) return '';
    if (val.length < 6) return 'Code too short';
    if (values.backupCodes.includes(val)) return 'Code already exists';
    return '';
  }, [backupCodeSearch, values.backupCodes]);

  const phone = parsePhoneParts(values.phoneNumber || '');
  const iso = getIsoFromDialCode(phone.dialCode);
  const FlagIcon = iso ? getCountryFlagComponent(iso) : null;

  const selectedCategory = CATEGORIES.find((c) => c.title === values.category) || null;
  const filteredTagSuggestions = TAG_SUGGESTIONS.filter(
    (t) =>
      t.toLowerCase().includes(tagSearch.toLowerCase()) &&
      !values.tags.includes(t) &&
      t !== tagSearch.trim(),
  );

  const hasTotp = !!values.totp?.trim();
  const totpValid = hasTotp && liveCode !== '000000';

  const localErrors = useMemo(() => {
    const out: Record<string, string> = {};
    const checkLatin = (val: string, field: string) => {
      if (val && !LATIN_ALLOWED.test(val)) out[field] = 'Only Latin characters allowed';
    };
    checkLatin(values.email, 'email');
    checkLatin(values.password, 'password');
    checkLatin(values.recoveryEmail, 'recoveryEmail');
    checkLatin(values.totp, 'totp');
    if (values.phoneNumber && !PHONE_ALLOWED.test(values.phoneNumber)) {
      out.phoneNumber = 'Only numbers allowed';
    }
    if (values.backupCodes.some((code) => !LATIN_ALLOWED.test(code))) {
      out.backupCodes = 'Only Latin characters allowed';
    }
    return out;
  }, [values]);

  const displayErrors = { ...localErrors, ...errors };

  useEffect(() => {
    if (!values.totp) {
      setLiveCode('000000');
      return;
    }
    const update = () => {
      setLiveCode(generateTOTP(values.totp));
      setTotpRemaining(getTOTPTimeRemaining());
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [values.totp]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
  };

  const handleCopyBackupCode = (code: string) => {
    handleCopy(code);
    setCopiedCode(code);
    window.setTimeout(() => {
      setCopiedCode((prev) => (prev === code ? null : prev));
    }, 1500);
  };

  const handleBackupCodeInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const sanitized = sanitizeLatin(e.target.value);
    onBackupCodeSearchChange(sanitized);
    // Auto-derive preview badges live from whatever was just typed/pasted —
    // no separate "convert" step. Accepts comma- or whitespace-separated
    // codes (e.g. pasted from a password manager export).
    const parts = sanitized
      .split(/[,\s]+/)
      .map((part) => part.trim())
      .filter((part) => part.length >= 6);
    setPreviewBackupCodes(Array.from(new Set(parts)));
  };

  const handleRemovePreviewCode = (code: string) => {
    setPreviewBackupCodes((prev) => prev.filter((c) => c !== code));
  };

  const handleClearPreviewCodes = () => {
    setPreviewBackupCodes([]);
    onBackupCodeSearchChange('');
  };

  const handleAddPreviewCodes = () => {
    const codesToAdd = previewBackupCodes.filter((code) => !values.backupCodes.includes(code));
    if (codesToAdd.length === 0) return;
    onChange('backupCodes', [...values.backupCodes, ...codesToAdd]);
    setPreviewBackupCodes([]);
    onBackupCodeSearchChange('');
  };

  const handleRemoveBackupCode = (code: string) => {
    onChange('backupCodes', values.backupCodes.filter((c: string) => c !== code));
  };

  const handleSelectCategory = (cat: CategoryOption) => {
    onChange('category', cat.title);
  };

  const handleAddTag = (tag?: string) => {
    const val = (tag || tagSearch).trim();
    if (!val) return;
    if (values.tags.includes(val)) return;
    onChange('tags', [...values.tags, val]);
    setTagSearch('');
    setTagDropdownOpen(false);
  };

  const handleRemoveTag = (tag: string) => {
    onChange('tags', values.tags.filter((t: string) => t !== tag));
  };

  return (
    <div className="w-full p-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="space-y-8">
        {/* Identity */}
        <section className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Mail className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-foreground">Identity</h3>
              <p className="text-sm text-text-secondary">The core credentials used to sign in</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Input
                label="Email"
                value={values.email}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  onChange('email', sanitizeLatin(e.target.value))
                }
                onBlur={(e) => onBlur?.('email', e.target.value)}
                placeholder="identity@zentri.node"
                error={displayErrors.email}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => handleCopy(values.email)}
                    className="flex items-center hover:opacity-70 transition-opacity"
                    aria-label="Copy email"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                }
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-text-primary">Password</label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3].map((i) => (
                    <span key={i} className={cn('w-6 h-1 rounded-sm', strengthBarClass(i))} />
                  ))}
                </div>
              </div>
              <Input
                type={showPassword ? 'text' : 'password'}
                value={values.password}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  onChange('password', sanitizeLatin(e.target.value))
                }
                onBlur={(e) => onBlur?.('password', e.target.value)}
                placeholder="••••••••••••"
                error={displayErrors.password}
                inputClassName="font-mono tracking-widest pr-16"
                rightIcon={
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="hover:opacity-70 transition-opacity"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopy(values.password)}
                      className="hover:opacity-70 transition-opacity"
                      aria-label="Copy password"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                }
              />
            </div>
          </div>
        </section>

        {/* Recovery access */}
        <section className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-info/10 text-info flex items-center justify-center shrink-0">
              <LifeBuoy className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-foreground">Recovery access</h3>
              <p className="text-sm text-text-secondary">
                Where account-reset links and codes are sent
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text-primary">Recovery Email</label>
              <Dropdown open={recoveryDropdownOpen} onOpenChange={setRecoveryDropdownOpen} closeOnSelect className="w-full">
                <DropdownTrigger asChild>
                  <input
                    type="text"
                    value={values.recoveryEmail}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      onChange('recoveryEmail', sanitizeLatin(e.target.value))
                    }
                    onBlur={(e) => onBlur?.('recoveryEmail', e.target.value)}
                    onFocus={() => setRecoveryDropdownOpen(true)}
                    placeholder="backup@zentri.node"
                    className="w-full h-10 px-3 rounded-lg bg-input-background border border-input-border-default text-sm text-text-primary outline-none transition-colors focus:border-primary/50 placeholder:text-text-secondary/60"
                  />
                </DropdownTrigger>
                <DropdownContent className="min-w-full">
                  {(recoveryEmailSuggestions || [])
                    .filter((email) =>
                      email.toLowerCase().includes(values.recoveryEmail.toLowerCase()),
                    )
                    .map((email) => (
                      <DropdownItem key={email} onClick={() => onChange('recoveryEmail', email)}>
                        <span className="text-xs text-text-primary">{email}</span>
                      </DropdownItem>
                    ))}
                </DropdownContent>
              </Dropdown>
              {displayErrors.recoveryEmail && (
                <span className="text-xs text-error">{displayErrors.recoveryEmail}</span>
              )}
            </div>

            <div className="space-y-1.5">
              <Input
                label="Phone Number"
                value={phone.national}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  const val = sanitizePhone(e.target.value);
                  onChange(
                    'phoneNumber',
                    phone.dialCode ? `+${phone.dialCode} ${val}`.trim() : val,
                  );
                }}
                onBlur={(e) => {
                  const val = sanitizePhone(e.target.value);
                  onBlur?.('phoneNumber', val);
                }}
                placeholder="X XXXXX XXXXX"
                error={displayErrors.phoneNumber}
                leftIcon={
                  phone.dialCode ? (
                    <span className="flex items-center gap-1.5">
                      {FlagIcon && <FlagIcon className="w-4 h-4 rounded-[2px]" />}
                      <span className="text-sm font-medium">+{phone.dialCode}</span>
                    </span>
                  ) : undefined
                }
                inputClassName={phone.dialCode ? 'pl-[76px]' : undefined}
              />
            </div>
          </div>
        </section>

        {/* Two-factor authentication */}
        <TwoFactorAuthFields
          totpValue={values.totp}
          onTotpChange={(e) => onChange('totp', sanitizeLatin(e.target.value))}
          onTotpBlur={(e) => onBlur?.('totp', e.target.value)}
          totpError={displayErrors.totp}
          showTotp={showTotp}
          onToggleShowTotp={() => setShowTotp((prev) => !prev)}
          hasTotp={hasTotp}
          totpValid={totpValid}
          liveCode={liveCode}
          totpRemaining={totpRemaining}
          onCopyLiveCode={() => handleCopy(liveCode)}
          onScanQr={() => setQrModalOpen(true)}
          backupCodes={values.backupCodes}
          onCopyBackupCode={handleCopyBackupCode}
          onRemoveBackupCode={handleRemoveBackupCode}
          copiedCode={copiedCode}
          backupCodeInput={backupCodeSearch}
          onBackupCodeInputChange={handleBackupCodeInputChange}
          backupCodeError={backupCodeError}
          backupCodeLabelError={displayErrors.backupCodes}
          previewBackupCodes={previewBackupCodes}
          onRemovePreviewCode={handleRemovePreviewCode}
          onClearPreviewCodes={handleClearPreviewCodes}
          onAddPreviewCodes={handleAddPreviewCodes}
        />

        {/* Classification */}
        <section className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-warn/10 text-warn flex items-center justify-center shrink-0">
              <Tags className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-foreground">Classification</h3>
              <p className="text-sm text-text-secondary">
                Optional — helps group and filter accounts across Zentri
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 items-start">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-text-primary">Category</label>
              <Dropdown searchable closeOnSelect>
                <DropdownTrigger asChild>
                  <button
                    type="button"
                    className="w-full max-w-xs h-10 px-3 rounded-lg bg-input-background border border-border/50 text-sm flex items-center gap-2 text-text-primary outline-none transition-colors focus:border-primary/50"
                  >
                    {selectedCategory ? (
                      <>
                        <span className={cn('w-6 h-6 rounded flex items-center justify-center', selectedCategory.color)}>
                          <selectedCategory.icon className="w-4 h-4" />
                        </span>
                        <span className="text-sm font-medium">{selectedCategory.title}</span>
                      </>
                    ) : (
                      <span className="text-text-tertiary">Select category...</span>
                    )}
                    <ChevronDown className="w-4 h-4 ml-auto text-text-tertiary" />
                  </button>
                </DropdownTrigger>
                <DropdownContent className="max-h-[300px] overflow-y-auto">
                  {CATEGORIES.map((cat) => (
                    <DropdownItem key={cat.id} onClick={() => handleSelectCategory(cat)}>
                      <div className="flex items-center gap-2.5 px-2 py-1.5">
                        <span className={cn('w-7 h-7 rounded flex items-center justify-center shrink-0', cat.color)}>
                          <cat.icon className="w-4 h-4" />
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="block text-xs text-text-primary font-medium">
                            {cat.title}
                          </span>
                          <span className="block text-[10px] text-text-secondary truncate">
                            {cat.description}
                          </span>
                        </span>
                        {selectedCategory?.id === cat.id && (
                          <span className="text-primary text-xs">✓</span>
                        )}
                      </div>
                    </DropdownItem>
                  ))}
                </DropdownContent>
              </Dropdown>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-text-primary">Tag</label>

              {values.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pb-1">
                  {values.tags.map((tag) => (
                    <span
                      key={tag}
                      className="group inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border bg-primary/10 text-primary border-primary/30"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-error"
                        aria-label={`Remove tag ${tag}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <Dropdown open={tagDropdownOpen} onOpenChange={setTagDropdownOpen} closeOnSelect>
                <DropdownTrigger asChild>
                  <input
                    type="text"
                    value={tagSearch}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                      setTagSearch(e.target.value);
                      setTagDropdownOpen(true);
                    }}
                    onFocus={() => setTagDropdownOpen(true)}
                    onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    placeholder="Add tag and press Enter..."
                    className="w-full max-w-xs h-10 px-3 rounded-lg bg-input-background border border-border/50 text-sm text-text-primary outline-none transition-colors focus:border-primary/50 placeholder:text-text-tertiary"
                  />
                </DropdownTrigger>
                <DropdownContent className="min-w-full">
                  {filteredTagSuggestions.length > 0
                    ? filteredTagSuggestions.map((tag) => (
                        <DropdownItem key={tag} onClick={() => handleAddTag(tag)}>
                          <span className="text-xs text-text-primary">{tag}</span>
                        </DropdownItem>
                      ))
                    : tagSearch.trim() && (
                        <DropdownItem onClick={() => handleAddTag(tagSearch)}>
                          <span className="text-xs text-text-secondary">
                            Add "{tagSearch.trim()}"
                          </span>
                        </DropdownItem>
                      )}
                </DropdownContent>
              </Dropdown>
            </div>
          </div>
        </section>
        <div className="h-10" />
      </div>
      <QRCodeTOTPScannerModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        onScanSuccess={(secret) => {
          onChange('totp', secret);
          onBlur?.('totp', secret);
        }}
      />
    </div>
  );
};

export default AccountForm;