import { useCallback, useEffect, useRef } from 'react';
import { GripVertical, Square, CheckSquare, X } from 'lucide-react';
import type { FlattenedBlock } from '../types/block';
import { useTaskStore } from '../store/useTaskStore';
import { useBlockKeyboard } from '../hooks/useBlockKeyboard';
import { getChildren } from '../lib/tree';

const INDENTATION_WIDTH = 24;

interface BlockItemProps {
  block: FlattenedBlock;
  style?: React.CSSProperties;
  attributes?: React.HTMLAttributes<HTMLElement>;
  listeners?: React.HTMLAttributes<HTMLElement>;
  setNodeRef?: (node: HTMLElement | null) => void;
  isDragging?: boolean;
}

export function BlockItem({
  block,
  style,
  attributes,
  listeners,
  setNodeRef,
  isDragging,
}: BlockItemProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const updateContent = useTaskStore((s) => s.updateContent);
  const toggleComplete = useTaskStore((s) => s.toggleComplete);
  const deleteBlock = useTaskStore((s) => s.deleteBlock);
  const toggleCollapse = useTaskStore((s) => s.toggleCollapse);
  const blocks = useTaskStore((s) => s.blocks);
  const { handleKeyDown } = useBlockKeyboard(block.id);

  const hasChildren = getChildren(blocks, block.id).length > 0;

  // Sync content from store to DOM only when changed externally
  useEffect(() => {
    if (contentRef.current && contentRef.current.textContent !== block.content) {
      contentRef.current.textContent = block.content;
    }
  }, [block.content]);

  const handleInput = useCallback(() => {
    const text = contentRef.current?.textContent ?? '';
    updateContent(block.id, text);
  }, [block.id, updateContent]);

  return (
    <div
      ref={setNodeRef}
      style={{
        paddingLeft: block.depth * INDENTATION_WIDTH,
        ...style,
      }}
      className={`group flex items-center gap-1 py-0.5 ${
        isDragging ? 'opacity-50' : ''
      }`}
      {...attributes}
    >
      {/* Drag Handle */}
      <button
        className="flex-shrink-0 cursor-grab rounded p-0.5 text-gray-300 opacity-0 transition-opacity hover:text-gray-500 group-hover:opacity-100 active:cursor-grabbing"
        tabIndex={-1}
        aria-label="드래그하여 정렬"
        {...listeners}
      >
        <GripVertical size={16} />
      </button>

      {/* Collapse Toggle (only if has children) */}
      {hasChildren ? (
        <button
          className="flex-shrink-0 rounded p-0.5 text-gray-400 hover:text-gray-600"
          onClick={() => toggleCollapse(block.id)}
          tabIndex={-1}
          aria-label={block.isCollapsed ? '펼치기' : '접기'}
        >
          <span
            className={`inline-block text-xs transition-transform ${
              block.isCollapsed ? '-rotate-90' : ''
            }`}
          >
            ▼
          </span>
        </button>
      ) : (
        <span className="w-[24px] flex-shrink-0" />
      )}

      {/* Checkbox */}
      <button
        className="flex-shrink-0 rounded p-0.5 text-gray-400 hover:text-gray-600"
        onClick={() => toggleComplete(block.id)}
        tabIndex={-1}
        aria-label={block.isCompleted ? '미완료로 변경' : '완료로 변경'}
        aria-checked={block.isCompleted}
      >
        {block.isCompleted ? (
          <CheckSquare size={16} className="text-gray-400" />
        ) : (
          <Square size={16} />
        )}
      </button>

      {/* Content (contenteditable) */}
      <div
        ref={contentRef}
        data-block-id={block.id}
        data-placeholder="할 일을 입력하세요..."
        contentEditable
        suppressContentEditableWarning
        className={`min-h-[24px] flex-1 rounded px-1 py-0.5 text-sm leading-relaxed outline-none focus:bg-gray-50 ${
          block.isCompleted ? 'text-gray-400 line-through' : 'text-gray-900'
        }`}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        role="textbox"
        aria-label="블록 내용"
      />

      {/* Delete Button */}
      <button
        className="flex-shrink-0 rounded p-0.5 text-gray-300 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
        onClick={() => deleteBlock(block.id)}
        tabIndex={-1}
        aria-label="삭제"
      >
        <X size={14} />
      </button>
    </div>
  );
}
