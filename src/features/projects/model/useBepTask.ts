import { useContext } from 'react';

import type { BepTaskContextValue } from './bepTaskContext';
import { BepTaskContext } from './bepTaskContext';

export const useBepTask = (): BepTaskContextValue => {
  const context = useContext(BepTaskContext);
  if (!context) {
    throw new Error('useBepTask phải được dùng bên trong <BepTaskProvider>.');
  }
  return context;
};
