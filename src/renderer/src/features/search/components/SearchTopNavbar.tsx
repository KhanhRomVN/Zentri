import { FC } from 'react';
import { Breadcrumb, BreadcrumbItem } from '../../../shared/components/ui/breadcumb';
import { Search as SearchIcon, Table, LayoutGrid } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SmartView } from '../types/search';

interface SearchTopNavbarProps {
  selectedView: SmartView | null;
  onReset: () => void;
}

const SearchTopNavbar: FC<SearchTopNavbarProps> = ({ selectedView, onReset }) => {
  const { t } = useTranslation();

  return (
    <header className="h-14 shrink-0 border-b border-border flex items-center justify-between px-4 bg-background/80 backdrop-blur-xl sticky top-0 z-30 transition-all duration-500">
      <div className="flex items-center gap-4">
        <Breadcrumb className="mb-0" size={120}>
          <BreadcrumbItem
            icon={SearchIcon}
            className="hover:text-foreground text-muted-foreground/50 transition-colors"
            text={''}
            onClick={onReset}
          />
          <BreadcrumbItem text={t('common.search')} onClick={onReset} />
          {selectedView && (
            <BreadcrumbItem
              icon={selectedView.domain ? undefined : Table}
              text={selectedView.name}
            />
          )}
          {!selectedView && (
            <BreadcrumbItem
              icon={LayoutGrid}
              text="Smart Views"
              className="text-muted-foreground/50"
            />
          )}
        </Breadcrumb>
      </div>
    </header>
  );
};

export default SearchTopNavbar;
