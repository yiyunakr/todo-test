import type { Block, FlattenedBlock } from '../types/block';
import { arrayMove } from '@dnd-kit/sortable';

export function getChildren(
  blocks: Record<string, Block>,
  parentId: string | null
): Block[] {
  return Object.values(blocks)
    .filter((b) => b.parentId === parentId)
    .sort((a, b) => a.order - b.order);
}

export function getSiblings(
  blocks: Record<string, Block>,
  block: Block
): Block[] {
  return getChildren(blocks, block.parentId);
}

export function getPreviousSibling(
  blocks: Record<string, Block>,
  block: Block
): Block | undefined {
  const siblings = getSiblings(blocks, block);
  const index = siblings.findIndex((s) => s.id === block.id);
  return index > 0 ? siblings[index - 1] : undefined;
}

export function getDepth(
  blocks: Record<string, Block>,
  blockId: string
): number {
  let depth = 0;
  let current = blocks[blockId];
  while (current?.parentId) {
    depth++;
    current = blocks[current.parentId];
  }
  return depth;
}

export function flattenTree(
  blocks: Record<string, Block>
): FlattenedBlock[] {
  const result: FlattenedBlock[] = [];

  function traverse(parentId: string | null, depth: number) {
    const children = getChildren(blocks, parentId);
    for (const child of children) {
      result.push({ ...child, depth });
      if (!child.isCollapsed) {
        traverse(child.id, depth + 1);
      }
    }
  }

  traverse(null, 0);
  return result;
}

export function computeOrderBetween(
  prev: Block | undefined,
  next: Block | undefined
): number {
  if (prev && next) return (prev.order + next.order) / 2;
  if (prev) return prev.order + 1;
  if (next) return next.order - 1;
  return 0;
}

export function getDescendantIds(
  blocks: Record<string, Block>,
  blockId: string
): string[] {
  const result: string[] = [];
  const children = getChildren(blocks, blockId);
  for (const child of children) {
    result.push(child.id);
    result.push(...getDescendantIds(blocks, child.id));
  }
  return result;
}

export function getProjection(
  flattenedItems: FlattenedBlock[],
  activeId: string,
  overId: string,
  dragOffsetX: number,
  indentationWidth: number
): { depth: number; parentId: string | null } {
  const overIndex = flattenedItems.findIndex((b) => b.id === overId);
  const activeIndex = flattenedItems.findIndex((b) => b.id === activeId);
  const activeItem = flattenedItems[activeIndex];

  const newItems = arrayMove(flattenedItems, activeIndex, overIndex);
  const previousItem = newItems[overIndex - 1];
  const nextItem = newItems[overIndex + 1];

  const dragDepth = Math.round(dragOffsetX / indentationWidth);
  const projectedDepth = activeItem.depth + dragDepth;

  const maxDepth = previousItem ? previousItem.depth + 1 : 0;
  const minDepth = nextItem ? nextItem.depth : 0;

  const depth = Math.min(Math.max(projectedDepth, minDepth), maxDepth);

  if (depth === 0 || !previousItem) return { depth, parentId: null };
  if (depth === previousItem.depth) return { depth, parentId: previousItem.parentId };
  if (depth > previousItem.depth) return { depth, parentId: previousItem.id };

  // depth < previousItem.depth: find ancestor at correct level
  const newParent = newItems
    .slice(0, overIndex)
    .reverse()
    .find((item) => item.depth === depth - 1);
  return { depth, parentId: newParent?.id ?? null };
}
