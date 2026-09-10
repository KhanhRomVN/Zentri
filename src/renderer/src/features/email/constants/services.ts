/**
 * Service template registry for linking email accounts.
 * All descriptions are in English.
 */

export interface ServiceTemplateMetadataField {
  name: string;
  type: string;
  feature?: string;
}

export interface ServiceTemplate {
  id: string;
  name: string;
  description: string;
  url: string;
  category: string;
  tags: string[];
  auth_method: string[];
  metadata: {
    fields: ServiceTemplateMetadataField[];
  };
  two_fa: {
    has_totp: boolean;
    has_backup_codes: boolean;
  };
}

export const SERVICES: ServiceTemplate[] = [
  {
    id: 'google',
    name: 'Google',
    description: 'Google ecosystem: Gmail, Drive, Ads, YouTube and more.',
    url: 'https://www.google.com',
    category: 'Productivity',
    tags: ['email', 'cloud', 'ads', 'youtube'],
    auth_method: ['google_oauth', 'basic_auth'],
    metadata: {
      fields: [
        { name: 'Email', type: 'string' },
        { name: 'Password', type: 'string', feature: 'encryption' },
        { name: 'RecoveryEmail', type: 'string' },
        { name: 'RecoveryPhone', type: 'string' },
      ],
    },
    two_fa: { has_totp: true, has_backup_codes: true },
  },
  {
    id: 'facebook',
    name: 'Facebook',
    description: 'The largest social network, part of Meta. Used for ads, pages and groups.',
    url: 'https://www.facebook.com',
    category: 'Social Media',
    tags: ['social', 'ads', 'meta', 'marketing'],
    auth_method: ['basic_auth', 'google_oauth'],
    metadata: {
      fields: [
        { name: 'Name', type: 'string' },
        { name: 'Username', type: 'string' },
        { name: 'Password', type: 'string', feature: 'encryption' },
        { name: 'ProfileURL', type: 'url', feature: 'url' },
      ],
    },
    two_fa: { has_totp: true, has_backup_codes: true },
  },
  {
    id: 'twitter',
    name: 'Twitter / X',
    description: 'Microblogging social network owned by X Corp.',
    url: 'https://x.com',
    category: 'Social Media',
    tags: ['social', 'microblog', 'marketing'],
    auth_method: ['twitter_oauth', 'basic_auth'],
    metadata: {
      fields: [
        { name: 'Username', type: 'string' },
        { name: 'Password', type: 'string', feature: 'encryption' },
      ],
    },
    two_fa: { has_totp: true, has_backup_codes: true },
  },
  {
    id: 'instagram',
    name: 'Instagram',
    description: 'Photo and video sharing social network by Meta.',
    url: 'https://www.instagram.com',
    category: 'Social Media',
    tags: ['social', 'photo', 'meta', 'influencer'],
    auth_method: ['basic_auth', 'google_oauth'],
    metadata: {
      fields: [
        { name: 'Username', type: 'string' },
        { name: 'Password', type: 'string', feature: 'encryption' },
      ],
    },
    two_fa: { has_totp: true, has_backup_codes: true },
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    description: 'Professional networking and job search platform.',
    url: 'https://www.linkedin.com',
    category: 'Professional',
    tags: ['career', 'networking', 'jobs'],
    auth_method: ['basic_auth', 'google_oauth'],
    metadata: {
      fields: [
        { name: 'Email', type: 'string' },
        { name: 'Password', type: 'string', feature: 'encryption' },
      ],
    },
    two_fa: { has_totp: true, has_backup_codes: true },
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    description: 'Short-form video sharing and social entertainment platform.',
    url: 'https://www.tiktok.com',
    category: 'Social Media',
    tags: ['video', 'social', 'entertainment'],
    auth_method: ['basic_auth', 'google_oauth'],
    metadata: {
      fields: [
        { name: 'Username', type: 'string' },
        { name: 'Password', type: 'string', feature: 'encryption' },
      ],
    },
    two_fa: { has_totp: true, has_backup_codes: true },
  },
  {
    id: 'github',
    name: 'GitHub',
    description: 'Code hosting and collaboration platform for developers.',
    url: 'https://github.com',
    category: 'Developer',
    tags: ['dev', 'git', 'repo'],
    auth_method: ['github_oauth', 'basic_auth', 'api_key'],
    metadata: {
      fields: [
        { name: 'Username', type: 'string' },
        { name: 'Password', type: 'string', feature: 'encryption' },
        { name: 'AccessToken', type: 'string', feature: 'encryption' },
      ],
    },
    two_fa: { has_totp: true, has_backup_codes: true },
  },
  {
    id: 'gitlab',
    name: 'GitLab',
    description: 'Complete DevOps platform with source code management.',
    url: 'https://gitlab.com',
    category: 'Developer',
    tags: ['dev', 'git', 'ci'],
    auth_method: ['basic_auth', 'api_key'],
    metadata: {
      fields: [
        { name: 'Username', type: 'string' },
        { name: 'Password', type: 'string', feature: 'encryption' },
      ],
    },
    two_fa: { has_totp: true, has_backup_codes: true },
  },
  {
    id: 'microsoft',
    name: 'Microsoft',
    description: 'Microsoft account for Outlook, OneDrive, Azure and Office.',
    url: 'https://www.microsoft.com',
    category: 'Productivity',
    tags: ['email', 'cloud', 'office'],
    auth_method: ['microsoft_oauth', 'basic_auth'],
    metadata: {
      fields: [
        { name: 'Email', type: 'string' },
        { name: 'Password', type: 'string', feature: 'encryption' },
      ],
    },
    two_fa: { has_totp: true, has_backup_codes: true },
  },
  {
    id: 'apple',
    name: 'Apple',
    description: 'Apple ID for iCloud, App Store, Music and more.',
    url: 'https://www.apple.com',
    category: 'Productivity',
    tags: ['icloud', 'apple', 'app-store'],
    auth_method: ['apple_oauth', 'basic_auth'],
    metadata: {
      fields: [
        { name: 'Email', type: 'string' },
        { name: 'Password', type: 'string', feature: 'encryption' },
      ],
    },
    two_fa: { has_totp: true, has_backup_codes: true },
  },
  {
    id: 'amazon',
    name: 'Amazon',
    description: 'E-commerce and cloud computing platform.',
    url: 'https://www.amazon.com',
    category: 'Shopping',
    tags: ['ecommerce', 'cloud', 'retail'],
    auth_method: ['basic_auth', 'google_oauth'],
    metadata: {
      fields: [
        { name: 'Email', type: 'string' },
        { name: 'Password', type: 'string', feature: 'encryption' },
      ],
    },
    two_fa: { has_totp: true, has_backup_codes: true },
  },
  {
    id: 'netflix',
    name: 'Netflix',
    description: 'Streaming service for movies and TV series.',
    url: 'https://www.netflix.com',
    category: 'Entertainment',
    tags: ['streaming', 'video', 'entertainment'],
    auth_method: ['basic_auth'],
    metadata: {
      fields: [
        { name: 'Email', type: 'string' },
        { name: 'Password', type: 'string', feature: 'encryption' },
      ],
    },
    two_fa: { has_totp: false, has_backup_codes: false },
  },
  {
    id: 'spotify',
    name: 'Spotify',
    description: 'Music streaming and podcast platform.',
    url: 'https://www.spotify.com',
    category: 'Entertainment',
    tags: ['music', 'streaming', 'podcast'],
    auth_method: ['basic_auth', 'google_oauth', 'facebook_oauth'],
    metadata: {
      fields: [
        { name: 'Email', type: 'string' },
        { name: 'Password', type: 'string', feature: 'encryption' },
      ],
    },
    two_fa: { has_totp: false, has_backup_codes: false },
  },
  {
    id: 'discord',
    name: 'Discord',
    description: 'Voice, video and text communication for communities.',
    url: 'https://discord.com',
    category: 'Communication',
    tags: ['chat', 'voice', 'community'],
    auth_method: ['basic_auth', 'google_oauth'],
    metadata: {
      fields: [
        { name: 'Username', type: 'string' },
        { name: 'Password', type: 'string', feature: 'encryption' },
      ],
    },
    two_fa: { has_totp: true, has_backup_codes: true },
  },
  {
    id: 'paypal',
    name: 'PayPal',
    description: 'Online payment and money transfer service.',
    url: 'https://www.paypal.com',
    category: 'Finance',
    tags: ['payment', 'finance', 'money'],
    auth_method: ['basic_auth'],
    metadata: {
      fields: [
        { name: 'Email', type: 'string' },
        { name: 'Password', type: 'string', feature: 'encryption' },
      ],
    },
    two_fa: { has_totp: true, has_backup_codes: true },
  },
  {
    id: 'ebay',
    name: 'eBay',
    description: 'Global online marketplace for buying and selling goods.',
    url: 'https://www.ebay.com',
    category: 'Shopping',
    tags: ['ecommerce', 'auction', 'retail'],
    auth_method: ['basic_auth', 'google_oauth'],
    metadata: {
      fields: [
        { name: 'Username', type: 'string' },
        { name: 'Password', type: 'string', feature: 'encryption' },
      ],
    },
    two_fa: { has_totp: true, has_backup_codes: true },
  },
  {
    id: 'twitch',
    name: 'Twitch',
    description: 'Live streaming platform for gamers and creators.',
    url: 'https://www.twitch.tv',
    category: 'Entertainment',
    tags: ['streaming', 'gaming', 'live'],
    auth_method: ['basic_auth', 'google_oauth'],
    metadata: {
      fields: [
        { name: 'Username', type: 'string' },
        { name: 'Password', type: 'string', feature: 'encryption' },
      ],
    },
    two_fa: { has_totp: true, has_backup_codes: true },
  },
  {
    id: 'steam',
    name: 'Steam',
    description: 'Digital distribution platform for PC gaming.',
    url: 'https://store.steampowered.com',
    category: 'Gaming',
    tags: ['gaming', 'pc', 'distribution'],
    auth_method: ['basic_auth'],
    metadata: {
      fields: [
        { name: 'Username', type: 'string' },
        { name: 'Password', type: 'string', feature: 'encryption' },
      ],
    },
    two_fa: { has_totp: true, has_backup_codes: true },
  },
  {
    id: 'reddit',
    name: 'Reddit',
    description: 'Community-driven discussion and content aggregation platform.',
    url: 'https://www.reddit.com',
    category: 'Social Media',
    tags: ['community', 'discussion', 'social'],
    auth_method: ['basic_auth', 'google_oauth'],
    metadata: {
      fields: [
        { name: 'Username', type: 'string' },
        { name: 'Password', type: 'string', feature: 'encryption' },
      ],
    },
    two_fa: { has_totp: true, has_backup_codes: true },
  },
  {
    id: 'pinterest',
    name: 'Pinterest',
    description: 'Visual discovery and bookmarking platform.',
    url: 'https://www.pinterest.com',
    category: 'Social Media',
    tags: ['visual', 'social', 'discovery'],
    auth_method: ['basic_auth', 'google_oauth', 'facebook_oauth'],
    metadata: {
      fields: [
        { name: 'Email', type: 'string' },
        { name: 'Password', type: 'string', feature: 'encryption' },
      ],
    },
    two_fa: { has_totp: true, has_backup_codes: true },
  },
  {
    id: 'dropbox',
    name: 'Dropbox',
    description: 'Cloud storage and file synchronization service.',
    url: 'https://www.dropbox.com',
    category: 'Productivity',
    tags: ['cloud', 'storage', 'file-sharing'],
    auth_method: ['basic_auth', 'google_oauth', 'apple_oauth'],
    metadata: {
      fields: [
        { name: 'Email', type: 'string' },
        { name: 'Password', type: 'string', feature: 'encryption' },
      ],
    },
    two_fa: { has_totp: true, has_backup_codes: true },
  },
  {
    id: 'shopify',
    name: 'Shopify',
    description: 'E-commerce platform for online stores and retail.',
    url: 'https://www.shopify.com',
    category: 'Shopping',
    tags: ['ecommerce', 'business', 'store'],
    auth_method: ['basic_auth', 'api_key'],
    metadata: {
      fields: [
        { name: 'Email', type: 'string' },
        { name: 'Password', type: 'string', feature: 'encryption' },
        { name: 'StoreName', type: 'string' },
      ],
    },
    two_fa: { has_totp: true, has_backup_codes: true },
  },
  {
    id: 'notion',
    name: 'Notion',
    description: 'All-in-one workspace for notes, docs and project management.',
    url: 'https://www.notion.so',
    category: 'Productivity',
    tags: ['notes', 'workspace', 'docs'],
    auth_method: ['basic_auth', 'google_oauth', 'apple_oauth'],
    metadata: {
      fields: [
        { name: 'Email', type: 'string' },
        { name: 'Password', type: 'string', feature: 'encryption' },
      ],
    },
    two_fa: { has_totp: true, has_backup_codes: true },
  },
  {
    id: 'figma',
    name: 'Figma',
    description: 'Collaborative interface design and prototyping tool.',
    url: 'https://www.figma.com',
    category: 'Design',
    tags: ['design', 'ui', 'prototyping'],
    auth_method: ['basic_auth', 'google_oauth'],
    metadata: {
      fields: [
        { name: 'Email', type: 'string' },
        { name: 'Password', type: 'string', feature: 'encryption' },
      ],
    },
    two_fa: { has_totp: true, has_backup_codes: true },
  },
  {
    id: 'adobe',
    name: 'Adobe',
    description: 'Creative Cloud suite: Photoshop, Illustrator, Premiere and more.',
    url: 'https://www.adobe.com',
    category: 'Design',
    tags: ['creative', 'design', 'software'],
    auth_method: ['basic_auth', 'google_oauth', 'apple_oauth'],
    metadata: {
      fields: [
        { name: 'Email', type: 'string' },
        { name: 'Password', type: 'string', feature: 'encryption' },
      ],
    },
    two_fa: { has_totp: true, has_backup_codes: true },
  },
  {
    id: 'telegram',
    name: 'Telegram',
    description: 'Cloud-based instant messaging and voice-over-IP service.',
    url: 'https://telegram.org',
    category: 'Communication',
    tags: ['chat', 'messaging', 'voice'],
    auth_method: ['basic_auth'],
    metadata: {
      fields: [
        { name: 'Phone', type: 'string' },
        { name: 'Username', type: 'string' },
      ],
    },
    two_fa: { has_totp: true, has_backup_codes: true },
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    description: 'Cross-platform messaging and voice-over-IP service by Meta.',
    url: 'https://www.whatsapp.com',
    category: 'Communication',
    tags: ['chat', 'messaging', 'meta'],
    auth_method: ['basic_auth'],
    metadata: {
      fields: [
        { name: 'Phone', type: 'string' },
      ],
    },
    two_fa: { has_totp: true, has_backup_codes: false },
  },
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'AI research and deployment platform behind ChatGPT and GPT models.',
    url: 'https://openai.com',
    category: 'AI & ML',
    tags: ['ai', 'chatgpt', 'machine-learning'],
    auth_method: ['api_key', 'google_oauth'],
    metadata: {
      fields: [
        { name: 'Email', type: 'string' },
        { name: 'APIKey', type: 'string', feature: 'encryption' },
      ],
    },
    two_fa: { has_totp: true, has_backup_codes: true },
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    description: 'AI safety company behind the Claude chatbot and API.',
    url: 'https://www.anthropic.com',
    category: 'AI & ML',
    tags: ['ai', 'claude', 'machine-learning'],
    auth_method: ['api_key', 'google_oauth'],
    metadata: {
      fields: [
        { name: 'Email', type: 'string' },
        { name: 'APIKey', type: 'string', feature: 'encryption' },
      ],
    },
    two_fa: { has_totp: true, has_backup_codes: true },
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Team communication and collaboration platform.',
    url: 'https://slack.com',
    category: 'Communication',
    tags: ['chat', 'team', 'collaboration'],
    auth_method: ['basic_auth', 'google_oauth', 'apple_oauth'],
    metadata: {
      fields: [
        { name: 'Email', type: 'string' },
        { name: 'Password', type: 'string', feature: 'encryption' },
        { name: 'Workspace', type: 'string' },
      ],
    },
    two_fa: { has_totp: true, has_backup_codes: true },
  },
  {
    id: 'zoom',
    name: 'Zoom',
    description: 'Video conferencing and online meeting platform.',
    url: 'https://zoom.us',
    category: 'Communication',
    tags: ['video', 'meeting', 'conferencing'],
    auth_method: ['basic_auth', 'google_oauth'],
    metadata: {
      fields: [
        { name: 'Email', type: 'string' },
        { name: 'Password', type: 'string', feature: 'encryption' },
      ],
    },
    two_fa: { has_totp: true, has_backup_codes: true },
  },
  {
    id: 'vercel',
    name: 'Vercel',
    description: 'Cloud platform for frontend deployment and serverless functions.',
    url: 'https://vercel.com',
    category: 'Developer',
    tags: ['dev', 'cloud', 'deployment'],
    auth_method: ['github_oauth', 'gitlab_oauth', 'basic_auth'],
    metadata: {
      fields: [
        { name: 'Email', type: 'string' },
        { name: 'Password', type: 'string', feature: 'encryption' },
        { name: 'AccessToken', type: 'string', feature: 'encryption' },
      ],
    },
    two_fa: { has_totp: true, has_backup_codes: true },
  },
  {
    id: 'digitalocean',
    name: 'DigitalOcean',
    description: 'Cloud infrastructure provider for developers and businesses.',
    url: 'https://www.digitalocean.com',
    category: 'Developer',
    tags: ['cloud', 'hosting', 'devops'],
    auth_method: ['basic_auth', 'api_key', 'google_oauth'],
    metadata: {
      fields: [
        { name: 'Email', type: 'string' },
        { name: 'Password', type: 'string', feature: 'encryption' },
        { name: 'APIKey', type: 'string', feature: 'encryption' },
      ],
    },
    two_fa: { has_totp: true, has_backup_codes: true },
  },
  {
    id: 'cloudflare',
    name: 'Cloudflare',
    description: 'Web security, CDN and DNS services.',
    url: 'https://www.cloudflare.com',
    category: 'Developer',
    tags: ['cdn', 'security', 'dns'],
    auth_method: ['basic_auth', 'api_key'],
    metadata: {
      fields: [
        { name: 'Email', type: 'string' },
        { name: 'Password', type: 'string', feature: 'encryption' },
        { name: 'APIKey', type: 'string', feature: 'encryption' },
      ],
    },
    two_fa: { has_totp: true, has_backup_codes: true },
  },
  {
    id: 'wordpress',
    name: 'WordPress',
    description: 'Open-source content management system for websites and blogs.',
    url: 'https://wordpress.com',
    category: 'Developer',
    tags: ['cms', 'blog', 'website'],
    auth_method: ['basic_auth'],
    metadata: {
      fields: [
        { name: 'Username', type: 'string' },
        { name: 'Password', type: 'string', feature: 'encryption' },
      ],
    },
    two_fa: { has_totp: true, has_backup_codes: true },
  },
  {
    id: 'binance',
    name: 'Binance',
    description: 'Global cryptocurrency exchange and blockchain ecosystem.',
    url: 'https://www.binance.com',
    category: 'Crypto & Web3',
    tags: ['crypto', 'exchange', 'blockchain'],
    auth_method: ['basic_auth', 'google_oauth'],
    metadata: {
      fields: [
        { name: 'Email', type: 'string' },
        { name: 'Password', type: 'string', feature: 'encryption' },
      ],
    },
    two_fa: { has_totp: true, has_backup_codes: true },
  },
  {
    id: 'coinbase',
    name: 'Coinbase',
    description: 'Cryptocurrency exchange and wallet platform.',
    url: 'https://www.coinbase.com',
    category: 'Finance',
    tags: ['crypto', 'exchange', 'wallet'],
    auth_method: ['basic_auth', 'google_oauth'],
    metadata: {
      fields: [
        { name: 'Email', type: 'string' },
        { name: 'Password', type: 'string', feature: 'encryption' },
      ],
    },
    two_fa: { has_totp: true, has_backup_codes: true },
  },
  {
    id: 'wise',
    name: 'Wise',
    description: 'International money transfer and multi-currency account service.',
    url: 'https://wise.com',
    category: 'Finance',
    tags: ['transfer', 'money', 'currency'],
    auth_method: ['basic_auth'],
    metadata: {
      fields: [
        { name: 'Email', type: 'string' },
        { name: 'Password', type: 'string', feature: 'encryption' },
      ],
    },
    two_fa: { has_totp: true, has_backup_codes: true },
  },
  {
    id: 'canva',
    name: 'Canva',
    description: 'Graphic design and visual content creation platform.',
    url: 'https://www.canva.com',
    category: 'Design',
    tags: ['design', 'graphics', 'templates'],
    auth_method: ['basic_auth', 'google_oauth', 'facebook_oauth'],
    metadata: {
      fields: [
        { name: 'Email', type: 'string' },
        { name: 'Password', type: 'string', feature: 'encryption' },
      ],
    },
    two_fa: { has_totp: true, has_backup_codes: true },
  },
  {
    id: 'trello',
    name: 'Trello',
    description: 'Visual project management and task organization tool.',
    url: 'https://trello.com',
    category: 'Productivity',
    tags: ['project', 'task', 'kanban'],
    auth_method: ['basic_auth', 'google_oauth'],
    metadata: {
      fields: [
        { name: 'Email', type: 'string' },
        { name: 'Password', type: 'string', feature: 'encryption' },
      ],
    },
    two_fa: { has_totp: true, has_backup_codes: true },
  },
  {
    id: 'asana',
    name: 'Asana',
    description: 'Work management platform for team collaboration and project tracking.',
    url: 'https://asana.com',
    category: 'Productivity',
    tags: ['project', 'team', 'task'],
    auth_method: ['basic_auth', 'google_oauth'],
    metadata: {
      fields: [
        { name: 'Email', type: 'string' },
        { name: 'Password', type: 'string', feature: 'encryption' },
      ],
    },
    two_fa: { has_totp: true, has_backup_codes: true },
  },
  {
    id: 'airbnb',
    name: 'Airbnb',
    description: 'Online marketplace for lodging, homestays and travel experiences.',
    url: 'https://www.airbnb.com',
    category: 'Travel',
    tags: ['travel', 'booking', 'lodging'],
    auth_method: ['basic_auth', 'google_oauth'],
    metadata: {
      fields: [
        { name: 'Email', type: 'string' },
        { name: 'Password', type: 'string', feature: 'encryption' },
      ],
    },
    two_fa: { has_totp: true, has_backup_codes: true },
  },
  {
    id: 'uber',
    name: 'Uber',
    description: 'Ride-hailing and food delivery platform.',
    url: 'https://www.uber.com',
    category: 'Travel',
    tags: ['ride', 'transport', 'food'],
    auth_method: ['basic_auth', 'google_oauth'],
    metadata: {
      fields: [
        { name: 'Phone', type: 'string' },
        { name: 'Email', type: 'string' },
        { name: 'Password', type: 'string', feature: 'encryption' },
      ],
    },
    two_fa: { has_totp: true, has_backup_codes: true },
  },
  {
    id: 'vimeo',
    name: 'Vimeo',
    description: 'Video hosting and streaming platform for professionals.',
    url: 'https://vimeo.com',
    category: 'Entertainment',
    tags: ['video', 'streaming', 'hosting'],
    auth_method: ['basic_auth', 'google_oauth'],
    metadata: {
      fields: [
        { name: 'Email', type: 'string' },
        { name: 'Password', type: 'string', feature: 'encryption' },
      ],
    },
    two_fa: { has_totp: true, has_backup_codes: true },
  },
  {
    id: 'soundcloud',
    name: 'SoundCloud',
    description: 'Music streaming and audio distribution platform.',
    url: 'https://soundcloud.com',
    category: 'Entertainment',
    tags: ['music', 'audio', 'streaming'],
    auth_method: ['basic_auth', 'google_oauth', 'facebook_oauth'],
    metadata: {
      fields: [
        { name: 'Email', type: 'string' },
        { name: 'Password', type: 'string', feature: 'encryption' },
      ],
    },
    two_fa: { has_totp: true, has_backup_codes: true },
  },
];

/**
 * Helper: Get a service template by ID.
 */
export function getServiceTemplateById(id: string): ServiceTemplate | undefined {
  return SERVICES.find((s) => s.id === id);
}