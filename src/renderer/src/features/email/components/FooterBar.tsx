import { FC, ReactNode } from 'react';

interface FooterBarProps {
  children?: ReactNode;
}

const FooterBar: FC<FooterBarProps> = ({ children }) => {
  return (
    <footer className="h-8 shrink-0 border-t border-border flex items-center justify-between px-4 bg-background/80 backdrop-blur-xl sticky bottom-0 z-30 transition-all duration-500">
      <span className="text-text-secondary text-xs font-medium">Zentri</span>
      <div className="flex items-center gap-2">{children}</div>
    </footer>
  );
};

export default FooterBar;