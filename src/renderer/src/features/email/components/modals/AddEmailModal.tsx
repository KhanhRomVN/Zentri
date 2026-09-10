/**
 * ------------------------------------------------------------------
 * AddEmailModal
 * ------------------------------------------------------------------
 * Modal for adding a new email account to the repository.
 * Uses the shared AccountForm UI from EmailModal/Information.
 * ------------------------------------------------------------------
 */

import { FC } from 'react';
import AccountForm, { AccountFormValues } from './EmailModal/Information/AccountForm';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../../../../components/ui/Modal';
import { Button } from '../../../../components/ui/Button';

export interface NewEmailData {
  email: string;
  password: string;
  recoveryEmail: string;
  phoneNumber: string;
  totpSecretKey: string;
  backupCodes: string[];
  category: string;
  tags: string[];
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
  recoveryEmailSuggestions?: string[];
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
  recoveryEmailSuggestions,
}) => {
  const values: AccountFormValues = {
    email: newEmailData.email,
    password: newEmailData.password,
    recoveryEmail: newEmailData.recoveryEmail,
    phoneNumber: newEmailData.phoneNumber,
    totp: newEmailData.totpSecretKey,
    backupCodes: newEmailData.backupCodes,
    category: newEmailData.category,
    tags: newEmailData.tags,
  };

  const handleChange = <K extends keyof AccountFormValues>(
    field: K,
    value: AccountFormValues[K],
  ) => {
    setNewEmailData((prev) => {
      const next = { ...prev };
      switch (field) {
        case 'email':
          next.email = value as string;
          break;
        case 'password':
          next.password = value as string;
          break;
        case 'recoveryEmail':
          next.recoveryEmail = value as string;
          break;
        case 'phoneNumber':
          next.phoneNumber = value as string;
          break;
        case 'totp':
          next.totpSecretKey = value as string;
          break;
        case 'backupCodes':
          next.backupCodes = value as string[];
          break;
        case 'category':
          next.category = value as string;
          break;
        case 'tags':
          next.tags = value as string[];
          break;
      }
      if (errors[field]) {
        setErrors((prevErrors) => ({ ...prevErrors, [field]: '' }));
      }
      return next;
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl" hideCloseButton>
      <ModalHeader
        title="Add Account"
        description="Add a new email account to your repository"
        onClose={onClose}
      />
      <ModalBody className="p-0">
        <AccountForm
          values={values}
          onChange={handleChange}
          onBlur={(field, value) => validateField(field, value)}
          errors={errors}
          backupCodeSearch={backupCodeSearch}
          onBackupCodeSearchChange={setBackupCodeSearch}
          recoveryEmailSuggestions={recoveryEmailSuggestions}
        />
      </ModalBody>
      <ModalFooter>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="solid"
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