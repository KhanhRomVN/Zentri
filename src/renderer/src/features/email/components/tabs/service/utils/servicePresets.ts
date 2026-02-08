export interface ServiceProviderConfig {
  id: string;
  name: string;
  websiteUrl: string;
  defaultTags: string[];
  defaultCategories: string[];
  commonFields?: {
    label: string;
    key: string;
    type: 'text' | 'url' | 'password';
    placeholder?: string;
  }[];
}

export const SERVICE_PROVIDERS: Record<string, ServiceProviderConfig> = {
  facebook: {
    id: 'facebook',
    name: 'Facebook',
    websiteUrl: 'https://www.facebook.com',
    defaultTags: ['social', 'meta', 'community'],
    defaultCategories: ['Social Media', 'Communication'],
    commonFields: [
      {
        label: 'Profile URL',
        key: 'profileUrl',
        type: 'url',
        placeholder: 'https://facebook.com/your-username',
      },
      { label: 'Username', key: 'username', type: 'text', placeholder: 'Phone or email' },
      { label: 'Password', key: 'password', type: 'password', placeholder: 'Enter password' },
    ],
  },
  youtube: {
    id: 'youtube',
    name: 'YouTube',
    websiteUrl: 'https://www.youtube.com',
    defaultTags: ['video', 'google', 'entertainment'],
    defaultCategories: ['Video Platform', 'Entertainment'],
    commonFields: [
      {
        label: 'Channel URL',
        key: 'channelUrl',
        type: 'url',
        placeholder: 'https://youtube.com/@channel',
      },
      { label: 'Email/Username', key: 'username', type: 'text', placeholder: 'Google account' },
      { label: 'Password', key: 'password', type: 'password', placeholder: 'Enter password' },
    ],
  },
  instagram: {
    id: 'instagram',
    name: 'Instagram',
    websiteUrl: 'https://www.instagram.com',
    defaultTags: ['social', 'meta', 'photo'],
    defaultCategories: ['Social Media', 'Photography'],
    commonFields: [
      {
        label: 'Username',
        key: 'username',
        type: 'text',
        placeholder: 'Phone, email, or username',
      },
      { label: 'Password', key: 'password', type: 'password', placeholder: 'Enter password' },
    ],
  },
  github: {
    id: 'github',
    name: 'GitHub',
    websiteUrl: 'https://github.com',
    defaultTags: ['development', 'code', 'git'],
    defaultCategories: ['Development', 'Tools'],
    commonFields: [
      {
        label: 'Profile Link',
        key: 'profileUrl',
        type: 'url',
        placeholder: 'https://github.com/username',
      },
      { label: 'Username', key: 'username', type: 'text', placeholder: 'Username or email' },
      { label: 'Password', key: 'password', type: 'password', placeholder: 'Enter password' },
    ],
  },
  gmail: {
    id: 'gmail',
    name: 'Gmail',
    websiteUrl: 'https://mail.google.com',
    defaultTags: ['email', 'google', 'work'],
    defaultCategories: ['Communication', 'Productivity'],
    commonFields: [
      { label: 'Email', key: 'username', type: 'text', placeholder: 'google@gmail.com' },
      { label: 'Password', key: 'password', type: 'password', placeholder: 'Google Password' },
    ],
  },
  slack: {
    id: 'slack',
    name: 'Slack',
    websiteUrl: 'https://slack.com',
    defaultTags: ['work', 'chat', 'collaboration'],
    defaultCategories: ['Communication', 'Professional'],
    commonFields: [
      { label: 'Workspace Name', key: 'workspace', type: 'text', placeholder: 'workspace-name' },
      { label: 'Email', key: 'username', type: 'text', placeholder: 'work-email@company.com' },
      { label: 'Password', key: 'password', type: 'password', placeholder: 'Slack password' },
    ],
  },
  discord: {
    id: 'discord',
    name: 'Discord',
    websiteUrl: 'https://discord.com',
    defaultTags: ['chat', 'community', 'gaming'],
    defaultCategories: ['Communication', 'Gaming'],
  },
  linkedin: {
    id: 'linkedin',
    name: 'LinkedIn',
    websiteUrl: 'https://www.linkedin.com',
    defaultTags: ['professional', 'networking', 'jobs'],
    defaultCategories: ['Social Media', 'Professional'],
  },
  notion: {
    id: 'notion',
    name: 'Notion',
    websiteUrl: 'https://www.notion.so',
    defaultTags: ['productivity', 'notes', 'workspace'],
    defaultCategories: ['Productivity'],
  },
  spotify: {
    id: 'spotify',
    name: 'Spotify',
    websiteUrl: 'https://www.spotify.com',
    defaultTags: ['music', 'streaming', 'entertainment'],
    defaultCategories: ['Entertainment', 'Music'],
  },
};

export const POPULAR_SERVICE_PROVIDERS = Object.values(SERVICE_PROVIDERS);
export const POPULAR_SERVICE_NAMES = POPULAR_SERVICE_PROVIDERS.map((p) => p.name);

// Flattening some common categories for suggestions
export const POPULAR_CATEGORIES = [
  'Social Media',
  'Video Platform',
  'Development',
  'Communication',
  'Productivity',
  'Entertainment',
  'Shopping',
  'Finance',
  'Cloud Storage',
  'Professional',
  'Community',
  'Gaming',
  'Music',
  'Education',
];
