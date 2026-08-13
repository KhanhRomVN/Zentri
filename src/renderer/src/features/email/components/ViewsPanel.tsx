/**
 * ------------------------------------------------------------------
 * ViewsPanel
 * ------------------------------------------------------------------
 * Collapsible panel for managing saved filter views in the Email
 * Manager. Supports creating, editing, deleting, and selecting
 * saved views that persist filter configurations.
 *
 * Main features:
 * - Expand/collapse toggle with view count badge
 * - Create, edit, and delete saved views
 * - Select a view to apply its filters to the table
 * - Integrates with FilterModal for view configuration
 * ------------------------------------------------------------------
 */

// ─── Imports ────────────────────────────────────────────────────────────
// ── React ──
import React, { useState, useEffect } from 'react';

// ── UI ──
import { Plus, ChevronRight, ChevronDown, Filter, Trash2, Edit2, Check } from 'lucide-react';

// ── UI Components ──
import { Button } from '../../../components/ui/Button';

// ── Utils ──
import { cn } from '../../../shared/lib/utils';

// ── Services ──
import ViewsService from '../services/api.service';

// ── Types ──
import FilterModal from './modals/FilterModal';
import { AVAILABLE_FIELDS } from './modals/FilterModal/types';
import type { SavedView, FilterCard } from './modals/FilterModal/types';

// ─── Interfaces ─────────────────────────────────────────────────────────
interface ViewsPanelProps {
  onViewSelect: (view: SavedView | null) => void;
  selectedViewId: string | null;
  className?: string;
}

// ─── Component ──────────────────────────────────────────────────────────
export const ViewsPanel: React.FC<ViewsPanelProps> = ({
  onViewSelect,
  selectedViewId,
  className,
}) => {
  // ── State ──
  const [isExpanded, setIsExpanded] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [views, setViews] = useState<SavedView[]>([]);
  const [editingView, setEditingView] = useState<SavedView | null>(null);

  // ── Effects ──
  useEffect(() => {
    loadViews();
  }, []);

  // ── Callbacks ──
  const loadViews = async () => {
    const loadedViews = await ViewsService.getAllViews();
    setViews(loadedViews);
  };

  // ── Handlers ──
  const handleSaveView = async (name: string, filters: FilterCard[]) => {
    try {
      if (editingView) {
        await ViewsService.updateView(editingView.id, { name, filters });
      } else {
        await ViewsService.createView(name, filters);
      }

      await loadViews();
      setEditingView(null);
    } catch (error) {
      console.error('[ViewsPanel] Failed to save view:', error);
      alert('Failed to save view');
    }
  };

  const handleDeleteView = async (viewId: string, event: React.MouseEvent) => {
    event.stopPropagation();

    if (!confirm('Are you sure you want to delete this view?')) {
      return;
    }

    try {
      await ViewsService.deleteView(viewId);
      await loadViews();

      if (selectedViewId === viewId) {
        onViewSelect(null);
      }
    } catch (error) {
      console.error('[ViewsPanel] Failed to delete view:', error);
      alert('Failed to delete view');
    }
  };

  const handleEditView = (view: SavedView, event: React.MouseEvent) => {
    event.stopPropagation();
    setEditingView(view);
    setIsModalOpen(true);
  };

  const handleViewClick = (view: SavedView) => {
    if (selectedViewId === view.id) {
      onViewSelect(null);
    } else {
      onViewSelect(view);
    }
  };

  // ── Render ──
  return (
    <>
      <div className={cn('border-b border-border bg-card-background/30 transition-all', className)}>
        <div className="px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold text-foreground">Views</span>
              {views.length > 0 && (
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {views.length}
                </span>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setEditingView(null);
              setIsModalOpen(true);
            }}
            className="h-7 px-2 text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
          </Button>
        </div>

        {isExpanded && (
          <div className="px-4 pb-3 space-y-1">
            {views.length === 0 ? (
              <div className="text-center py-6 space-y-2">
                <p className="text-xs text-muted-foreground">No saved views yet</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(true)}
                  className="h-7 text-xs"
                >
                  <Plus className="w-3 h-3 mr-1.5" />
                  Create First View
                </Button>
              </div>
            ) : (
              views.map((view) => {
                const isSelected = selectedViewId === view.id;
                return (
                  <div
                    key={view.id}
                    onClick={() => handleViewClick(view)}
                    className={cn(
                      'group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-all',
                      isSelected
                        ? 'bg-primary/10 border border-primary/20'
                        : 'hover:bg-muted/50 border border-transparent',
                    )}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {isSelected && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p
                          className={cn(
                            'text-sm font-medium truncate',
                            isSelected ? 'text-primary' : 'text-foreground',
                          )}
                        >
                          {view.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {view.filters.length} condition{view.filters.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => handleEditView(view, e)}
                        className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteView(view.id, e)}
                        className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      <FilterModal
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingView(null);
        }}
        onSave={handleSaveView}
        availableFields={AVAILABLE_FIELDS}
        initialFilters={editingView?.filters}
        initialName={editingView?.name}
      />
    </>
  );
};

export default ViewsPanel;
