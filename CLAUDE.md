# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**BlockFlow** — a local-first hierarchical task manager. No login, no server, pure client-side app.

See `prd.md` for the full PRD.

## Commands

- `npm run dev` — start dev server
- `npm run build` — production build
- `npx tsc --noEmit` — type check

## Tech Stack

- Vite + React + TypeScript (pure CSR)
- Zustand (state management)
- dnd-kit (drag & drop)
- Tailwind CSS (styling via `@tailwindcss/vite` plugin)
- lucide-react (icons)

## Architecture

### Data Model

Flat map with parent references (`src/types/block.ts`). `FlattenedBlock` adds computed `depth` for rendering.

### Key Modules

- `src/lib/tree.ts` — pure tree utility functions (flattenTree, getProjection, getChildren, getDescendantIds, computeOrderBetween). Every component depends on these.
- `src/store/useTaskStore.ts` — Zustand store with all state and actions. Subscribes to debounced localStorage saver (500ms, key: `blockflow_v1`).
- `src/components/BlockItem.tsx` — core block UI with contenteditable (not input), checkbox, drag handle, delete button.
- `src/components/BlockList.tsx` — DndContext + SortableContext wrapper with drag projection logic.
- `src/hooks/useBlockKeyboard.ts` — Enter (new block), Tab (indent), Shift+Tab (outdent), Backspace (delete empty).

### Patterns

- contenteditable managed via refs (not React state) to preserve cursor position
- Drag listeners attached to handle only (not entire row) to avoid contenteditable conflicts
- Indentation: `paddingLeft: depth * 24px`
- Hover-only visibility: Tailwind `group` + `opacity-0 group-hover:opacity-100`
