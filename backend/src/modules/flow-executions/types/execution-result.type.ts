export type ExecutionAction =
  | { type: 'MESSAGE'; content: string }
  | { type: 'WAIT_INPUT'; nodeId: string }
  | { type: 'WEBHOOK_RESULT'; data: any }
  | { type: 'END' };

export interface ExecutionResult {
  executionId: string;
  status: 'RUNNING' | 'WAITING_INPUT' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  currentNodeId?: string | null;
  actions: ExecutionAction[];
  variables?: Record<string, any>;
}