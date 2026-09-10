import { useMemo } from 'react';
import type { DfdModel } from '../types';

/**
 * Hook to load all DFD model data dynamically from .json files in constants folder
 */
export function useDfdModels(): DfdModel[] {
  return useMemo(() => {
    // Dynamically import all .json files from constants folder
    const modules = import.meta.glob<{ default: DfdModel }>('../constants/*.json', { eager: true });

    const models: DfdModel[] = [];
    for (const path in modules) {
      const model = modules[path].default;
      if (model && model.meta && model.levels) {
        models.push(model);
      }
    }

    return models;
  }, []);
}
