import { useState, useMemo, useEffect } from 'react';
import RegSidebar from './components/RegSidebar';
import SessionGrid from './components/SessionGrid';
import AccountTable from './components/AccountTable';
import FingerprintDrawer from './components/FingerprintDrawer';
import AccountDrawer from './components/AccountDrawer';
import { RegSession, RegAccount, Website, RegData, Agent } from './types';
import { HARDCODED_PLATFORMS } from './constants';
import { Loader2, AlertCircle } from 'lucide-react';

const RegPage = () => {
  const [platforms, setPlatforms] = useState<Website[]>(HARDCODED_PLATFORMS);
  const [allData, setAllData] = useState<RegData>({
    websites: [],
    sessions: [],
    accounts: [],
    agents: [],
  });

  const [selectedWebsiteId, setSelectedWebsiteId] = useState<string | null>(
    platforms[0]?.id || null,
  );
  const [selectedSession, setSelectedSession] = useState<RegSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Agent Drawer State
  // Agent Editor State
  const [isAgentEditorOpen, setIsAgentEditorOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Omit<Agent, 'id'>>({
    name: '',
    userAgent: '',
    os: 'Windows',
    timezone: 'UTC+7',
    resolution: '1920x1080',
    webrtc: 'Disabled',
    location: 'Disabled',
    language: 'vi-VN',
    fingerprint: {
      canvas: 'Safe',
      audio: 'Safe',
      clientRect: 'Safe',
      webglImage: 'Safe',
      webglMetadata: 'Safe',
      webglVector: 'Safe',
      webglVendor: 'Depth',
      webglReRender: 'Enabled',
    },
  });

  // Account Drawer State
  const [isAccountDrawerOpen, setIsAccountDrawerOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<RegAccount | null>(null);

  const gitlabFolder = useMemo(() => {
    return localStorage.getItem('gitlab_repo_folder');
  }, []);

  const dataPath = 'regs.json';
  const agentsPath = 'reg/agents.json';

  const extractData = (res: any) => {
    if (res && typeof res === 'object' && 'success' in res && 'data' in res) {
      return res.data;
    }
    return res;
  };

  const loadData = async () => {
    if (!gitlabFolder) {
      setError('Please select a Git Repository Folder in Settings');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Load Main Data (Sessions & Accounts)
      // @ts-ignore
      const rawData = await window.electron.ipcRenderer.invoke(
        'git:read-data',
        gitlabFolder,
        dataPath,
      );
      let data = extractData(rawData);

      if (!data) {
        // Initialize if missing
        data = { websites: [], sessions: [], accounts: [] };
        // @ts-ignore
        await window.electron.ipcRenderer.invoke('git:write-data', {
          folderPath: gitlabFolder,
          filename: dataPath,
          data: data,
        });
      }

      // Load Agents
      // @ts-ignore
      const rawAgentsData = await window.electron.ipcRenderer.invoke(
        'git:read-data',
        gitlabFolder,
        agentsPath,
      );
      let agentsData = extractData(rawAgentsData);

      if (!agentsData) {
        agentsData = [];
      }

      setAllData({
        websites: [],
        sessions: Array.isArray(data.sessions) ? data.sessions : [],
        accounts: Array.isArray(data.accounts) ? data.accounts : [],
        agents: Array.isArray(agentsData) ? agentsData : [],
      });

      // Update platform stats after loading all data
      updateAllPlatformStats(Array.isArray(data.sessions) ? data.sessions : []);
    } catch (err: any) {
      setError(`Failed to load registration data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const saveData = async (updatedSessions: RegSession[], updatedAccounts: RegAccount[]) => {
    if (!gitlabFolder) return;

    try {
      const data = {
        sessions: updatedSessions,
        accounts: updatedAccounts,
      };

      // @ts-ignore
      await window.electron.ipcRenderer.invoke('git:write-data', {
        folderPath: gitlabFolder,
        filename: dataPath,
        data: data,
      });

      window.dispatchEvent(
        new CustomEvent('zentri:sync-status-changed', { detail: { isDirty: true } }),
      );

      updateAllPlatformStats(updatedSessions);
    } catch (err: any) {
      setError(`Failed to save data: ${err.message}`);
    }
  };

  const saveAgents = async (updatedAgents: Agent[]) => {
    if (!gitlabFolder) return;
    try {
      // @ts-ignore
      await window.electron.ipcRenderer.invoke('git:write-data', {
        folderPath: gitlabFolder,
        filename: agentsPath,
        data: updatedAgents,
      });
      setAllData((prev) => ({ ...prev, agents: updatedAgents }));
    } catch (err) {
      console.error('Failed to save agents', err);
    }
  };

  const updateAllPlatformStats = (sessions: RegSession[]) => {
    setPlatforms((prev) =>
      prev.map((p) => {
        const platformSessions = sessions.filter((s) => s.websiteId === p.id);
        const totalSessions = platformSessions.length;
        const avgSuccess =
          totalSessions > 0
            ? Math.round(
                platformSessions.reduce((acc, s) => acc + s.successRate, 0) / totalSessions,
              )
            : 0;
        return { ...p, totalSessions, successRate: avgSuccess };
      }),
    );
  };

  useEffect(() => {
    loadData();
  }, [gitlabFolder]);

  const selectedWebsite = useMemo(() => {
    return platforms.find((w) => w.id === selectedWebsiteId) || null;
  }, [selectedWebsiteId, platforms]);

  const filteredSessions = useMemo(() => {
    if (!selectedWebsiteId) return [];
    return allData.sessions.filter((s) => s.websiteId === selectedWebsiteId);
  }, [selectedWebsiteId, allData.sessions]);

  const filteredAccounts = useMemo(() => {
    if (!selectedSession) return [];
    return allData.accounts.filter((acc) => acc.sessionId === selectedSession.id);
  }, [selectedSession, allData.accounts]);

  const handleSelectWebsite = (id: string) => {
    setSelectedWebsiteId(id);
    setSelectedSession(null);
  };

  const handleSelectSession = (session: RegSession) => {
    setSelectedSession(session);
  };

  const handleBackToSessions = () => {
    setSelectedSession(null);
  };

  const handleCreateSession = async (name: string) => {
    if (!selectedWebsiteId) return;

    const newSession: RegSession = {
      id: Math.random().toString(36).substr(2, 9),
      websiteId: selectedWebsiteId,
      name: name,
      accountCount: 0,
      successRate: 0,
      failureRate: 0,
      createdAt: new Date().toISOString(),
    };

    const updatedSessions = [...allData.sessions, newSession];
    setAllData((prev) => ({ ...prev, sessions: updatedSessions }));

    await saveData(updatedSessions, allData.accounts);
  };

  // Agent handlers
  const handleCreateAgent = (agentData: Omit<Agent, 'id'>) => {
    const newAgent: Agent = {
      ...agentData,
      id: `agent-${Math.random().toString(36).substr(2, 9)}`,
    };
    saveAgents([...allData.agents, newAgent]);
  };

  const handleOpenCreateAgent = () => {
    setEditingAgent({
      name: '',
      userAgent: '',
      os: 'Windows',
      timezone: 'UTC+7',
      resolution: '1920x1080',
      webrtc: 'Disabled',
      location: 'Disabled',
      language: 'vi-VN',
      fingerprint: {
        canvas: 'Safe',
        audio: 'Safe',
        clientRect: 'Safe',
        webglImage: 'Safe',
        webglMetadata: 'Safe',
        webglVector: 'Safe',
        webglVendor: 'Deepmind',
        webglReRender: 'Enabled',
      },
    });
    setIsAgentEditorOpen(true);
  };

  const handleSaveAgent = () => {
    if (!editingAgent.name) return; // Validate name
    handleCreateAgent(editingAgent);
    setIsAgentEditorOpen(false);
  };

  const handleQuickCreateAgent = (
    accountId: string,
    agentInfo: { name: string; userAgent: string; os: string },
  ) => {
    const newAgent: Agent = {
      id: `agent-${Math.random().toString(36).substr(2, 9)}`,
      name: agentInfo.name,
      userAgent: agentInfo.userAgent,
      os: agentInfo.os as any,
      timezone: 'UTC+7',
      resolution: '1920x1080',
      webrtc: 'Disabled',
      location: 'Disabled',
      language: 'vi-VN',
      fingerprint: {
        canvas: 'Safe',
        audio: 'Safe',
        clientRect: 'Safe',
        webglImage: 'Safe',
        webglMetadata: 'Safe',
        webglVector: 'Safe',
        webglVendor: 'Deepmind',
        webglReRender: 'Enabled',
      },
    };

    // Save new agent
    const updatedAgents = [...allData.agents, newAgent];
    saveAgents(updatedAgents);

    // Update account with new agent
    const updatedAccounts = allData.accounts.map((acc) =>
      acc.id === accountId ? { ...acc, agentId: newAgent.id } : acc,
    );
    setAllData((prev) => ({ ...prev, accounts: updatedAccounts, agents: updatedAgents }));
    saveData(allData.sessions, updatedAccounts);
  };

  const handleUpdateAccountAgent = async (accountId: string, agentId: string) => {
    const updatedAccounts = allData.accounts.map((acc) =>
      acc.id === accountId ? { ...acc, agentId } : acc,
    );

    setAllData((prev) => ({ ...prev, accounts: updatedAccounts }));
    await saveData(allData.sessions, updatedAccounts);
  };

  const handleCreateAccountTrigger = () => {
    setEditingAccount(null);
    setIsAccountDrawerOpen(true);
  };

  const handleEditAccountTrigger = (account: RegAccount) => {
    setEditingAccount(account);
    setIsAccountDrawerOpen(true);
  };

  const handleSaveAccount = async (accountData: Partial<RegAccount>) => {
    if (!selectedSession) return;

    let updatedAccounts = [...allData.accounts];
    let updatedSessions = [...allData.sessions];

    if (editingAccount) {
      // Update existing
      updatedAccounts = updatedAccounts.map((acc) =>
        acc.id === editingAccount.id ? { ...acc, ...accountData } : acc,
      );
    } else {
      // Create new
      const newAccount: RegAccount = {
        id: `acc-${Math.random().toString(36).substr(2, 9)}`,
        sessionId: selectedSession.id,
        username: accountData.username || accountData.email || '',
        email: accountData.email,
        password: accountData.password,
        proxy: accountData.proxy,
        agentId: accountData.agentId,
        status: 'processing',
        metadata: {},
        ...accountData, // spread other fields
      };
      updatedAccounts.push(newAccount);

      // Update session account count
      updatedSessions = updatedSessions.map((s) =>
        s.id === selectedSession.id ? { ...s, accountCount: s.accountCount + 1 } : s,
      );
      setAllData((prev) => ({ ...prev, sessions: updatedSessions }));
    }

    setAllData((prev) => ({ ...prev, accounts: updatedAccounts }));
    await saveData(updatedSessions, updatedAccounts);
  };

  if (loading && !allData.sessions.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full gap-4 text-muted-foreground bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-sm font-medium">Loading Registration Data...</p>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full overflow-hidden bg-background">
      <RegSidebar
        websites={platforms}
        selectedWebsiteId={selectedWebsiteId}
        onSelectWebsite={handleSelectWebsite}
      />

      <div className="flex-1 flex flex-col h-full overflow-hidden bg-muted/5">
        {error && (
          <div className="px-6 py-2 bg-red-500/10 border-b border-red-500/20 flex items-center gap-2 text-xs text-red-500">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        {selectedSession && selectedWebsite ? (
          <AccountTable
            session={selectedSession}
            accounts={filteredAccounts}
            config={selectedWebsite.config}
            agents={allData.agents}
            onBack={handleBackToSessions}
            onUpdateAccountAgent={handleUpdateAccountAgent}
            onCreateAccount={handleCreateAccountTrigger}
            onCreateAgent={handleOpenCreateAgent}
            onQuickCreateAgent={handleQuickCreateAgent}
            onEditAccount={handleEditAccountTrigger}
          />
        ) : (
          <SessionGrid
            sessions={filteredSessions}
            onSelectSession={handleSelectSession}
            onCreateSession={handleCreateSession}
          />
        )}
      </div>

      <FingerprintDrawer
        isOpen={isAgentEditorOpen}
        onClose={() => setIsAgentEditorOpen(false)}
        formData={editingAgent}
        setFormData={setEditingAgent}
        onSave={handleSaveAgent}
      />

      <AccountDrawer
        isOpen={isAccountDrawerOpen}
        onClose={() => setIsAccountDrawerOpen(false)}
        account={editingAccount}
        agents={allData.agents}
        onSave={handleSaveAccount}
      />
    </div>
  );
};

export default RegPage;
