'use client';
import { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import type { DragEndEvent } from '@dnd-kit/core';

export interface WidgetConfig {
  id: string;
  title: string;
  visible: boolean;
  order: number;
}

interface SortableWidgetProps {
  widget: WidgetConfig;
  onRemove: (id: string) => void;
  children: React.ReactNode;
}

function SortableWidget({ widget, onRemove, children }: SortableWidgetProps) {
  return (
    <div className="relative group">
      {children}
      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <div className="cursor-grab active:cursor-grabbing p-1 text-[#8B9DB5] hover:text-[#E6EAF0]">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
          </svg>
        </div>
        <button
          onClick={() => onRemove(widget.id)}
          className="p-1 text-[#8B9DB5] hover:text-red-400 transition-colors"
          aria-label={`Remove ${widget.title}`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

interface AdminDashboardGridProps {
  widgets: WidgetConfig[];
  onReorder: (widgets: WidgetConfig[]) => void;
  onRemove: (widgetId: string) => void;
  renderWidget: (widget: WidgetConfig) => React.ReactNode;
}

export default function AdminDashboardGrid({
  widgets,
  onReorder,
  onRemove,
  renderWidget,
}: AdminDashboardGridProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const sortedWidgets = [...widgets]
    .filter((w) => w.visible)
    .sort((a, b) => a.order - b.order);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sortedWidgets.findIndex((w) => String(w.id) === String(active.id));
    const newIndex = sortedWidgets.findIndex((w) => String(w.id) === String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(sortedWidgets, oldIndex, newIndex).map((w, i) => ({
      ...w,
      order: i,
    }));
    onReorder(reordered);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {sortedWidgets.map((widget) => (
        <SortableWidget key={widget.id} widget={widget} onRemove={onRemove}>
          {isClient ? (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext
                items={sortedWidgets.map((w) => String(w.id))}
                strategy={rectSortingStrategy}
              >
                {renderWidget(widget)}
              </SortableContext>
            </DndContext>
          ) : (
            renderWidget(widget)
          )}
        </SortableWidget>
      ))}
    </div>
  );
}
