export interface Mail {
  id: string;
  from: string;
  subject: string;
  snippet: string;
  body: string;
  date: string;
  read: boolean;
}

export const mockMails: Mail[] = [
  {
    id: '1',
    from: 'notifications@github.com',
    subject: 'Welcome to GitHub',
    snippet: 'Thanks for joining GitHub! We are excited to have you.',
    body: 'Hi there, welcome to GitHub! We are thrilled to have you on board.',
    date: '10:30 AM',
    read: false,
  },
  {
    id: '2',
    from: 'security@google.com',
    subject: 'Security Alert',
    snippet: 'New sign-in detected on your Mac.',
    body: 'We detected a new sign-in to your Google Account on a Mac device. If this was you, you can ignore this email.',
    date: 'Yesterday',
    read: true,
  },
  {
    id: '3',
    from: 'newsletter@medium.com',
    subject: 'Top stories for you',
    snippet: 'The future of React, and other stories.',
    body: 'Here are the top stories selected for you today: The future of React 19, Angular vs React, and more.',
    date: 'Jan 25',
    read: true,
  },
];
