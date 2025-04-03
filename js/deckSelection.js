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

    // --- Add Custom Deck Options (Placeholder) ---
    // Later, load custom decks associated with the hero
    // const customDecks = loadCustomDecksForHero(hero.id);
    // customDecks.forEach(deck => {
    //     const customDeckOptionEl = createDeckOptionElement(deck.name, deck.id);
    //     deckOptionsContainerEl.appendChild(customDeckOptionEl);
    // });
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
    } else {
        // Handle custom deck loading here later
        console.error(`Custom deck loading not implemented yet (deckId: ${deckId})`);
        // selectedDeckList = loadCustomDeck(deckId);
        return; // Exit if custom deck loading fails or isn't implemented
    }

    if (!selectedDeckList || selectedDeckList.length !== 30) {
         console.error(`Invalid deck list selected or loaded for deckId: ${deckId}. Expected 30 cards, got ${selectedDeckList?.length}.`);
         alert("Error: Invalid deck selected. Cannot start game."); // User feedback
         return;
    }

    // Convert list of card IDs to list of card instances
    const deckCardInstances = selectedDeckList.map(cardId => {
        const cardData = cardLibrary.find(c => c.id === cardId);
        if (!cardData) {
            console.error(`Card data not found in library for ID: ${cardId} while building deck.`);
            return null; // Handle missing card data
        }
        // Create a basic instance structure; gameLogic will create full instances
        // We pass the IDs to gameLogic now.
        return cardId;
    }).filter(id => id !== null); // Filter out any nulls if card data was missing

     if (deckCardInstances.length !== 30) {
         console.error(`Error creating deck instances. Expected 30, got ${deckCardInstances.length}.`);
         alert("Error: Could not prepare the selected deck. Cannot start game.");
         return;
     }


    hideDeckSelection();
    // Call the actual game start function with the hero and the list of card IDs
    startGameWithHero(currentHero, deckCardInstances, isDebugMode);
}

// --- Helper Functions (for future custom deck implementation) ---
// function loadCustomDecksForHero(heroId) {
//     // Placeholder: Load deck names/ids from localStorage or a server
//     return [
//         // { name: "My Custom Warrior Deck", id: "custom_warrior_1" },
//     ];
// }

// function loadCustomDeck(deckId) {
//     // Placeholder: Load the actual card list for a custom deck
//     // const deckData = localStorage.getItem(deckId);
//     // return deckData ? JSON.parse(deckData) : null;
//     return null;
// }
