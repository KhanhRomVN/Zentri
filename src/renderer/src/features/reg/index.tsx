import { useState, useMemo, useEffect } from 'react';
import RegSidebar from './components/RegSidebar';
import SessionGrid from './components/SessionGrid';
import AccountTable from './components/AccountTable';
import AgentDrawer from './components/AgentDrawer';
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
  const [isAgentDrawerOpen, setIsAgentDrawerOpen] = useState(false);
  const [activeAccountForAgent, setActiveAccountForAgent] = useState<string | null>(null);

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

  const handleDeleteAgent = (id: string) => {
    saveAgents(allData.agents.filter((a) => a.id !== id));
  };

  const handleOpenAgentDrawer = (accountId: string) => {
    setActiveAccountForAgent(accountId);
    setIsAgentDrawerOpen(true);
  };

  const handleSelectAgentForAccount = async (agentId: string) => {
    if (!activeAccountForAgent) return;

    const updatedAccounts = allData.accounts.map((acc) =>
      acc.id === activeAccountForAgent ? { ...acc, agentId } : acc,
    );

    setAllData((prev) => ({ ...prev, accounts: updatedAccounts }));
    await saveData(allData.sessions, updatedAccounts);
    setIsAgentDrawerOpen(false);
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
            onOpenAgentDrawer={handleOpenAgentDrawer}
          />
        ) : (
          <SessionGrid
            sessions={filteredSessions}
            onSelectSession={handleSelectSession}
            onCreateSession={handleCreateSession}
          />
        )}
      </div>

      <AgentDrawer
        isOpen={isAgentDrawerOpen}
        onClose={() => setIsAgentDrawerOpen(false)}
        agents={allData.agents}
        onCreateAgent={handleCreateAgent}
        onDeleteAgent={handleDeleteAgent}
        onSelectAgent={handleSelectAgentForAccount}
        selectedAgentId={allData.accounts.find((a) => a.id === activeAccountForAgent)?.agentId}
      />
    </div>
  );
};

export default RegPage;
