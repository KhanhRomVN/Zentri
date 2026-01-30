import { Email } from '../mock/emails';
import {
  Reply,
  Trash2,
  Archive,
  MoreVertical,
  Printer,
  Mail,
  Share2,
  AlertCircle,
} from 'lucide-react';
import { cn } from '../../../shared/lib/utils';

interface EmailDetailProps {
  email: Email | null;
}

const EmailDetail = ({ email }: EmailDetailProps) => {
  if (!email) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground flex-col gap-6 bg-background/50">
        <div className="h-24 w-24 rounded-full bg-accent flex items-center justify-center animate-in zoom-in-50 duration-500">
          <Mail className="h-10 w-10 opacity-50" />
        </div>
        <p className="text-lg font-medium">Select an email to read</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background animate-in fade-in slide-in-from-right-4 duration-300">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="flex items-center gap-1">
          <button
            className="p-2 hover:bg-accent hover:text-accent-foreground rounded-md transition-all"
            title="Archive"
          >
            <Archive className="h-4 w-4" />
          </button>
          <button
            className="p-2 hover:bg-destructive/10 hover:text-destructive rounded-md transition-all"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <div className="h-4 w-[1px] bg-border mx-2" />
          <button
            className="p-2 hover:bg-accent hover:text-accent-foreground rounded-md transition-all"
            title="Mark as unread"
          >
            <Mail className="h-4 w-4" />
          </button>
          <button
            className="p-2 hover:bg-accent hover:text-accent-foreground rounded-md transition-all"
            title="Report Spam"
          >
            <AlertCircle className="h-4 w-4" />
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-2 hover:bg-accent hover:text-accent-foreground rounded-md transition-all">
            <Printer className="h-4 w-4" />
          </button>
          <button className="p-2 hover:bg-accent hover:text-accent-foreground rounded-md transition-all">
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* Header */}
        <div className="p-8 pb-6">
          <div className="flex items-start justify-between mb-6 gap-4">
            <h1 className="text-2xl font-bold leading-tight tracking-tight text-foreground">
              {email.subject}
            </h1>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs font-mono text-muted-foreground bg-accent px-2 py-1 rounded-full uppercase tracking-wider">
                {email.provider}
              </span>
              {email.important && (
                <span className="text-xs font-bold text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-500 px-2 py-1 rounded-full uppercase tracking-wider">
                  Important
                </span>
              )}
            </div>
          </div>

          <div className="flex items-start justify-between p-4 rounded-md bg-card border border-border shadow-sm">
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  'h-12 w-12 rounded-full flex items-center justify-center text-lg font-bold shadow-sm ring-4 ring-background',
                  'bg-gradient-to-br from-primary to-primary/60 text-primary-foreground',
                )}
              >
                {email.sender.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <div className="font-semibold text-base text-foreground">{email.sender}</div>
                  <span className="text-xs text-muted-foreground">&lt;{email.email}&gt;</span>
                </div>
                <div className="text-sm text-muted-foreground mt-0.5">
                  To: <span className="text-foreground">Me</span>
                </div>
              </div>
            </div>
            <div className="text-sm font-medium text-muted-foreground tabular-nums bg-accent/30 px-3 py-1 rounded-md">
              {email.date}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-8 pb-8">
          <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none prose-headings:font-bold prose-p:leading-relaxed prose-a:text-primary prose-img:rounded-md">
            <div dangerouslySetInnerHTML={{ __html: email.content }} />
          </div>
        </div>

        {/* Attachments Section Mockup */}
        <div className="px-8 pb-8">
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Share2 className="w-4 h-4" /> Attachments
          </h4>
          <div className="flex gap-3">
            <div className="h-16 w-32 bg-accent/30 border border-border rounded-lg flex items-center justify-center text-xs text-muted-foreground cursor-pointer hover:bg-accent/50 transition-colors">
              Report.pdf
            </div>
          </div>
        </div>
      </div>

      {/* Reply Box */}
      <div className="p-6 border-t border-border mt-auto bg-background/50 backdrop-blur">
        <button className="flex items-center gap-3 w-full p-4 rounded-md border border-border bg-card hover:bg-accent/50 transition-colors shadow-sm text-left group">
          <div className="bg-primary/10 p-2 rounded-full text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
            <Reply className="h-5 w-5" />
          </div>
          <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
            Click to reply to <span className="font-medium text-foreground">{email.sender}</span>...
          </span>
        </button>
      </div>
    </div>
  );
};

export default EmailDetail;
