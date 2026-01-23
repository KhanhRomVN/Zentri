// Service templates với thông tin đầy đủ
export interface ServiceTemplate {
  service_name: string
  service_type: string
  service_url?: string
  icon?: string
}

export const SERVICE_TEMPLATES: ServiceTemplate[] = [
  // Social Media
  {
    service_name: 'Facebook',
    service_type: 'social_media',
    service_url: 'https://facebook.com',
    icon: '📱'
  },
  {
    service_name: 'Twitter',
    service_type: 'social_media',
    service_url: 'https://twitter.com',
    icon: '📱'
  },
  {
    service_name: 'Instagram',
    service_type: 'social_media',
    service_url: 'https://instagram.com',
    icon: '📱'
  },
  {
    service_name: 'LinkedIn',
    service_type: 'social_media',
    service_url: 'https://linkedin.com',
    icon: '📱'
  },
  {
    service_name: 'TikTok',
    service_type: 'social_media',
    service_url: 'https://tiktok.com',
    icon: '📱'
  },

  // Communication
  {
    service_name: 'Slack',
    service_type: 'communication',
    service_url: 'https://slack.com',
    icon: '💬'
  },
  {
    service_name: 'Discord',
    service_type: 'communication',
    service_url: 'https://discord.com',
    icon: '💬'
  },
  {
    service_name: 'Telegram',
    service_type: 'communication',
    service_url: 'https://telegram.org',
    icon: '💬'
  },
  {
    service_name: 'WhatsApp',
    service_type: 'communication',
    service_url: 'https://web.whatsapp.com',
    icon: '💬'
  },

  // Developer
  {
    service_name: 'GitHub',
    service_type: 'developer',
    service_url: 'https://github.com',
    icon: '👨‍💻'
  },
  {
    service_name: 'GitLab',
    service_type: 'developer',
    service_url: 'https://gitlab.com',
    icon: '👨‍💻'
  },
  {
    service_name: 'Stack Overflow',
    service_type: 'developer',
    service_url: 'https://stackoverflow.com',
    icon: '👨‍💻'
  },
  { service_name: 'npm', service_type: 'developer', service_url: 'https://npmjs.com', icon: '👨‍💻' },

  // Cloud Storage
  {
    service_name: 'Google Drive',
    service_type: 'cloud_storage',
    service_url: 'https://drive.google.com',
    icon: '☁️'
  },
  {
    service_name: 'Dropbox',
    service_type: 'cloud_storage',
    service_url: 'https://dropbox.com',
    icon: '☁️'
  },
  {
    service_name: 'OneDrive',
    service_type: 'cloud_storage',
    service_url: 'https://onedrive.live.com',
    icon: '☁️'
  },

  // AI & SaaS
  {
    service_name: 'ChatGPT',
    service_type: 'ai_saas',
    service_url: 'https://chat.openai.com',
    icon: '🤖'
  },
  { service_name: 'Claude', service_type: 'ai_saas', service_url: 'https://claude.ai', icon: '🤖' },
  { service_name: 'Notion', service_type: 'ai_saas', service_url: 'https://notion.so', icon: '🤖' },
  { service_name: 'Figma', service_type: 'ai_saas', service_url: 'https://figma.com', icon: '🤖' },

  // Productivity
  {
    service_name: 'Trello',
    service_type: 'productivity_tool',
    service_url: 'https://trello.com',
    icon: '📊'
  },
  {
    service_name: 'Asana',
    service_type: 'productivity_tool',
    service_url: 'https://asana.com',
    icon: '📊'
  },
  {
    service_name: 'Monday',
    service_type: 'productivity_tool',
    service_url: 'https://monday.com',
    icon: '📊'
  },

  // Payment & Finance
  {
    service_name: 'PayPal',
    service_type: 'payment_finance',
    service_url: 'https://paypal.com',
    icon: '💳'
  },
  {
    service_name: 'Stripe',
    service_type: 'payment_finance',
    service_url: 'https://stripe.com',
    icon: '💳'
  },

  // E-commerce
  {
    service_name: 'Amazon',
    service_type: 'ecommerce',
    service_url: 'https://amazon.com',
    icon: '🛒'
  },
  { service_name: 'eBay', service_type: 'ecommerce', service_url: 'https://ebay.com', icon: '🛒' },
  {
    service_name: 'Shopify',
    service_type: 'ecommerce',
    service_url: 'https://shopify.com',
    icon: '🛒'
  },

  // Entertainment
  {
    service_name: 'Netflix',
    service_type: 'entertainment',
    service_url: 'https://netflix.com',
    icon: '🎵'
  },
  {
    service_name: 'Spotify',
    service_type: 'entertainment',
    service_url: 'https://spotify.com',
    icon: '🎵'
  },
  {
    service_name: 'YouTube',
    service_type: 'entertainment',
    service_url: 'https://youtube.com',
    icon: '🎵'
  },

  // Hosting & Domain
  {
    service_name: 'GoDaddy',
    service_type: 'hosting_domain',
    service_url: 'https://godaddy.com',
    icon: '🌐'
  },
  {
    service_name: 'Namecheap',
    service_type: 'hosting_domain',
    service_url: 'https://namecheap.com',
    icon: '🌐'
  },
  {
    service_name: 'AWS',
    service_type: 'hosting_domain',
    service_url: 'https://aws.amazon.com',
    icon: '🌐'
  },
  {
    service_name: 'DigitalOcean',
    service_type: 'hosting_domain',
    service_url: 'https://digitalocean.com',
    icon: '🌐'
  },

  // Security & VPN
  {
    service_name: 'NordVPN',
    service_type: 'security_vpn',
    service_url: 'https://nordvpn.com',
    icon: '🔒'
  },
  {
    service_name: '1Password',
    service_type: 'security_vpn',
    service_url: 'https://1password.com',
    icon: '🔒'
  },
  {
    service_name: 'LastPass',
    service_type: 'security_vpn',
    service_url: 'https://lastpass.com',
    icon: '🔒'
  },

  // Gaming
  {
    service_name: 'Steam',
    service_type: 'gaming',
    service_url: 'https://store.steampowered.com',
    icon: '🎮'
  },
  {
    service_name: 'Epic Games',
    service_type: 'gaming',
    service_url: 'https://epicgames.com',
    icon: '🎮'
  },

  // Travel
  {
    service_name: 'Booking.com',
    service_type: 'travel_transport',
    service_url: 'https://booking.com',
    icon: '✈️'
  },
  {
    service_name: 'Airbnb',
    service_type: 'travel_transport',
    service_url: 'https://airbnb.com',
    icon: '✈️'
  },

  // Forum & Community
  {
    service_name: 'Reddit',
    service_type: 'forum_community',
    service_url: 'https://reddit.com',
    icon: '👥'
  }
]
