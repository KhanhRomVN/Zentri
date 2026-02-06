import { useState, useCallback, useEffect } from 'react';
import { Mail } from '../../../mock/mails';
import { MailSidebar } from './components/MailSidebar';
import { MailContent } from './components/MailContent';
import { gmailService } from '../../../services/GmailService';
import { RefreshCw, Key, AlertCircle, Loader2 } from 'lucide-react';
import { Account } from '../../../mock/accounts';

interface MailTabProps {
  account?: Account;
  repoPath?: string;
}

const MailTab = ({ account, repoPath }: MailTabProps) => {
  const [mails, setMails] = useState<Mail[]>([]);
  const [selectedMail, setSelectedMail] = useState<Mail | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cookieString, setCookieString] = useState(
    localStorage.getItem(`gmail_cookies_${account?.id}`) || '',
  );
  const [showCookieInput, setShowCookieInput] = useState(false);

  const fetchEmails = useCallback(
    async (manualCookies?: string) => {
      const activeCookies = manualCookies || cookieString;
      if (!account || account.provider !== 'gmail') return;
      if (!activeCookies) {
        setError('Please provide session cookies to fetch emails.');
        setShowCookieInput(true);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const fetchedMails = await gmailService.fetchInbox(activeCookies);
        setMails(fetchedMails);
        if (fetchedMails.length > 0) {
          setSelectedMail(fetchedMails[0]);
        }
        // Save cookies for this account
        localStorage.setItem(`gmail_cookies_${account.id}`, activeCookies);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch emails');
      } finally {
        setLoading(false);
      }
    },
    [account, cookieString],
  );

  useEffect(() => {
    const init = async () => {
      if (account?.provider === 'gmail') {
        // Try to fetch from Profile first if repoPath is available
        if (repoPath) {
          const profilePath = `${repoPath}/profiles/${account.id}`;
          try {
            // @ts-ignore
            const profileCookies = await window.electron.ipcRenderer.invoke(
              'email:get-profile-cookies',
              { profilePath },
            );
            if (profileCookies && profileCookies.length > 0) {
              setCookieString(profileCookies);
              fetchEmails(profileCookies);
              return;
            }
          } catch (e) {
            console.error('Failed to get cookies from profile:', e);
          }
        }

        // Fallback to local storage or manual
        if (cookieString) {
          fetchEmails();
        }
      } else {
        setMails([]);
      }
    };

    init();
  }, [account, repoPath]);

  const filteredMails = mails.filter(
    (mail) =>
      mail.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mail.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mail.snippet.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="flex h-full w-full flex-col">
      {/* Action Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/5">
        <div className="flex items-center gap-2">
          {account?.provider === 'gmail' && (
            <>
              <button
                onClick={() => fetchEmails()}
                disabled={loading}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-all text-xs font-medium disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5" />
                )}
                Refresh Inbox
              </button>
              <button
                onClick={() => setShowCookieInput(!showCookieInput)}
                className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-muted transition-all"
                title="Manage Session Cookies"
              >
                <Key className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        {error && !showCookieInput && (
          <div className="flex items-center gap-2 text-red-500 text-xs animate-in fade-in">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Cookie Input Section */}
      {showCookieInput && (
        <div className="p-4 border-b border-border bg-card/50 animate-in slide-in-from-top-2">
          <div className="max-w-2xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-muted-foreground flex items-center gap-2">
                <Key className="w-3 h-3" />
                SESSION COOKIES (GMAIL)
              </label>
              <button
                onClick={() => setShowCookieInput(false)}
                className="text-[10px] text-primary hover:underline"
              >
                Close
              </button>
            </div>
            <textarea
              value={cookieString}
              onChange={(e) => setCookieString(e.target.value)}
              placeholder="Paste your cookies here (vd: SID=...; HSID=...;)"
              className="w-full h-20 p-3 rounded-md bg-background border border-border text-[11px] font-mono focus:border-primary outline-none transition-all"
            />
            <p className="text-[10px] text-muted-foreground italic">
              Zentri uses these cookies to call the Gmail Atom Feed without opening a browser.
            </p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {mails.length === 0 && !loading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground gap-4">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <RefreshCw className="w-8 h-8 opacity-20" />
            </div>
            <div>
              <p className="text-sm font-medium">No emails found</p>
              <p className="text-xs opacity-60">
                Click refresh or provide session cookies to start fetching.
              </p>
            </div>
            {!showCookieInput && account?.provider === 'gmail' && (
              <button
                onClick={() => setShowCookieInput(true)}
                className="text-xs text-primary hover:underline font-bold"
              >
                Setup Cookies
              </button>
            )}
          </div>
        ) : (
          <>
            <MailSidebar
              mails={filteredMails}
              selectedMail={selectedMail}
              onSelectMail={setSelectedMail}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
            <MailContent selectedMail={selectedMail} />
          </>
        )}
      </div>
    </div>
  );
};

export default MailTab;
