import { useState } from 'react';
import { mockMails, Mail } from '../../../mock/mails';
import { MailSidebar } from './components/MailSidebar';
import { MailContent } from './components/MailContent';

const MailTab = () => {
  const [selectedMail, setSelectedMail] = useState<Mail | null>(mockMails[0]);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMails = mockMails.filter(
    (mail) =>
      mail.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mail.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mail.snippet.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="flex h-full w-full">
      <MailSidebar
        mails={filteredMails}
        selectedMail={selectedMail}
        onSelectMail={setSelectedMail}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      <MailContent selectedMail={selectedMail} />
    </div>
  );
};

export default MailTab;
