import { showHeroSelection } from './heroSelection.js';
import { getDOMElement } from './dom.js';
import { setDebugMode } from './state.js';

import { stopBackgroundMusic } from './audioUtils.js';

let openingMenuEl = null;
let startButtonEl = null;
let startDebugButtonEl = null;
let settingsButtonEl = null;
let deckEditorButtonEl = null;

export function initMenu() {
    console.log("Initializing Opening Menu...");
    openingMenuEl = getDOMElement('openingMenuEl');
    deckEditorButtonEl = getDOMElement('deckEditorButtonEl');
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
    deckEditorButtonEl?.addEventListener('click', handleDeckEditorClick);

    showOpeningMenu();
}

function handleStartClick() {
    console.log("Start button clicked");
    stopBackgroundMusic(); // Stop music before starting game
    hideOpeningMenu();
    showHeroSelection(false); // Transition to hero selection (not in debug mode)
}

function handleStartDebugClick() {
    console.log("Start Debug button clicked");
    stopBackgroundMusic(); // Stop music before starting game
    hideOpeningMenu();
    showHeroSelection(true); // Transition to hero selection (in debug mode)
}

function handleSettingsClick() {
    console.log("Settings button clicked (Placeholder)");
    // Keep music playing for settings? Or stop? Decide later.
    alert("Settings screen not implemented yet!");
    // Later: hideOpeningMenu(); showSettingsScreen();
}

function handleDeckEditorClick() {
    console.log("Deck Editor button clicked");
    hideOpeningMenu();
    stopBackgroundMusic(); // Stop music when going to deck editor
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
