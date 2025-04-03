// /js/deckSelection.js
import { getDOMElement } from './dom.js';
import { startGameWithHero } from './gameLogic.js';
import { defaultDecks } from './decks.js';
import { cardLibrary } from './cards.js'; // Needed to create card instances for the deck

let deckSelectionScreenEl = null;
let deckOptionsContainerEl = null;
let deckSelectionHeroNameEl = null;
let currentHero = null;
let isDebugMode = false;

const LOCAL_STORAGE_KEY_PREFIX = 'customDecks_';

export function initDeckSelection() {
    console.log("Initializing Deck Selection...");
    deckSelectionScreenEl = getDOMElement('deckSelectionScreenEl'); // Use getDOMElement
    deckOptionsContainerEl = getDOMElement('deckOptionsContainerEl');
    deckSelectionHeroNameEl = getDOMElement('deckSelectionHeroNameEl');

    if (!deckSelectionScreenEl || !deckOptionsContainerEl || !deckSelectionHeroNameEl) {
        console.error("Deck selection elements not found!");
        return;
    }
}

export function showDeckSelection(hero, debug) {
    if (!deckSelectionScreenEl) {
        console.error("Deck selection screen not initialized.");
        return;
    }

    currentHero = hero;
    isDebugMode = debug;
    console.log(`Showing deck selection for ${hero.name}`);

    if (deckSelectionHeroNameEl) {
        deckSelectionHeroNameEl.textContent = hero.name;
    }

    populateDeckOptions(hero);

    deckSelectionScreenEl.classList.remove('hidden');
    deckSelectionScreenEl.classList.add('visible');
}

function hideDeckSelection() {
    if (deckSelectionScreenEl) {
        deckSelectionScreenEl.classList.remove('visible');
        deckSelectionScreenEl.classList.add('hidden');
    }
}

function populateDeckOptions(hero) {
    if (!deckOptionsContainerEl) return;
    deckOptionsContainerEl.innerHTML = ''; // Clear previous options

    // --- Add Default Deck Option ---
    const defaultDeckId = 'default'; // Identifier for the default deck
    const defaultDeckOptionEl = createDeckOptionElement('Default Deck', defaultDeckId);
    deckOptionsContainerEl.appendChild(defaultDeckOptionEl);

    // --- Add Custom Deck Options ---
    const customDecks = loadCustomDecksForHero(hero.id);
    console.log(`Found custom decks for ${hero.id}:`, customDecks);
    for (const deckName in customDecks) {
        const customDeckOptionEl = createDeckOptionElement(deckName, deckName); // Use deck name as ID for simplicity here
        deckOptionsContainerEl.appendChild(customDeckOptionEl);
    }
}

function createDeckOptionElement(deckName, deckId) {
    const deckOptionEl = document.createElement('div');
    deckOptionEl.classList.add('deck-option');
    deckOptionEl.dataset.deckId = deckId;

    deckOptionEl.innerHTML = `
        <h3>${deckName}</h3>
        <button class="select-deck-button">Choose Deck & Start</button>
    `;

    const button = deckOptionEl.querySelector('.select-deck-button');
    button.addEventListener('click', () => handleDeckSelection(deckId));

    return deckOptionEl;
}

function handleDeckSelection(deckId) {
    console.log(`Selected deck: ${deckId} for hero: ${currentHero.name}`);

    let selectedDeckList = null;

    if (deckId === 'default') {
        selectedDeckList = defaultDecks[currentHero.id];
        if (!selectedDeckList) {
            console.error(`Default deck not found for hero ID: ${currentHero.id}`);
            return;
        }
    } else { // deckId is the custom deck name
        const customDecks = loadCustomDecksForHero(currentHero.id);
        selectedDeckList = customDecks[deckId];
        if (!selectedDeckList) {
            console.error(`Custom deck "${deckId}" not found for hero ID: ${currentHero.id}`);
            return;
        }
    }

    if (!selectedDeckList || selectedDeckList.length !== 30) {
         console.error(`Invalid deck list selected or loaded for deckId: ${deckId}. Expected 30 cards, got ${selectedDeckList?.length}.`);
         alert("Error: Invalid deck selected. Cannot start game."); // User feedback
         return;
    }

    // Validate card IDs exist in library (optional but good practice)
    const invalidCardIds = selectedDeckList.filter(cardId => !cardLibrary.find(c => c.id === cardId));
    if (invalidCardIds.length > 0) {
        console.error(`Deck "${deckId}" contains invalid card IDs: ${invalidCardIds.join(', ')}`);
        alert(`Error: Deck "${deckId}" contains invalid card IDs. Cannot start game.`);
        return;
    }

    // Pass the validated list of card IDs directly to startGameWithHero
    const deckCardIds = selectedDeckList;

    hideDeckSelection();
    // Call the actual game start function with the hero and the list of card IDs
    startGameWithHero(currentHero, deckCardIds, isDebugMode);
}

// --- Helper Functions ---
function loadCustomDecksForHero(heroId) {
    const key = `${LOCAL_STORAGE_KEY_PREFIX}${heroId}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : {};
}
