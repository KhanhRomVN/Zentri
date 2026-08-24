import { setupEngineHandlers } from './engine';
import { setupLaunchHandlers } from './launch';

export function setupBrowserHandlers() {
  setupEngineHandlers();
  setupLaunchHandlers();
}
