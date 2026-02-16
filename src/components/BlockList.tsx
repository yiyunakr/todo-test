import { useMemo, useState } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  MeasuringStrategy,
  type DragStartEvent,
  type DragMoveEvent,
  type DragOverEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useTaskStore } from '../store/useTaskStore';
import {
  flattenTree,
  getDescendantIds,
  getProjection,
  getChildren,
  computeOrderBetween,
} from '../lib/tree';
import { SortableBlockItem } from './SortableBlockItem';
import { BlockItem } from './BlockItem';
import { EmptyState } from './EmptyState';

const INDENTATION_WIDTH = 24;

export function BlockList() {
  const blocks = useTaskStore((s) => s.blocks);
  const moveBlock = useTaskStore((s) => s.moveBlock);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [offsetLeft, setOffsetLeft] = useState(0);

  const flattenedBlocks = useMemo(() => flattenTree(blocks), [blocks]);

  // During drag, remove descendants of dragged item
  const sortableItems = useMemo(() => {
    if (!activeId) return flattenedBlocks;
    const descendantIds = new Set(getDescendantIds(blocks, activeId));
    return flattenedBlocks.filter((b) => !descendantIds.has(b.id));
  }, [flattenedBlocks, activeId, blocks]);

  const projected = useMemo(() => {
    if (!activeId || !overId) return null;
    return getProjection(sortableItems, activeId, overId, offsetLeft, INDENTATION_WIDTH);
  }, [sortableItems, activeId, overId, offsetLeft]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
    setOverId(String(event.active.id));
  }

  function handleDragMove(event: DragMoveEvent) {
    setOffsetLeft(event.delta.x);
  }

  function handleDragOver(event: DragOverEvent) {
    if (event.over) {
      setOverId(String(event.over.id));
    }
  }

  function handleDragEnd(_event: DragEndEvent) {
    if (activeId && projected) {
      const { parentId } = projected;

      // Compute order at the drop position
      const overIndex = sortableItems.findIndex((b) => b.id === overId);
      const targetSiblings = getChildren(blocks, parentId);

      let newOrder: number;
      if (targetSiblings.length === 0) {
        newOrder = 0;
      } else {
        // Find surrounding siblings at the target depth
        const overItem = sortableItems[overIndex];
        if (overItem && overItem.parentId === parentId) {
          const sibIndex = targetSiblings.findIndex((s) => s.id === overItem.id);
          const prev = targetSiblings[sibIndex];
          const next = targetSiblings[sibIndex + 1];
          newOrder = computeOrderBetween(prev, next);
        } else {
          const lastSibling = targetSiblings[targetSiblings.length - 1];
          newOrder = lastSibling ? lastSibling.order + 1 : 0;
        }
      }

      moveBlock(activeId, parentId, newOrder);
    }
    resetDragState();
  }

  function handleDragCancel() {
    resetDragState();
  }

  function resetDragState() {
    setActiveId(null);
    setOverId(null);
    setOffsetLeft(0);
  }

  if (flattenedBlocks.length === 0) {
    return <EmptyState />;
  }

  const activeBlock = activeId
    ? flattenedBlocks.find((b) => b.id === activeId)
    : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
      measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
    >
      <SortableContext
        items={sortableItems.map((b) => b.id)}
        strategy={verticalListSortingStrategy}
      >
        <div role="list">
          {sortableItems.map((block) => (
            <SortableBlockItem
              key={block.id}
              block={
                projected && block.id === overId
                  ? { ...block, depth: projected.depth }
                  : block
              }
            />
          ))}
        </div>
      </SortableContext>

      <DragOverlay dropAnimation={null}>
        {activeBlock ? (
          <BlockItem block={{ ...activeBlock, depth: 0 }} isDragging />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
