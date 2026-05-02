import { setupProfileHandlers } from './profile';
import { setupDataHandlers } from './data';

export function setupAccountHandlers() {
  console.log('✅ Setting up Account Data Handlers...');
  setupProfileHandlers();
  setupDataHandlers();
}
