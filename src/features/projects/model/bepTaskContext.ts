import { createContext } from 'react';

import type { BepParseResult } from '@/entities/project';

export type BepTaskStatus = 'idle' | 'running' | 'done' | 'error' | 'opened';

export interface BepTaskContextValue {
  status: BepTaskStatus;
  fileName: string | null;
  result: BepParseResult | null;
  error: string | null;
  start: (file: File) => void;
  open: () => void;
  dismiss: () => void;
}

export const BepTaskContext = createContext<BepTaskContextValue | null>(null);
