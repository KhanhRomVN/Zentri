import { setupProfileHandlers } from './profile';
import { setupDataHandlers } from './data';

export function setupAccountHandlers() {
  setupProfileHandlers();
  setupDataHandlers();
}
