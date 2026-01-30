import { Website } from './types';

export const HARDCODED_PLATFORMS: Website[] = [
  {
    id: 'facebook',
    name: 'Facebook',
    url: 'https://facebook.com',
    color: '#3b82f6', // blue-500
    totalSessions: 0,
    successRate: 0,
    config: {
      columns: [
        { key: 'username', label: 'Username', type: 'text' },
        { key: 'email', label: 'Email', type: 'text' },
        { key: 'agentId', label: 'Agent', type: 'agent' },
        { key: 'status', label: 'Status', type: 'status' },
        { key: 'proxy', label: 'Proxy', type: 'text' },
        { key: 'createdAt', label: 'Created At', type: 'date' },
      ],
    },
  },
  {
    id: 'google',
    name: 'Google',
    url: 'https://google.com',
    color: '#ef4444', // red-500
    totalSessions: 0,
    successRate: 0,
    config: {
      columns: [
        { key: 'email', label: 'Email', type: 'text' },
        { key: 'recoveryEmail', label: 'Recovery', type: 'text' },
        { key: 'agentId', label: 'Agent', type: 'agent' },
        { key: 'status', label: 'Status', type: 'status' },
        { key: 'proxy', label: 'Proxy', type: 'text' },
        { key: 'createdAt', label: 'Created At', type: 'date' },
      ],
    },
  },
  {
    id: 'instagram',
    name: 'Instagram',
    url: 'https://instagram.com',
    color: '#ec4899', // pink-500
    totalSessions: 0,
    successRate: 0,
    config: {
      columns: [
        { key: 'username', label: 'Username', type: 'text' },
        { key: 'agentId', label: 'Agent', type: 'agent' },
        { key: 'status', label: 'Status', type: 'status' },
        { key: 'proxy', label: 'Proxy', type: 'text' },
        { key: 'createdAt', label: 'Created At', type: 'date' },
      ],
    },
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    url: 'https://tiktok.com',
    color: '#000000', // black
    totalSessions: 0,
    successRate: 0,
    config: {
      columns: [
        { key: 'username', label: 'Username', type: 'text' },
        { key: 'agentId', label: 'Agent', type: 'agent' },
        { key: 'status', label: 'Status', type: 'status' },
        { key: 'proxy', label: 'Proxy', type: 'text' },
        { key: 'createdAt', label: 'Created At', type: 'date' },
      ],
    },
  },
  {
    id: 'x',
    name: 'X (Twitter)',
    url: 'https://x.com',
    color: '#64748b', // slate-500
    totalSessions: 0,
    successRate: 0,
    config: {
      columns: [
        { key: 'username', label: 'Username', type: 'text' },
        { key: 'agentId', label: 'Agent', type: 'agent' },
        { key: 'status', label: 'Status', type: 'status' },
        { key: 'proxy', label: 'Proxy', type: 'text' },
        { key: 'createdAt', label: 'Created At', type: 'date' },
      ],
    },
  },
  {
    id: 'discord',
    name: 'Discord',
    color: '#6366f1', // indigo-500
    url: 'https://discord.com',
    totalSessions: 0,
    successRate: 0,
    config: {
      columns: [
        { key: 'username', label: 'Username', type: 'text' },
        { key: 'email', label: 'Email', type: 'text' },
        { key: 'agentId', label: 'Agent', type: 'agent' },
        { key: 'status', label: 'Status', type: 'status' },
        { key: 'proxy', label: 'Proxy', type: 'text' },
        { key: 'createdAt', label: 'Created At', type: 'date' },
      ],
    },
  },
];
