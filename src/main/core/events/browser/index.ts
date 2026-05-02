import { setupEngineHandlers } from './engine';
import { setupLaunchHandlers } from './launch';

export function setupBrowserHandlers() {
  console.log('✅ Setting up Browser Engine Handlers...');
  setupEngineHandlers();
  setupLaunchHandlers();
}
