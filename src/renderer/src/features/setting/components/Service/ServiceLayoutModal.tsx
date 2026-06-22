import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { X, GripVertical, Plus } from 'lucide-react';
import { cn } from '@renderer/shared/lib/utils';

export interface LayoutField {
  field_name: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ServiceLayoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (layout: LayoutField[]) => void;
  fields: { name: string; type: string; feature?: string }[];
  initialLayout?: LayoutField[];
}

const GRID_COLS = 4;

const ServiceLayoutModal: React.FC<ServiceLayoutModalProps> = ({ isOpen, onClose, onSave, fields, initialLayout }) => {
  // Build initial layout from fields if no saved layout
  const [layout, setLayout] = useState<LayoutField[]>(() => {
    if (initialLayout && initialLayout.length > 0) return initialLayout;
    return fields.map((f, i) => ({
      field_name: f.name,
      x: i % GRID_COLS,
      y: Math.floor(i / GRID_COLS),
      width: 1,
      height: 1,
    }));
  });

  // Fields not yet in layout
  const availableFields = fields.filter((f) => !layout.some((l) => l.field_name === f.name));

  const onDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;

    // Dragging from available list to grid
    if (source.droppableId === 'available' && destination.droppableId === 'grid') {
      const field = availableFields.find((f) => f.name === draggableId);
      if (field) {
        const dropIndex = destination.index;
        const newItem: LayoutField = {
          field_name: field.name,
          x: dropIndex % GRID_COLS,
          y: Math.floor(layout.length / GRID_COLS),
          width: 1,
          height: 1,
        };
        setLayout((prev) => [...prev, newItem]);
      }
    }
    // Reordering within grid
    else if (source.droppableId === 'grid' && destination.droppableId === 'grid') {
      const items = Array.from(layout);
      const [reordered] = items.splice(source.index, 1);
      items.splice(destination.index, 0, reordered);
      // Recalculate positions
      const updated = items.map((item, i) => ({
        ...item,
        x: i % GRID_COLS,
        y: Math.floor(i / GRID_COLS),
      }));
      setLayout(updated);
    }
    // Dragging from grid back to available (remove)
    else if (source.droppableId === 'grid' && destination.droppableId === 'available') {
      setLayout((prev) => prev.filter((l) => l.field_name !== draggableId));
    }
  };

  const removeFromLayout = (fieldName: string) => {
    setLayout((prev) => prev.filter((l) => l.field_name !== fieldName));
  };

  const handleSave = () => {
    onSave(layout);
    onClose();
  };

  if (!isOpen) return null;

  const getFieldTypeLabel = (name: string) => {
    const f = fields.find((f) => f.name === name);
    return f?.type?.slice(0, 3).toUpperCase() || 'STR';
  };

  const getFeatureColor = (name: string) => {
    const f = fields.find((f) => f.name === name);
    if (f?.feature === 'encryption') return 'border-amber-500/30 bg-amber-500/5';
    if (f?.feature === 'totp') return 'border-emerald-500/30 bg-emerald-500/5';
    if (f?.feature === 'backup_codes') return 'border-blue-500/30 bg-blue-500/5';
    if (f?.feature === 'url') return 'border-purple-500/30 bg-purple-500/5';
    return 'border-border/50 bg-muted/20';
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="fixed inset-0 z-[100] flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-4xl mx-4 h-[80vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 shrink-0">
            <div>
              <h3 className="text-sm font-bold text-foreground">Layout Configuration</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Drag fields from the left panel to the grid to customize your service form layout</p>
            </div>
            <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"><X className="w-4 h-4" /></button>
          </div>

          {/* Body: 2 panels */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left Panel — Available Fields */}
            <div className="w-[260px] border-r border-border/50 flex flex-col shrink-0 bg-background/30">
              <div className="px-4 py-3 border-b border-border/30">
                <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/60">Available Fields</span>
              </div>
              <Droppable droppableId="available" isDropDisabled={false}>
                {(provided, snapshot) => (
                  <div ref={provided.innerRef} {...provided.droppableProps} className={cn('flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1', snapshot.isDraggingOver && 'bg-primary/5')}>
                    {availableFields.map((field, index) => (
                      <Draggable key={field.name} draggableId={field.name} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={cn('flex items-center gap-2 px-3 py-2.5 rounded-lg border transition-all', getFeatureColor(field.name), snapshot.isDragging && 'shadow-lg ring-1 ring-primary/30')}
                          >
                            <GripVertical className="w-3.5 h-3.5 text-muted-foreground/30 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-bold truncate">{field.name}</div>
                              <div className="text-[9px] uppercase tracking-wider text-muted-foreground/50">{field.type}</div>
                            </div>
                            <Plus className="w-3.5 h-3.5 text-muted-foreground/30" />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    {availableFields.length === 0 && (
                      <div className="text-center py-8 text-xs text-muted-foreground/30 italic">All fields added to layout</div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>

            {/* Right Panel — Layout Grid */}
            <div className="flex-1 flex flex-col min-w-0 bg-background/10">
              <div className="px-4 py-3 border-b border-border/30">
                <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/60">Layout Grid ({GRID_COLS} columns)</span>
              </div>
              <Droppable droppableId="grid">
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={cn('flex-1 overflow-y-auto custom-scrollbar p-4', snapshot.isDraggingOver && 'bg-primary/5')}
                  >
                    <div className="grid grid-cols-4 gap-3 auto-rows-[80px]">
                      {layout.map((item, index) => (
                        <Draggable key={item.field_name} draggableId={item.field_name} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={cn('relative rounded-xl border p-3 flex flex-col justify-between transition-all group', getFeatureColor(item.field_name), snapshot.isDragging && 'shadow-lg ring-1 ring-primary/30 scale-105')}
                              style={{
                                gridColumn: `span ${item.width || 1}`,
                                gridRow: `span ${item.height || 1}`,
                                ...provided.draggableProps.style,
                              }}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase tracking-wider text-primary/60">{getFieldTypeLabel(item.field_name)}</span>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => removeFromLayout(item.field_name)} className="p-0.5 hover:text-error transition-colors"><X className="w-3 h-3" /></button>
                                  <div {...provided.dragHandleProps} className="p-0.5 cursor-grab active:cursor-grabbing"><GripVertical className="w-3 h-3 text-muted-foreground/30" /></div>
                                </div>
                              </div>
                              <div>
                                <div className="text-xs font-bold truncate">{item.field_name}</div>
                                <div className="text-[9px] text-muted-foreground/50">
                                  {item.x},{item.y} · {item.width}×{item.height}
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      {layout.length === 0 && (
                        <div className="col-span-4 flex flex-col items-center justify-center py-20 text-muted-foreground/20 gap-2">
                          <Plus className="w-10 h-10" />
                          <span className="text-xs font-bold uppercase tracking-wider">Drag fields here</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Droppable>
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 w-full px-6 py-4 border-t border-border/50 justify-end shrink-0">
            <button onClick={onClose} className="px-5 py-2.5 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors font-semibold border border-border text-xs">Cancel</button>
            <button onClick={handleSave} className="px-5 py-2.5 rounded-lg bg-primary/30 text-primary hover:bg-primary/40 shadow-lg shadow-primary/10 transition-all font-semibold text-xs">Save Layout</button>
          </div>
        </div>
      </div>
    </DragDropContext>
  );
};

export default ServiceLayoutModal;