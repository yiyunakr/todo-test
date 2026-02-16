import { create } from 'zustand';
import type { TaskState } from '../types/block';
import { generateId } from '../lib/id';
import {
  getChildren,
  getSiblings,
  getPreviousSibling,
  computeOrderBetween,
  getDescendantIds,
} from '../lib/tree';
import { loadState, createDebouncedSaver } from '../lib/storage';

interface TaskActions {
  addBlock: (afterBlockId?: string) => string;
  toggleComplete: (blockId: string) => void;
  indentBlock: (blockId: string) => void;
  outdentBlock: (blockId: string) => void;
  updateContent: (blockId: string, content: string) => void;
  deleteBlock: (blockId: string) => void;
  moveBlock: (blockId: string, newParentId: string | null, newOrder: number) => void;
  toggleCollapse: (blockId: string) => void;
}

type TaskStore = TaskState & TaskActions;

function getInitialState(): TaskState {
  const persisted = loadState();
  if (persisted && Object.keys(persisted.blocks).length > 0) {
    return persisted;
  }

  const id = generateId();
  return {
    blocks: {
      [id]: {
        id,
        content: '',
        isCompleted: false,
        parentId: null,
        order: 0,
      },
    },
    rootOrder: [id],
  };
}

export const useTaskStore = create<TaskStore>()((set) => ({
  ...getInitialState(),

  addBlock: (afterBlockId?: string) => {
    const newId = generateId();
    set((state) => {
      const blocks = { ...state.blocks };

      if (!afterBlockId) {
        const rootChildren = getChildren(blocks, null);
        const lastChild = rootChildren[rootChildren.length - 1];
        const order = lastChild ? lastChild.order + 1 : 0;
        blocks[newId] = {
          id: newId,
          content: '',
          isCompleted: false,
          parentId: null,
          order,
        };
        return { blocks };
      }

      const currentBlock = blocks[afterBlockId];
      if (!currentBlock) return state;

      const siblings = getSiblings(blocks, currentBlock);
      const currentIndex = siblings.findIndex((s) => s.id === currentBlock.id);
      const nextSibling = siblings[currentIndex + 1];
      const order = computeOrderBetween(currentBlock, nextSibling);

      blocks[newId] = {
        id: newId,
        content: '',
        isCompleted: false,
        parentId: currentBlock.parentId,
        order,
      };

      return { blocks };
    });
    return newId;
  },

  toggleComplete: (blockId: string) => {
    set((state) => {
      const block = state.blocks[blockId];
      if (!block) return state;
      return {
        blocks: {
          ...state.blocks,
          [blockId]: { ...block, isCompleted: !block.isCompleted },
        },
      };
    });
  },

  indentBlock: (blockId: string) => {
    set((state) => {
      const block = state.blocks[blockId];
      if (!block) return state;

      const prevSibling = getPreviousSibling(state.blocks, block);
      if (!prevSibling) return state;

      const prevChildren = getChildren(state.blocks, prevSibling.id);
      const lastChild = prevChildren[prevChildren.length - 1];
      const order = lastChild ? lastChild.order + 1 : 0;

      return {
        blocks: {
          ...state.blocks,
          [blockId]: { ...block, parentId: prevSibling.id, order },
        },
      };
    });
  },

  outdentBlock: (blockId: string) => {
    set((state) => {
      const block = state.blocks[blockId];
      if (!block || block.parentId === null) return state;

      const parent = state.blocks[block.parentId];
      if (!parent) return state;

      const parentSiblings = getSiblings(state.blocks, parent);
      const parentIndex = parentSiblings.findIndex((s) => s.id === parent.id);
      const nextParentSibling = parentSiblings[parentIndex + 1];
      const order = computeOrderBetween(parent, nextParentSibling);

      return {
        blocks: {
          ...state.blocks,
          [blockId]: { ...block, parentId: parent.parentId, order },
        },
      };
    });
  },

  updateContent: (blockId: string, content: string) => {
    set((state) => {
      const block = state.blocks[blockId];
      if (!block) return state;
      return {
        blocks: {
          ...state.blocks,
          [blockId]: { ...block, content },
        },
      };
    });
  },

  deleteBlock: (blockId: string) => {
    set((state) => {
      const blocks = { ...state.blocks };
      const descendantIds = getDescendantIds(blocks, blockId);
      const allIdsToRemove = [blockId, ...descendantIds];

      for (const id of allIdsToRemove) {
        delete blocks[id];
      }

      return { blocks };
    });
  },

  moveBlock: (blockId: string, newParentId: string | null, newOrder: number) => {
    set((state) => {
      const block = state.blocks[blockId];
      if (!block) return state;
      return {
        blocks: {
          ...state.blocks,
          [blockId]: { ...block, parentId: newParentId, order: newOrder },
        },
      };
    });
  },

  toggleCollapse: (blockId: string) => {
    set((state) => {
      const block = state.blocks[blockId];
      if (!block) return state;
      return {
        blocks: {
          ...state.blocks,
          [blockId]: { ...block, isCollapsed: !block.isCollapsed },
        },
      };
    });
  },
}));

// Debounced localStorage persistence
useTaskStore.subscribe(createDebouncedSaver(500));
