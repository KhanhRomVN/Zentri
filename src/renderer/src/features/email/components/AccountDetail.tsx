import { useState, useCallback } from 'react';
import { Account } from '../mock/accounts';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Mail,
  Cloud,
  Globe,
  MoreVertical,
  HardDrive,
  History,
  Lock,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { cn } from '../../../shared/lib/utils';

const TABS = ['overview', 'security', 'data'] as const;

interface AccountDetailProps {
  account: Account | null;
}

const AccountDetail = ({ account }: AccountDetailProps) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'security' | 'data'>('overview');

  if (!account) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground flex-col gap-6 bg-background/50">
        <div className="h-32 w-32 rounded-full bg-accent/30 flex items-center justify-center animate-pulse">
          <Shield className="h-12 w-12 opacity-30" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-xl font-semibold text-foreground">No Account Selected</h3>
          <p className="text-sm max-w-[250px] mx-auto">
            Select an account from the sidebar or connect a new one to get started.
          </p>
        </div>
      </div>
    );
  }

  const getProviderColor = useCallback((provider: Account['provider']) => {
    switch (provider) {
      case 'gmail':
        return 'from-red-500 to-red-600 shadow-red-500/20';
      case 'hotmail':
        return 'from-blue-500 to-blue-600 shadow-blue-500/20';
      case 'protonmail':
        return 'from-purple-600 to-indigo-700 shadow-purple-500/20';
      default:
        return 'from-gray-500 to-gray-600 shadow-gray-500/20';
    }
  }, []);

  const getSecurityScoreColor = useCallback((score: number) => {
    if (score >= 90) return 'text-emerald-500';
    if (score >= 70) return 'text-yellow-500';
    return 'text-red-500';
  }, []);

  const handleTabClick = useCallback((tab: (typeof TABS)[number]) => {
    setActiveTab(tab);
  }, []);

  return (
    <div className="h-full flex flex-col bg-background/50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
        {/* Header Profile Card - Always Visible */}
        <div className="relative overflow-hidden rounded-3xl border border-border/50 bg-card/50 backdrop-blur-sm p-8 shadow-sm group">
          {/* Action Button */}
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <button className="p-2 hover:bg-background/80 hover:text-foreground rounded-full transition-all text-muted-foreground backdrop-blur-sm">
              <MoreVertical className="h-4 w-4" />
            </button>
          </div>

          <div className="relative z-10 flex items-start justify-between">
            <div className="flex items-center gap-6">
              <div
                className={cn(
                  'h-24 w-24 rounded-2xl flex items-center justify-center text-3xl font-bold text-white shadow-xl bg-gradient-to-br ring-4 ring-background',
                  getProviderColor(account.provider),
                )}
              >
                {account.avatar}
              </div>
              <div className="space-y-1">
                <h1 className="text-3xl font-bold tracking-tight">{account.name}</h1>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  <span className="font-medium">{account.email}</span>
                  <span className="w-1 h-1 rounded-full bg-border" />
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 capitalize">
                    {account.provider}
                  </span>
                </div>

                {/* Integrated Tabs */}
                <div className="pt-4 flex items-center gap-2">
                  {TABS.map((tab) => (
                    <button
                      key={tab}
                      onClick={() => handleTabClick(tab)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize border',
                        activeTab === tab
                          ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                          : 'bg-background/50 text-muted-foreground border-transparent hover:bg-background/80 hover:text-foreground',
                      )}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Security Score Widget */}
            <div className="flex flex-col items-end pt-2">
              <div className="relative w-20 h-20 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-muted/20"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  />
                  <path
                    className={getSecurityScoreColor(account.securityScore ?? 0)}
                    strokeDasharray={`${account.securityScore ?? 0}, 100`}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span
                    className={cn(
                      'text-xl font-bold',
                      getSecurityScoreColor(account.securityScore ?? 0),
                    )}
                  >
                    {account.securityScore ?? 0}
                  </span>
                </div>
              </div>
              <span className="text-xs font-medium text-muted-foreground mt-2">Security Score</span>
            </div>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Connected Services */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  Connected Services
                </h3>
                <button className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-full hover:bg-primary/20 transition-colors font-medium">
                  Manage Services
                </button>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {account.services?.map((service) => (
                  <div
                    key={service.name}
                    className="group relative p-4 rounded-md border border-border/50 bg-card/30 hover:bg-card hover:border-primary/20 hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative z-10 flex flex-col gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-300">
                        <Cloud className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-medium">{service.name}</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          Connected {service.connectedDate || 'Unknown'}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Security Checks */}
              <div className="p-6 rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm shadow-sm space-y-6">
                <h3 className="font-semibold flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-primary" /> Security Checkup
                </h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-md bg-accent/20 border border-border/50">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'w-10 h-10 rounded-full flex items-center justify-center',
                          account.twoFactorEnabled
                            ? 'bg-emerald-500/10 text-emerald-500'
                            : 'bg-red-500/10 text-red-500',
                        )}
                      >
                        {account.twoFactorEnabled ? (
                          <Lock className="w-5 h-5" />
                        ) : (
                          <ShieldAlert className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">2-Step Verification</p>
                        <p className="text-xs text-muted-foreground">
                          {account.twoFactorEnabled
                            ? 'Your account is protected'
                            : 'Add an extra layer of security'}
                        </p>
                      </div>
                    </div>
                    <button className="text-xs font-medium bg-background border border-border px-3 py-1.5 rounded-lg hover:border-primary hover:text-primary transition-colors">
                      Details
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-md bg-accent/20 border border-border/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center">
                        <Globe className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium">Recovery Info</p>
                        <p className="text-xs text-muted-foreground">
                          {account.recoveryEmail ? 'Recovery email added' : 'No recovery info'}
                        </p>
                      </div>
                    </div>
                    <button className="text-xs font-medium bg-background border border-border px-3 py-1.5 rounded-lg hover:border-primary hover:text-primary transition-colors">
                      Review
                    </button>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="p-6 rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm shadow-sm flex flex-col">
                <h3 className="font-semibold flex items-center gap-2 mb-6">
                  <History className="w-5 h-5 text-primary" /> Recent Activity
                </h3>

                <div className="space-y-6 relative flex-1">
                  <div className="absolute left-[19px] top-2 bottom-2 w-[2px] bg-border/50" />

                  {account.recentActivity?.length ? (
                    account.recentActivity.map((activity) => (
                      <div key={activity.id} className="relative flex gap-4">
                        <div
                          className={cn(
                            'relative z-10 w-10 h-10 rounded-full border-4 border-background flex items-center justify-center shrink-0',
                            activity.status === 'success'
                              ? 'bg-emerald-500 text-white'
                              : 'bg-yellow-500 text-white',
                          )}
                        >
                          {activity.action === 'login' && <LogOut className="w-4 h-4 rotate-180" />}
                          {activity.action === 'security_change' && <Shield className="w-4 h-4" />}
                          {activity.action === 'data_export' && <HardDrive className="w-4 h-4" />}
                        </div>
                        <div className="pt-1">
                          <p className="text-sm font-medium capitalize text-foreground">
                            {activity.action.replace('_', ' ')}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {activity.location} • {activity.timestamp}
                          </p>
                          <p className="text-xs text-muted-foreground/70">{activity.device}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center p-4">
                      <History className="w-10 h-10 text-muted-foreground/30 mb-2" />
                      <p className="text-sm text-muted-foreground">No recent suspicious activity</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Data Tab - Placeholder for now */}
        {activeTab === 'data' && (
          <div className="flex flex-col items-center justify-center py-20 animate-in fade-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-muted/30 rounded-full flex items-center justify-center mb-4">
              <HardDrive className="w-10 h-10 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-medium">Data Management</h3>
            <p className="text-sm text-muted-foreground max-w-sm text-center mt-2">
              Tools to export, backup, or delete your account data used by Zentri.
            </p>
            <button className="mt-6 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors shadow-sm">
              Request Data Export
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountDetail;
