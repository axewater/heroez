import { showHeroSelection } from './heroSelection.js';
import { getDOMElement } from './dom.js';
import { setDebugMode } from './state.js';

let openingMenuEl = null;
let startButtonEl = null;
let startDebugButtonEl = null;
let settingsButtonEl = null;
let deckEditorButtonEl = null; // Added Deck Editor button element

export function initMenu() {
    console.log("Initializing Opening Menu...");
    openingMenuEl = getDOMElement('openingMenuEl');
    deckEditorButtonEl = getDOMElement('deckEditorButtonEl'); // Get Deck Editor button
    startButtonEl = getDOMElement('startGameButtonEl');
    startDebugButtonEl = getDOMElement('startDebugButtonEl');
    settingsButtonEl = getDOMElement('settingsButtonEl');

    if (!openingMenuEl || !startButtonEl || !startDebugButtonEl || !settingsButtonEl) {
        console.error("Menu elements not found!");
        return;
    }
    if (!deckEditorButtonEl) console.warn("Deck Editor button not found in DOM!");

    startButtonEl.addEventListener('click', handleStartClick);
    startDebugButtonEl.addEventListener('click', handleStartDebugClick);
    settingsButtonEl.addEventListener('click', handleSettingsClick);
    deckEditorButtonEl?.addEventListener('click', handleDeckEditorClick); // Add listener

    showOpeningMenu();
}

function handleStartClick() {
    console.log("Start button clicked");
    hideOpeningMenu();
    showHeroSelection(false); // Transition to hero selection (not in debug mode)
}

function handleStartDebugClick() {
    console.log("Start Debug button clicked");
    hideOpeningMenu();
    showHeroSelection(true); // Transition to hero selection (in debug mode)
}

function handleSettingsClick() {
    console.log("Settings button clicked (Placeholder)");
    alert("Settings screen not implemented yet!");
    // Later: hideOpeningMenu(); showSettingsScreen();
}

function handleDeckEditorClick() {
    console.log("Deck Editor button clicked");
    hideOpeningMenu();
    // Assuming deckEditor.js exports showDeckEditor()
    import('./deckEditor.js').then(module => module.showDeckEditor());
}

export function showOpeningMenu() {
    if (openingMenuEl) {
        openingMenuEl.style.display = 'flex';
        openingMenuEl.style.opacity = '1';
        openingMenuEl.classList.remove('hidden');
    }
}

export function hideOpeningMenu() {
    if (openingMenuEl) {
        openingMenuEl.style.opacity = '0';
        // Use a timeout to set display: none after the transition completes
        setTimeout(() => {
            openingMenuEl.style.display = 'none';
            openingMenuEl.classList.add('hidden');
        }, 500); // Match CSS transition duration
    }
}
