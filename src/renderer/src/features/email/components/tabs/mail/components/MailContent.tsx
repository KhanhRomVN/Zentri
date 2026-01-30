import { Archive, Trash2, MoreVertical, Star, Reply, Mail as MailIcon } from 'lucide-react';
import { Mail } from '../../../mock/mails';

interface MailContentProps {
  selectedMail: Mail | null;
}

export const MailContent = ({ selectedMail }: MailContentProps) => {
  return (
    <div className="flex-1 flex flex-col h-full bg-background/50 backdrop-blur-3xl">
      {selectedMail ? (
        <div className="flex flex-col h-full animate-in fade-in duration-300">
          {/* Toolbar */}
          <div className="h-12 border-b border-border flex items-center justify-between px-6 shrink-0 bg-background/30">
            <div className="flex items-center gap-1">
              <button
                className="p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                title="Archive"
              >
                <Archive className="w-4 h-4" />
              </button>
              <button
                className="p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <div className="h-4 w-[1px] bg-border mx-1" />
              <button
                className="p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                title="Mark as Unread"
              >
                <MailIcon className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-1">
              <button className="p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-8 border-b border-border/40">
            <div className="flex items-start justify-between mb-6">
              <h2 className="text-2xl font-bold tracking-tight leading-tight max-w-3xl">
                {selectedMail.subject}
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-muted px-2 py-1 rounded text-muted-foreground">
                  Inbox
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-sm">
                  {selectedMail.from.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-sm text-foreground">{selectedMail.from}</span>
                  <span className="text-xs text-muted-foreground">to me</span>
                </div>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <span className="text-xs">{selectedMail.date}</span>
                <button className="p-1 hover:text-foreground transition-colors">
                  <Star className="w-4 h-4" />
                </button>
                <button className="p-1 hover:text-foreground transition-colors">
                  <Reply className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="p-8 flex-1 overflow-y-auto prose prose-sm dark:prose-invert max-w-none">
            <p className="leading-7 font-light text-base">{selectedMail.body}</p>

            <div className="mt-8 pt-8 border-t border-border/50">
              <button className="px-5 py-2.5 rounded-lg border border-border bg-card/50 hover:bg-card hover:border-primary/50 text-sm font-medium transition-all flex items-center gap-2">
                <Reply className="w-4 h-4" />
                Reply
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-4">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
            <MailIcon className="w-8 h-8 opacity-20" />
          </div>
          <p>Select an email to read</p>
        </div>
      )}
    </div>
  );
};
