export type Block = {
  id: string;
  content: string;
  isCompleted: boolean;
  parentId: string | null;
  order: number;
  isCollapsed?: boolean;
};

export interface TaskState {
  blocks: Record<string, Block>;
  rootOrder: string[];
}

export type FlattenedBlock = Block & {
  depth: number;
};
