import { initSearch } from './search';
import { initComments } from './comments';
import { loadBears } from './bearService';
import { renderBears, renderBearError } from './bearView';

async function initApp(): Promise<void> {
  initSearch();
  initComments();
  try {
    const bears = await loadBears();
    renderBears(bears);
  } catch (error) {
    console.error('Could not load bear data:', error);
    renderBearError('Bear data could not be loaded. Please try again later.');
  }
}

void initApp();
