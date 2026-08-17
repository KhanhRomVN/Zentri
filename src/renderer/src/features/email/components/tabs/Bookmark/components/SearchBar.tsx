/**
 * ------------------------------------------------------------------
 * SearchBar
 * ------------------------------------------------------------------
 * Reusable search input for the Bookmark tab. Styled with a search
 * icon and consistent border/background matching the design system.
 *
 * Main features:
 * - Search icon with absolute positioning
 * - Controlled input with external value/onChange
 * ------------------------------------------------------------------
 */

// ─── Imports ────────────────────────────────────────────────────────────
// ── React ──
import { FC } from 'react';

// ── UI ──
import { Search } from 'lucide-react';

// ─── Interfaces ─────────────────────────────────────────────────────────
interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

// ─── Component ──────────────────────────────────────────────────────────
const SearchBar: FC<SearchBarProps> = ({ value, onChange }) => {
  return (
    <div className="relative flex items-center w-full h-[29px] bg-input-background border border-border rounded-md transition-all duration-300">
      <Search className="absolute left-3 w-4 h-4 text-muted-foreground/50" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search bookmarks..."
        className="w-full h-full pl-10 pr-3 bg-transparent text-sm text-foreground placeholder:text-text-secondary outline-none rounded-md"
      />
    </div>
  );
};

export default SearchBar;