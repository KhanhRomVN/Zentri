import React, { useState } from 'react';
import { mockEmails, Email } from './mock/emails';
import EmailCard from './components/EmailCard';
import EmailDetail from './components/EmailDetail';
import { Search, PenSquare } from 'lucide-react';

const EmailPage = () => {
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(mockEmails[0]);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredEmails = mockEmails.filter(
    (email) =>
      email.sender.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.subject.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="flex h-full w-full overflow-hidden bg-background">
      {/* Left Panel: Email List */}
      <div className="w-[350px] flex flex-col border-r border-border h-full bg-muted/30">
        <div className="p-4 flex flex-col gap-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Inbox</h2>
            <button className="p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors shadow-sm">
              <PenSquare className="h-4 w-4" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search emails..."
              className="w-full h-9 pl-9 pr-4 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredEmails.map((email) => (
            <EmailCard
              key={email.id}
              email={email}
              selected={selectedEmail?.id === email.id}
              onClick={() => setSelectedEmail(email)}
            />
          ))}
        </div>
      </div>

      {/* Right Panel: Email Detail */}
      <div className="flex-1 h-full overflow-hidden bg-background">
        <EmailDetail email={selectedEmail} />
      </div>
    </div>
  );
};

export default EmailPage;
