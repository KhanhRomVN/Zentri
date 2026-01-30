export interface Service {
  id: string;
  name: string;
  username: string;
  websiteUrl: string;
  icon: string; // url or name
}

export const mockServices: Service[] = [
  {
    id: '1',
    name: 'Facebook',
    username: 'khanh.dev',
    websiteUrl: 'https://facebook.com',
    icon: 'facebook',
  },
  {
    id: '2',
    name: 'Netflix',
    username: 'khanh.movie',
    websiteUrl: 'https://netflix.com',
    icon: 'netflix',
  },
  {
    id: '3',
    name: 'Spotify',
    username: 'khanh.music',
    websiteUrl: 'https://spotify.com',
    icon: 'spotify',
  },
];
