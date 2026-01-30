import {
  MoreVertical,
  Users,
  Calendar,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  X,
  Layout,
} from 'lucide-react';
import { RegSession } from '../types';
import { cn } from '../../../shared/lib/utils';
import { useState } from 'react';

interface SessionGridProps {
  sessions: RegSession[];
  onSelectSession: (session: RegSession) => void;
  onCreateSession: (name: string) => void;
}

const SessionGrid = ({ sessions, onSelectSession, onCreateSession }: SessionGridProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSessionName, setNewSessionName] = useState('');

  const filteredSessions = sessions.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSessionName.trim()) {
      onCreateSession(newSessionName);
      setNewSessionName('');
      setIsModalOpen(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Grid Header */}
      <div className="h-16 shrink-0 flex items-center justify-between px-6 border-b border-border bg-card/10">
        <div className="flex-1 max-w-md">
          <div className="relative group">
            <Search className="absolute left-3 top-2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Search sessions..."
              className="w-full h-8 pl-10 pr-4 rounded-md bg-input border border-border focus:border-primary/40 text-sm shadow-sm transition-all focus-visible:outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="h-8 px-4 rounded-md bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-all flex items-center gap-2 shadow-lg shadow-primary/20 active:scale-95 ml-4"
        >
          <Plus className="w-4 h-4" />
          Create Session
        </button>
      </div>

      {/* Grid Content */}
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        {filteredSessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground opacity-30">
            <Search className="w-16 h-16" />
            <p className="text-sm font-medium">No sessions found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredSessions.map((session) => (
              <div
                key={session.id}
                onClick={() => onSelectSession(session)}
                className="group relative bg-card border border-border hover:border-primary/30 rounded-2xl p-5 cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 overflow-hidden"
              >
                {/* Background Decoration */}
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/2 rounded-full blur-2xl group-hover:bg-primary/5 transition-colors" />

                <div className="relative z-10 text-center sm:text-left">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-bold text-lg truncate group-hover:text-primary transition-colors flex-1 mr-2">
                      {session.name}
                    </h3>
                    <button className="p-1.5 hover:bg-background rounded-md text-muted-foreground hover:text-foreground transition-all shrink-0">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-3 mt-4">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Users className="w-3.5 h-3.5" />
                      <span>{session.accountCount} Accounts Total</span>
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                          Success
                        </span>
                        <div className="flex items-center gap-1.5 text-emerald-500">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span className="text-sm font-bold">{session.successRate}%</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 border-l border-border/50 pl-3">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                          Failed
                        </span>
                        <div className="flex items-center gap-1.5 text-red-500">
                          <XCircle className="w-3.5 h-3.5" />
                          <span className="text-sm font-bold">{session.failureRate}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium pt-2 italic">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(session.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-border flex items-center justify-between text-[10px] font-bold tracking-wider uppercase text-muted-foreground group-hover:text-primary transition-colors">
                    <span>Analyze Details</span>
                    <div className="w-5 h-5 rounded-full border border-border flex items-center justify-center group-hover:border-primary/30 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                      →
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Session Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={() => setIsModalOpen(false)}
          />
          <form
            onSubmit={handleSubmit}
            className="relative w-full max-w-sm bg-background border border-border shadow-2xl rounded-2xl flex flex-col animate-in zoom-in-95 duration-300 overflow-hidden"
          >
            <div className="px-6 py-4 flex items-center justify-between border-b border-border bg-muted/20">
              <h3 className="text-lg font-bold tracking-tight">New Session</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-md hover:bg-muted text-muted-foreground transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Session Name
                </label>
                <div className="relative group">
                  <div className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors">
                    <Layout className="w-4 h-4" />
                  </div>
                  <input
                    autoFocus
                    required
                    type="text"
                    placeholder="e.g. Batch #1 - Fresh Accounts"
                    className="w-full h-10 pl-10 pr-4 rounded-md bg-input border border-border focus:border-primary/40 text-sm transition-all focus-visible:outline-none"
                    value={newSessionName}
                    onChange={(e) => setNewSessionName(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-border bg-muted/10 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 h-9 rounded-md border border-border font-bold text-xs hover:bg-muted transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 h-9 rounded-md bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition-all shadow-lg shadow-primary/10"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default SessionGrid;
