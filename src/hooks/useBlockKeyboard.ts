import { useCallback } from 'react';
import { useTaskStore } from '../store/useTaskStore';
import { flattenTree } from '../lib/tree';

export function useBlockKeyboard(blockId: string) {
  const addBlock = useTaskStore((s) => s.addBlock);
  const indentBlock = useTaskStore((s) => s.indentBlock);
  const outdentBlock = useTaskStore((s) => s.outdentBlock);
  const deleteBlock = useTaskStore((s) => s.deleteBlock);
  const blocks = useTaskStore((s) => s.blocks);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const newId = addBlock(blockId);
        requestAnimationFrame(() => {
          const el = document.querySelector(
            `[data-block-id="${newId}"]`
          ) as HTMLElement | null;
          el?.focus();
        });
      }

      if (e.key === 'Tab' && !e.shiftKey) {
        e.preventDefault();
        indentBlock(blockId);
      }

      if (e.key === 'Tab' && e.shiftKey) {
        e.preventDefault();
        outdentBlock(blockId);
      }

      if (e.key === 'Backspace') {
        const target = e.currentTarget;
        const content = target.textContent || '';
        if (content === '') {
          e.preventDefault();
          const flattened = flattenTree(blocks);
          const currentIndex = flattened.findIndex((b) => b.id === blockId);
          const prevBlock = flattened[currentIndex - 1];

          if (flattened.length <= 1) return; // Don't delete the last block

          deleteBlock(blockId);

          if (prevBlock) {
            requestAnimationFrame(() => {
              const el = document.querySelector(
                `[data-block-id="${prevBlock.id}"]`
              ) as HTMLElement | null;
              if (el) {
                el.focus();
                const range = document.createRange();
                const sel = window.getSelection();
                range.selectNodeContents(el);
                range.collapse(false);
                sel?.removeAllRanges();
                sel?.addRange(range);
              }
            });
          }
        }
      }
    },
    [blockId, addBlock, indentBlock, outdentBlock, deleteBlock, blocks]
  );

  return { handleKeyDown };
}
