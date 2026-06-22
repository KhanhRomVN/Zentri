import { Globe, ShoppingCart, Cpu, Gamepad2, Code, Coins, Film, Cloud, Mail, Briefcase } from 'lucide-react';

export interface CategoryItem {
  id: string;
  title: string;
  icon: any;
  description: string;
}

export const CATEGORIES: CategoryItem[] = [
  { id: 'social-media', title: 'Social Media', icon: Globe, description: 'Mạng xã hội, diễn đàn, cộng đồng trực tuyến' },
  { id: 'ai-ml', title: 'AI & ML', icon: Cpu, description: 'Trí tuệ nhân tạo, machine learning, chatbot' },
  { id: 'email', title: 'Email', icon: Mail, description: 'Dịch vụ email, webmail, email client' },
  { id: 'cloud-productivity', title: 'Cloud & Productivity', icon: Cloud, description: 'Lưu trữ đám mây, công cụ văn phòng, collaboration' },
  { id: 'e-commerce', title: 'E-commerce', icon: ShoppingCart, description: 'Sàn thương mại điện tử, mua sắm trực tuyến' },
  { id: 'finance', title: 'Finance', icon: Coins, description: 'Ngân hàng, thanh toán, ví điện tử, crypto' },
  { id: 'gaming', title: 'Gaming', icon: Gamepad2, description: 'Game, nền tảng phân phối game, esports' },
  { id: 'dev-tools', title: 'Dev Tools', icon: Code, description: 'Công cụ lập trình, Git hosting, DevOps, registry' },
  { id: 'crypto-web3', title: 'Crypto & Web3', icon: Coins, description: 'Sàn giao dịch crypto, ví Web3, NFT marketplace' },
  { id: 'entertainment', title: 'Entertainment', icon: Film, description: 'Streaming video, nhạc, podcast, nội dung số' },
  { id: 'business', title: 'Business', icon: Briefcase, description: 'Doanh nghiệp, CRM, quản lý dự án, recruitment' },
  { id: 'other', title: 'Other', icon: Globe, description: 'Các dịch vụ khác không thuộc danh mục trên' },
];