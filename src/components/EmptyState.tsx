import { useTaskStore } from '../store/useTaskStore';

export function EmptyState() {
  const addBlock = useTaskStore((s) => s.addBlock);

  const handleClick = () => {
    const newId = addBlock();
    requestAnimationFrame(() => {
      const el = document.querySelector(
        `[data-block-id="${newId}"]`
      ) as HTMLElement | null;
      el?.focus();
    });
  };

  return (
    <div
      className="cursor-text py-2 text-gray-400 select-none"
      onClick={handleClick}
    >
      오늘 무엇을 집중해서 끝낼까요?
    </div>
  );
}
