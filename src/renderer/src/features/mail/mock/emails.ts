export interface Email {
  id: string;
  sender: string;
  email: string;
  subject: string;
  preview: string;
  content: string;
  date: string;
  read: boolean;
  provider: 'gmail' | 'hotmail' | 'protonmail';
  tags?: string[];
  avatar?: string;
  important?: boolean;
}

export const mockEmails: Email[] = [
  {
    id: '1',
    sender: 'Google Security',
    email: 'no-reply@accounts.google.com',
    subject: 'Security alert: New sign-in detected',
    preview: 'A new sign-in on Windows was detected from your account...',
    content: `
      <h2>Security Alert</h2>
      <p>We detected a new sign-in to your Google Account on a Windows device. If this was you, you don't need to do anything. If not, we'll help you secure your account.</p>
      <div style="background-color: rgba(255,0,0,0.1); padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p><strong>Device:</strong> Windows 11 Chrome</p>
        <p><strong>Location:</strong> Ho Chi Minh City, Vietnam</p>
        <p><strong>Time:</strong> Just now</p>
      </div>
      <p>You can check account activity at <a href="#">https://myaccount.google.com</a></p>
    `,
    date: '10:30 AM',
    read: false,
    provider: 'gmail',
    tags: ['Security', 'Alert'],
    important: true,
  },
  {
    id: '2',
    sender: 'Microsoft Outlook',
    email: 'team@microsoft.com',
    subject: 'Welcome to your new Outlook account',
    preview: "Hi Khanh, welcome to Outlook. Let's get started with your new inbox...",
    content: `
      <h2>Welcome to Outlook</h2>
      <p>Hi Khanh,</p>
      <p>We're excited to have you on board. Outlook helps you stay connected and organized.</p>
      <ul>
        <li>Connect all your calendars</li>
        <li>Organize with folders and tags</li>
        <li>Stay safe with enterprise-grade security</li>
      </ul>
      <p>Get the app on your phone to stay in sync.</p>
    `,
    date: 'Yesterday',
    read: true,
    provider: 'hotmail',
    tags: ['Welcome'],
  },
  {
    id: '3',
    sender: 'Proton Team',
    email: 'contact@proton.me',
    subject: 'Your privacy is our priority',
    preview: 'Thank you for choosing Proton, the privacy-first email for everyone...',
    content: `
      <h2>Welcome to privacy</h2>
      <p>Proton is designed to keep your data safe. We don't track you, we don't sell your data.</p>
      <p>Check out our encrypted calendar and drive too!</p>
      <p>Best,<br>The Proton Team</p>
    `,
    date: '2 days ago',
    read: true,
    provider: 'protonmail',
    tags: ['Privacy'],
  },
  {
    id: '4',
    sender: 'GitHub',
    email: 'noreply@github.com',
    subject: '[GitHub] A personal access token has been added to your account',
    preview: 'Hey there! A personal access token was just added to your account...',
    content: `
      <p>Hey there!</p>
      <p>A personal access token (Classic) was just added to your account.</p>
      <p><strong>Name:</strong> CI/CD Pipeline</p>
      <p>If this wasn't you, please revoke it immediately in your settings.</p>
      <p><a href="#">View your tokens</a></p>
    `,
    date: 'Jan 25',
    read: false,
    provider: 'gmail',
    tags: ['Dev', 'GitHub'],
    important: true,
  },
  {
    id: '5',
    sender: 'Dribbble',
    email: 'shots@dribbble.com',
    subject: 'Top shots of these week: Dashboard Inspiration',
    preview: "See what's trending on Dribbble this week. From AI tools to banking apps...",
    content: `
      <h2>Weekly Inspiration</h2>
      <p>Check out the most popular designs this week.</p>
      <ul>
        <li><strong>Dashboard Redesign</strong> by Tran Mau Tri Tam</li>
        <li><strong>Mobile Banking App</strong> by Aurélien Salomon</li>
        <li><strong>AI Photo Editor</strong> by Cuberto</li>
      </ul>
      <p>Keep creating!</p>
    `,
    date: 'Jan 24',
    read: true,
    provider: 'hotmail',
    tags: ['Design', 'Newsletter'],
  },
  {
    id: '6',
    sender: 'Spotify',
    email: 'no-reply@spotify.com',
    subject: 'Your 2024 Wrapped is here',
    preview: 'See what you listened to most this year. Your top songs are waiting...',
    content: `
      <h1>Your 2024 Wrapped</h1>
      <p>It's that time of year again. Dive into the music that defined your 2024.</p>
      <div style="background-color: #1db954; color: white; padding: 20px; border-radius: 12px; text-align: center;">
        <h2 style="margin: 0;">Top Genre: Lo-Fi Beats</h2>
      </div>
      <p>Listen to your Top Songs playlist now.</p>
    `,
    date: 'Jan 20',
    read: true,
    provider: 'gmail',
    tags: ['Music'],
  },
  {
    id: '7',
    sender: 'Linear',
    email: 'notifications@linear.app',
    subject: 'Khanh assigned you to IOS-241: Fix navigation bug',
    preview: 'Khanh assigned you to IOS-241. Priority: High. Status: In Progress...',
    content: `
      <p><strong>Khanh assigned you to an issue</strong></p>
      <h3><a href="#">IOS-241: Fix navigation bug on iPhone 15</a></h3>
      <p>Priority: High<br>Status: In Progress</p>
      <p>Please check the reproduction steps in the ticket.</p>
    `,
    date: 'Jan 18',
    read: true,
    provider: 'protonmail',
    tags: ['Work', 'Jira'],
  },
];
