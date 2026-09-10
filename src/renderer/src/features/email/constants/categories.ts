import { Globe, ShoppingCart, Cpu, Gamepad2, Code, Coins, Film, Cloud, Mail, Briefcase, MessageCircle, Palette, Plane } from 'lucide-react';

export interface CategoryItem {
  id: string;
  title: string;
  icon: any;
  description: string;
}

export const CATEGORIES: CategoryItem[] = [
  { id: 'social-media', title: 'Social Media', icon: Globe, description: 'Social networks, forums, online communities' },
  { id: 'ai-ml', title: 'AI & ML', icon: Cpu, description: 'Artificial intelligence, machine learning, chatbots' },
  { id: 'email', title: 'Email', icon: Mail, description: 'Email services, webmail, email clients' },
  { id: 'productivity', title: 'Productivity', icon: Cloud, description: 'Cloud storage, office tools, collaboration' },
  { id: 'e-commerce', title: 'E-commerce', icon: ShoppingCart, description: 'Online marketplaces, online shopping' },
  { id: 'shopping', title: 'Shopping', icon: ShoppingCart, description: 'Retail stores, marketplaces, and consumer goods' },
  { id: 'finance', title: 'Finance', icon: Coins, description: 'Banking, payments, e-wallets, crypto' },
  { id: 'gaming', title: 'Gaming', icon: Gamepad2, description: 'Games, game distribution platforms, esports' },
  { id: 'developer', title: 'Developer', icon: Code, description: 'Programming tools, Git hosting, DevOps, registries' },
  { id: 'crypto-web3', title: 'Crypto & Web3', icon: Coins, description: 'Crypto exchanges, Web3 wallets, NFT marketplaces' },
  { id: 'entertainment', title: 'Entertainment', icon: Film, description: 'Video streaming, music, podcasts, digital content' },
  { id: 'professional', title: 'Professional', icon: Briefcase, description: 'Business, CRM, project management, recruitment' },
  { id: 'communication', title: 'Communication', icon: MessageCircle, description: 'Messaging, voice, and video communication platforms' },
  { id: 'design', title: 'Design', icon: Palette, description: 'Design tools, prototyping, and creative software' },
  { id: 'travel', title: 'Travel', icon: Plane, description: 'Travel booking, transportation, and accommodation' },
  { id: 'other', title: 'Other', icon: Globe, description: 'Other services not listed above' },
];