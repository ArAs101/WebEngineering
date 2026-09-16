import { initSearch } from './search.js';
import { initComments } from './comments.js';
import { loadBears } from './bearService.js';
import { renderBears, renderBearError } from './bearView.js';

async function initApp() {
    initSearch();
    initComments();
    let bears;
    try {
        bears = await loadBears();

    } catch (error) {
        console.error("Could not load bear data:", error);
        renderBearError("Bear data could not be loaded. Please try again later.");
        return;
    }
    renderBears(bears);
}

initApp();