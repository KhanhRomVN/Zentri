import React from 'react';
import { useTranslation } from 'react-i18next';
import { Languages, Check, ChevronDown } from 'lucide-react';
import { US, VN } from 'country-flag-icons/react/3x2';
import { Dropdown, DropdownTrigger, DropdownContent, DropdownItem } from './dropdown';
import { cn } from '../../../shared/utils/cn';

interface LanguageSwitcherProps {
  variant?: 'sidebar' | 'field';
  isCollapsed?: boolean;
  className?: string;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  variant = 'field',
  isCollapsed = false,
  className,
}) => {
  const { i18n, t } = useTranslation();

  const languages = [
    { code: 'en', name: 'English', icon: US },
    { code: 'vi', name: 'Tiếng Việt', icon: VN },
  ];

  const currentLanguage = languages.find((lang) => lang.code === i18n.language) || languages[0];

  const changeLanguage = (code: string) => {
    i18n.changeLanguage(code);
    // Also save to localStorage to be consistent with existing settings pattern if needed,
    // though i18next-browser-languagedetector usually handles this.
    localStorage.setItem('i18nextLng', code);
  };

  if (variant === 'sidebar') {
    return (
      <Dropdown position={isCollapsed ? 'right-bottom' : 'bottom-left'}>
        <DropdownTrigger
          className={cn(
            'p-1.5 text-muted-foreground hover:text-primary hover:bg-muted rounded-md transition-colors',
            className,
          )}
          title="Change Language"
        >
          <div className="flex items-center gap-2">
            <Languages className="w-5 h-5" />
            {!isCollapsed && <span className="text-sm font-medium">{currentLanguage.name}</span>}
          </div>
        </DropdownTrigger>
        <DropdownContent className="w-40 bg-card/95 backdrop-blur-md border border-border/50">
          {languages.map((lang) => {
            const Icon = lang.icon;
            return (
              <DropdownItem
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                className={cn(
                  'hover:bg-primary/10 transition-colors',
                  i18n.language === lang.code ? 'text-primary bg-primary/5' : '',
                )}
                leftIcon={<Icon className="w-4 h-3" />}
                rightIcon={i18n.language === lang.code ? <Check className="w-4 h-4" /> : undefined}
              >
                {lang.name}
              </DropdownItem>
            );
          })}
        </DropdownContent>
      </Dropdown>
    );
  }

  // Field variant for Settings page
  const CurrentIcon = currentLanguage.icon;

  return (
    <Dropdown position="bottom-left">
      <DropdownTrigger asChild>
        <button
          className={cn(
            'w-full h-11 rounded-xl border border-border bg-input-background px-4 text-[13px] flex items-center justify-between group hover:border-primary/50 transition-all cursor-pointer',
            className,
          )}
        >
          <div className="flex items-center gap-3">
            <CurrentIcon className="w-4 h-3" />
            <span className="font-medium text-foreground">{currentLanguage.name}</span>
          </div>
          <ChevronDown className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary/50 transition-colors" />
        </button>
      </DropdownTrigger>
      <DropdownContent className="w-[--radix-dropdown-menu-trigger-width] bg-card/95 backdrop-blur-md border border-border/50">
        {languages.map((lang) => {
          const Icon = lang.icon;
          return (
            <DropdownItem
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
              className={cn(
                'hover:bg-primary/10 transition-colors py-3',
                i18n.language === lang.code ? 'text-primary bg-primary/5' : '',
              )}
              leftIcon={<Icon className="w-4 h-3" />}
              rightIcon={i18n.language === lang.code ? <Check className="w-4 h-4" /> : undefined}
            >
              {lang.name}
            </DropdownItem>
          );
        })}
      </DropdownContent>
    </Dropdown>
  );
};

export default LanguageSwitcher;
