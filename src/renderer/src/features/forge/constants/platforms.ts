/**
 * ------------------------------------------------------------------
 * FORGE Platform Constants
 * ------------------------------------------------------------------
 * Danh sách nền tảng mặc định khi DB chưa có services.
 * Mapping với bảng services trong database.
 * ------------------------------------------------------------------
 */

export interface PlatformDefault {
  id: string;
  name: string;
  oauth: string;
  color: string;
}

export const DEFAULT_PLATFORMS: PlatformDefault[] = [
  { id: 'gmail', name: 'Gmail', oauth: 'Email OAuth', color: '#ea4335' },
  { id: 'outlook', name: 'Outlook', oauth: 'Email OAuth', color: '#3aa0f3' },
  { id: 'github', name: 'GitHub', oauth: 'OAuth2 App', color: '#8b8f98' },
  { id: 'facebook', name: 'Facebook', oauth: 'Email OAuth', color: '#3b6cf6' },
  { id: 'instagram', name: 'Instagram', oauth: 'Email OAuth', color: '#e1417a' },
  { id: 'tiktok', name: 'TikTok', oauth: 'Email/Phone', color: '#3fe0d0' },
  { id: 'discord', name: 'Discord', oauth: 'Email OAuth', color: '#7289da' },
  { id: 'reddit', name: 'Reddit', oauth: 'Email OAuth', color: '#ff6b35' },
];

export const getPlatformColor = (platformId: string): string => {
  const found = DEFAULT_PLATFORMS.find((p) => p.id === platformId);
  return found?.color || '#6b7280';
};

export const getPlatformInitials = (name: string): string => {
  return name.slice(0, 2).toUpperCase();
};