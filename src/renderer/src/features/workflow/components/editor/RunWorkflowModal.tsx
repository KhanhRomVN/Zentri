import { useState, useEffect } from 'react';
import { User, Users, ChevronRight } from 'lucide-react';
import Modal from '../../../../components/ui/Modal/Modal';
import ModalHeader from '../../../../components/ui/Modal/ModalHeader';
import ModalBody from '../../../../components/ui/Modal/ModalBody';
import ModalFooter from '../../../../components/ui/Modal/ModalFooter';
import type { Account } from '../../../email/types';

interface RunWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRun: (config: RunConfig) => void;
}

export type RunConfig =
  | { method: 'profile'; emailIds: string[] }
  | { method: 'guest'; count: number };

export const RunWorkflowModal = ({ isOpen, onClose, onRun }: RunWorkflowModalProps) => {
  const [method, setMethod] = useState<'profile' | 'guest' | null>(null);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [guestCount, setGuestCount] = useState(1);
  const [emails, setEmails] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);

  // Load emails when method is 'profile'
  useEffect(() => {
    if (method === 'profile' && isOpen) {
      loadEmails();
    }
  }, [method, isOpen]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setMethod(null);
      setSelectedEmails([]);
      setGuestCount(1);
    }
  }, [isOpen]);

  const loadEmails = async () => {
    setLoading(true);
    try {
      const result = await window.api.sqlite.query('SELECT * FROM emails ORDER BY created_at DESC');
      if (result.success && result.data) {
        setEmails(result.data as Account[]);
      }
    } catch (error) {
      console.error('[RunWorkflowModal] Failed to load emails:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRun = () => {
    if (method === 'profile') {
      if (selectedEmails.length === 0) {
        alert('Please select at least one email profile');
        return;
      }
      onRun({ method: 'profile', emailIds: selectedEmails });
    } else if (method === 'guest') {
      if (guestCount < 1 || guestCount > 100) {
        alert('Guest count must be between 1 and 100');
        return;
      }
      onRun({ method: 'guest', count: guestCount });
    }
    onClose();
  };

  const toggleEmail = (emailId: string) => {
    setSelectedEmails((prev) =>
      prev.includes(emailId) ? prev.filter((id) => id !== emailId) : [...prev, emailId],
    );
  };

  const handleBack = () => {
    setMethod(null);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      onBack={method ? handleBack : undefined}
      className="max-w-2xl"
      hideBackButton={!method}
    >
      <ModalHeader
        title="Run Workflow"
        description={
          method === 'profile'
            ? 'Select email profiles'
            : method === 'guest'
              ? 'Configure guest profiles'
              : 'Choose execution method'
        }
        onClose={onClose}
      />

      <ModalBody>
        {!method ? (
          /* Method Selection */
          <div className="space-y-3">
            <p className="text-sm text-text-secondary mb-4">
              Choose how you want to run this workflow:
            </p>
            <button
              onClick={() => setMethod('profile')}
              className="w-full flex items-center justify-between rounded-lg border border-border bg-card-background p-4 text-left transition-all hover:border-primary hover:bg-sidebar-item-hover"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="font-semibold text-text-primary">Profile Email</div>
                  <div className="text-sm text-text-secondary">Run with saved email profiles</div>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-text-secondary" />
            </button>

            <button
              onClick={() => setMethod('guest')}
              className="w-full flex items-center justify-between rounded-lg border border-border bg-card-background p-4 text-left transition-all hover:border-primary hover:bg-sidebar-item-hover"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                  <Users className="h-5 w-5 text-success" />
                </div>
                <div>
                  <div className="font-semibold text-text-primary">Guest Mode</div>
                  <div className="text-sm text-text-secondary">Run with temporary profiles</div>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-text-secondary" />
            </button>
          </div>
        ) : method === 'profile' ? (
          /* Profile Email Selection */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-text-secondary">{selectedEmails.length} selected</div>
            </div>

            <div className="max-h-[400px] space-y-2 overflow-y-auto rounded-lg border border-border p-2">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-sm text-text-secondary">Loading emails...</div>
                </div>
              ) : emails.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-sm text-text-secondary">No email profiles found</div>
                </div>
              ) : (
                emails.map((email) => (
                  <label
                    key={email.id}
                    className="flex items-center gap-3 rounded-lg border border-border bg-card-background p-3 transition-all hover:bg-sidebar-item-hover cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedEmails.includes(email.id)}
                      onChange={() => toggleEmail(email.id)}
                      className="h-4 w-4 rounded border-border text-primary focus:ring-2 focus:ring-primary"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-text-primary">{email.email}</div>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>
        ) : (
          /* Guest Mode Configuration */
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Number of Guest Profiles
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={guestCount}
                onChange={(e) => setGuestCount(parseInt(e.target.value) || 1)}
                className="w-full rounded-lg border border-border bg-card-background px-3 py-2 text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <p className="mt-2 text-xs text-text-secondary">
                {guestCount} browser window(s) will be opened simultaneously
              </p>
            </div>

            <div className="rounded-lg border border-border bg-sidebar-item-hover/30 p-4">
              <div className="text-sm font-medium text-text-primary mb-2">Note:</div>
              <ul className="space-y-1 text-xs text-text-secondary">
                <li>• Guest profiles are temporary and will be deleted after use</li>
                <li>• Each profile runs independently in a separate browser window</li>
                <li>• Higher counts may impact system performance</li>
              </ul>
            </div>
          </div>
        )}
      </ModalBody>

      {method && (
        <ModalFooter>
          <button
            onClick={onClose}
            className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-text-secondary transition-colors hover:bg-sidebar-item-hover hover:text-text-primary"
          >
            Cancel
          </button>
          <button
            onClick={handleRun}
            disabled={method === 'profile' && selectedEmails.length === 0}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Run Workflow
          </button>
        </ModalFooter>
      )}
    </Modal>
  );
};
