import { showHeroSelection } from './heroSelection.js';

let openingMenuEl = null;
let startButtonEl = null;
let settingsButtonEl = null;

export function initMenu() {
    console.log("Initializing Opening Menu...");
    openingMenuEl = document.getElementById('opening-menu');
    startButtonEl = document.getElementById('start-game-button');
    settingsButtonEl = document.getElementById('settings-button');

    if (!openingMenuEl || !startButtonEl || !settingsButtonEl) {
        console.error("Menu elements not found!");
        return;
    }

    startButtonEl.addEventListener('click', handleStartClick);
    settingsButtonEl.addEventListener('click', handleSettingsClick);

    showOpeningMenu();
}

function handleStartClick() {
    console.log("Start button clicked");
    hideOpeningMenu();
    showHeroSelection(); // Transition to hero selection
}

function handleSettingsClick() {
    console.log("Settings button clicked (Placeholder)");
    alert("Settings screen not implemented yet!");
    // Later: hideOpeningMenu(); showSettingsScreen();
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
