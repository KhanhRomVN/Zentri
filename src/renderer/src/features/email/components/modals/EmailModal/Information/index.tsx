/**
 * ------------------------------------------------------------------
 * InfoTab
 * ------------------------------------------------------------------
 * Thin wrapper around AccountForm. Maps the Account domain shape
 * onto AccountFormValues and persists field changes according to the
 * original InfoTab behavior (password/recovery/phone/totp persist on
 * blur; backup codes, category and tags persist immediately).
 * ------------------------------------------------------------------
 */

import { FC, Dispatch, SetStateAction } from 'react';
import AccountForm, { AccountFormValues } from './AccountForm';
import { Account } from '../../../../types';

interface InfoTabProps {
  editedAccount: Account | null;
  setEditedAccount: Dispatch<SetStateAction<Account | null>>;
  onUpdateAccount: (updated: Account) => void;
  validateField: (name: string, value: string) => void;
  errors: Record<string, string>;
  backupCodeSearch: string;
  setBackupCodeSearch: (val: string) => void;
  recoveryEmailSuggestions?: string[];
}

const mapUpdate = <K extends keyof AccountFormValues>(
  account: Account,
  field: K,
  value: AccountFormValues[K],
): Account => {
  switch (field) {
    case 'email':
      return { ...account, email: value as string };
    case 'password':
      return { ...account, password: value as string };
    case 'recoveryEmail':
      return { ...account, recovery_email: value as string };
    case 'phoneNumber':
      return { ...account, phone_number: value as string };
    case 'totp':
      return { ...account, totp: value as string };
    case 'backupCodes':
      return { ...account, backup_codes: JSON.stringify(value as string[]) };
    case 'category':
      return { ...account, category: value as string };
    case 'tags':
      return { ...account, tags: value as string[] };
    default:
      return account;
  }
};

const InfoTab: FC<InfoTabProps> = ({
  editedAccount,
  setEditedAccount,
  onUpdateAccount,
  validateField,
  errors,
  backupCodeSearch,
  setBackupCodeSearch,
  recoveryEmailSuggestions,
}) => {
  const parsedBackupCodes: string[] = (() => {
    try {
      return editedAccount?.backup_codes ? JSON.parse(editedAccount.backup_codes) : [];
    } catch {
      return [];
    }
  })();

  const values: AccountFormValues = {
    email: editedAccount?.email || '',
    password: editedAccount?.password || '',
    recoveryEmail: editedAccount?.recovery_email || '',
    phoneNumber: editedAccount?.phone_number || '',
    totp: editedAccount?.totp || '',
    backupCodes: parsedBackupCodes,
    category: editedAccount?.category || '',
    tags: editedAccount?.tags || [],
  };

  const handleChange = <K extends keyof AccountFormValues>(
    field: K,
    value: AccountFormValues[K],
  ) => {
    if (!editedAccount) return;
    const updated = mapUpdate(editedAccount, field, value);
    setEditedAccount(updated);
    if (field === 'backupCodes' || field === 'category' || field === 'tags') {
      onUpdateAccount(updated);
    }
  };

  const handleBlur = (field: keyof AccountFormValues, value: string) => {
    validateField(field, value);
    if (!editedAccount) return;
    if (field === 'email') return;
    if (
      field === 'password' ||
      field === 'recoveryEmail' ||
      field === 'phoneNumber' ||
      field === 'totp'
    ) {
      const updated = mapUpdate(editedAccount, field, value as never);
      onUpdateAccount(updated);
    }
  };

  return (
    <AccountForm
      values={values}
      onChange={handleChange}
      onBlur={handleBlur}
      errors={errors}
      backupCodeSearch={backupCodeSearch}
      onBackupCodeSearchChange={setBackupCodeSearch}
      recoveryEmailSuggestions={recoveryEmailSuggestions}
    />
  );
};

export default InfoTab;