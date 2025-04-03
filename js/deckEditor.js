// /js/deckEditor.js
import { getDOMElement } from './dom.js';
import { cardLibrary } from './cards.js';
import { heroData } from './heroes.js';
import { createCardElement } from './render.js'; // Re-use card rendering
import { showOpeningMenu } from './menu.js'; // To return to menu

const MAX_DECK_SIZE = 30;
const MAX_LEGENDARY_COPIES = 1;
const MAX_OTHER_COPIES = 2;
const LOCAL_STORAGE_KEY_PREFIX = 'customDecks_';

let deckEditorScreenEl = null;
let heroSelectEl = null;
let deckSelectEl = null;
let deckNameInputEl = null;
let saveButtonEl = null;
let deleteButtonEl = null;
let exitButtonEl = null;
let cardCountEl = null;
let collectionContainerEl = null;
let currentDeckContainerEl = null;

let currentHeroId = null;
let currentDeck = []; // Array of card IDs
let collectionCards = []; // Array of card objects available to the hero
let savedDecks = {}; // { heroId: { deckName: [cardId1, cardId2,...], ... }, ... }

// --- Initialization ---

export function initDeckEditor() {
    console.log("Initializing Deck Editor...");
    deckEditorScreenEl = getDOMElement('deckEditorScreenEl');
    heroSelectEl = getDOMElement('deckEditorHeroSelectEl');
    deckSelectEl = getDOMElement('deckEditorDeckSelectEl');
    deckNameInputEl = getDOMElement('deckEditorDeckNameEl');
    saveButtonEl = getDOMElement('deckEditorSaveButtonEl');
    deleteButtonEl = getDOMElement('deckEditorDeleteButtonEl');
    exitButtonEl = getDOMElement('deckEditorExitButtonEl');
    cardCountEl = getDOMElement('deckEditorCardCountEl');
    collectionContainerEl = getDOMElement('deckEditorCollectionEl');
    currentDeckContainerEl = getDOMElement('deckEditorCurrentDeckEl');

    if (!deckEditorScreenEl || !heroSelectEl || !deckSelectEl || !deckNameInputEl || !saveButtonEl || !deleteButtonEl || !exitButtonEl || !cardCountEl || !collectionContainerEl || !currentDeckContainerEl) {
        console.error("Deck editor elements not found!");
        return;
    }

    // Populate hero select dropdown
    heroData.forEach(hero => {
        const option = document.createElement('option');
        option.value = hero.id;
        option.textContent = hero.name;
        heroSelectEl.appendChild(option);
    });

    // Add event listeners
    heroSelectEl.addEventListener('change', handleHeroChange);
    deckSelectEl.addEventListener('change', handleDeckChange);
    saveButtonEl.addEventListener('click', handleSaveDeck);
    deleteButtonEl.addEventListener('click', handleDeleteDeck);
    exitButtonEl.addEventListener('click', hideDeckEditor);

    // Load saved decks from localStorage
    loadAllSavedDecks();

    // Set initial hero and load their data
    if (heroData.length > 0) {
        currentHeroId = heroData[0].id;
        heroSelectEl.value = currentHeroId;
        loadHeroData();
    }
}

export function showDeckEditor() {
    if (!deckEditorScreenEl) {
        console.error("Deck editor not initialized. Cannot show.");
        // Attempt initialization now
        initDeckEditor();
        if (!deckEditorScreenEl) return; // Still failed
    }
    console.log("Showing Deck Editor");
    deckEditorScreenEl.classList.add('visible');
    deckEditorScreenEl.classList.remove('hidden');

    // Ensure the initial hero's data is loaded if it wasn't already
    if (!currentHeroId && heroData.length > 0) {
        currentHeroId = heroData[0].id;
        heroSelectEl.value = currentHeroId;
    }
    loadHeroData(); // Load data for the currently selected hero
}

function hideDeckEditor() {
    if (deckEditorScreenEl) {
        deckEditorScreenEl.classList.remove('visible');
        deckEditorScreenEl.classList.add('hidden');
    }
    // Optionally show the main menu again
    showOpeningMenu();
}

// --- Data Loading and Handling ---

function loadHeroData() {
    if (!currentHeroId) return;
    console.log(`Loading data for hero: ${currentHeroId}`);

    // 1. Filter collectible cards for the selected hero
    const hero = heroData.find(h => h.id === currentHeroId);
    const heroClassCards = cardLibrary.filter(card => hero?.uniqueCardIds.includes(card.id));
    const commonCards = cardLibrary.filter(card => card.collectible !== false && !card.heroSpecific);

    // Combine and sort (e.g., by cost, then name)
    collectionCards = [...commonCards, ...heroClassCards]
        .filter(card => card.collectible !== false) // Ensure only collectible cards
        .sort((a, b) => {
            if (a.cost !== b.cost) return a.cost - b.cost;
            return a.name.localeCompare(b.name);
        });

    // 2. Populate the deck selection dropdown for this hero
    populateDeckSelect();

    // 3. Reset current deck view and name
    clearDeck();
    deckNameInputEl.value = '';

    // 4. Render the collection
    renderCollection();
    renderCurrentDeck(); // Render empty deck initially
}

function loadAllSavedDecks() {
    savedDecks = {};
    heroData.forEach(hero => {
        const key = `${LOCAL_STORAGE_KEY_PREFIX}${hero.id}`;
        const data = localStorage.getItem(key);
        if (data) {
            try {
                savedDecks[hero.id] = JSON.parse(data);
                console.log(`Loaded saved decks for ${hero.id}:`, savedDecks[hero.id]);
            } catch (e) {
                console.error(`Failed to parse saved decks for ${hero.id}:`, e);
                savedDecks[hero.id] = {}; // Initialize as empty if parsing fails
            }
        } else {
            savedDecks[hero.id] = {}; // Initialize if no data found
        }
    });
}

function populateDeckSelect() {
    deckSelectEl.innerHTML = '<option value="new">-- New Deck --</option>'; // Reset options
    const heroDecks = savedDecks[currentHeroId] || {};
    for (const deckName in heroDecks) {
        const option = document.createElement('option');
        option.value = deckName;
        option.textContent = deckName;
        deckSelectEl.appendChild(option);
    }
}

// --- Event Handlers ---

function handleHeroChange(event) {
    currentHeroId = event.target.value;
    loadHeroData();
}

function handleDeckChange(event) {
    const selectedDeckName = event.target.value;
    if (selectedDeckName === 'new') {
        clearDeck();
        deckNameInputEl.value = '';
        deckNameInputEl.disabled = false;
        deleteButtonEl.disabled = true; // Cannot delete "-- New Deck --"
    } else {
        const heroDecks = savedDecks[currentHeroId] || {};
        currentDeck = [...(heroDecks[selectedDeckName] || [])]; // Load selected deck (copy array)
        deckNameInputEl.value = selectedDeckName;
        deckNameInputEl.disabled = true; // Prevent renaming existing deck via input
        deleteButtonEl.disabled = false; // Can delete loaded deck
        renderCurrentDeck();
        renderCollection(); // Re-render collection to update counts/availability
        updateCardCount();
    }
}

function handleSaveDeck() {
    const deckName = deckNameInputEl.value.trim();
    if (!deckName) {
        alert("Please enter a deck name.");
        return;
    }
    if (currentDeck.length !== MAX_DECK_SIZE) {
        alert(`Deck must contain exactly ${MAX_DECK_SIZE} cards.`);
        return;
    }

    if (!savedDecks[currentHeroId]) {
        savedDecks[currentHeroId] = {};
    }

    // Check if overwriting or saving new
    const isOverwriting = savedDecks[currentHeroId].hasOwnProperty(deckName);
    if (isOverwriting) {
        if (!confirm(`Deck "${deckName}" already exists. Overwrite?`)) {
            return;
        }
    }

    savedDecks[currentHeroId][deckName] = [...currentDeck]; // Save a copy

    try {
        const key = `${LOCAL_STORAGE_KEY_PREFIX}${currentHeroId}`;
        localStorage.setItem(key, JSON.stringify(savedDecks[currentHeroId]));
        console.log(`Deck "${deckName}" saved for hero ${currentHeroId}.`);
        alert(`Deck "${deckName}" saved successfully!`);

        // Update deck select dropdown
        populateDeckSelect();
        deckSelectEl.value = deckName; // Select the saved deck
        deckNameInputEl.disabled = true; // Disable input after save
        deleteButtonEl.disabled = false; // Enable delete for saved deck
    } catch (e) {
        console.error("Failed to save deck to localStorage:", e);
        alert("Error saving deck. Storage might be full.");
        // Revert state if save failed? Maybe not necessary.
    }
}

function handleDeleteDeck() {
    const deckName = deckSelectEl.value;
    if (deckName === 'new' || !deckName) {
        alert("Cannot delete. Please select a saved deck.");
        return;
    }

    if (confirm(`Are you sure you want to delete the deck "${deckName}"?`)) {
        if (savedDecks[currentHeroId] && savedDecks[currentHeroId][deckName]) {
            delete savedDecks[currentHeroId][deckName];
            try {
                const key = `${LOCAL_STORAGE_KEY_PREFIX}${currentHeroId}`;
                localStorage.setItem(key, JSON.stringify(savedDecks[currentHeroId]));
                console.log(`Deck "${deckName}" deleted for hero ${currentHeroId}.`);
                alert(`Deck "${deckName}" deleted.`);

                // Reset UI to "New Deck" state
                populateDeckSelect();
                clearDeck();
                deckNameInputEl.value = '';
                deckNameInputEl.disabled = false;
                deleteButtonEl.disabled = true;
            } catch (e) {
                console.error("Failed to update localStorage after delete:", e);
                alert("Error deleting deck from storage.");
                // Re-add deck to local state if storage update failed?
                // loadAllSavedDecks(); // Or reload all decks
            }
        }
    }
}

// --- Card Management ---

function addCardToDeck(card) {
    if (currentDeck.length >= MAX_DECK_SIZE) {
        console.log("Deck is full.");
        return false; // Deck full
    }

    const count = currentDeck.filter(id => id === card.id).length;
    const maxCopies = card.rarity === 'legendary' ? MAX_LEGENDARY_COPIES : MAX_OTHER_COPIES;

    if (count >= maxCopies) {
        console.log(`Cannot add more copies of ${card.name} (Max: ${maxCopies})`);
        return false; // Max copies reached
    }

    currentDeck.push(card.id);
    console.log(`Added ${card.name} to deck. Count: ${count + 1}`);
    return true; // Successfully added
}

function removeCardFromDeck(cardId) {
    const index = currentDeck.lastIndexOf(cardId); // Find last instance to remove
    if (index > -1) {
        currentDeck.splice(index, 1);
        console.log(`Removed card ID ${cardId} from deck.`);
        return true;
    }
    console.log(`Card ID ${cardId} not found in deck to remove.`);
    return false; // Card not found
}

function clearDeck() {
    currentDeck = [];
    renderCurrentDeck();
    renderCollection(); // Update collection availability
    updateCardCount();
}

// --- Rendering ---

function renderCollection() {
    if (!collectionContainerEl) return;
    collectionContainerEl.innerHTML = '<h3>Collection</h3>'; // Clear previous

    collectionCards.forEach(card => {
        const cardEl = createCardElement(card, 'collection'); // Use 'collection' location

        const countInDeck = currentDeck.filter(id => id === card.id).length;
        const maxCopies = card.rarity === 'legendary' ? MAX_LEGENDARY_COPIES : MAX_OTHER_COPIES;
        const canAddMore = currentDeck.length < MAX_DECK_SIZE && countInDeck < maxCopies;

        if (!canAddMore) {
            cardEl.classList.add('cannot-add');
        } else {
            cardEl.addEventListener('click', () => {
                if (addCardToDeck(card)) {
                    renderCurrentDeck(); // Update deck display
                    renderCollection(); // Update collection display (counts/availability)
                    updateCardCount();
                    // Ensure deck name input is enabled if we modify a loaded deck
                    if (deckSelectEl.value !== 'new') {
                        deckNameInputEl.disabled = false;
                    }
                }
            });
        }

        // Add count indicator if card is in deck
        if (countInDeck > 0) {
            const countIndicator = document.createElement('div');
            countIndicator.classList.add('card-in-deck-count');
            countIndicator.textContent = countInDeck;
            cardEl.appendChild(countIndicator);
        }

        collectionContainerEl.appendChild(cardEl);
    });
}

function renderCurrentDeck() {
    if (!currentDeckContainerEl) return;
    currentDeckContainerEl.innerHTML = '<h3>Current Deck</h3>'; // Clear previous

    // Create a map of card counts for efficient display
    const deckCardCounts = currentDeck.reduce((acc, cardId) => {
        acc[cardId] = (acc[cardId] || 0) + 1;
        return acc;
    }, {});

    // Get unique card IDs from the deck and sort them
    const uniqueCardIds = Object.keys(deckCardCounts);
    const sortedCards = uniqueCardIds
        .map(id => cardLibrary.find(c => c.id === id))
        .filter(Boolean) // Filter out potential nulls if card not found
        .sort((a, b) => {
            if (a.cost !== b.cost) return a.cost - b.cost;
            return a.name.localeCompare(b.name);
        });

    // Render each unique card with its count
    sortedCards.forEach(card => {
        const cardEl = createCardElement(card, 'deck-editor-deck'); // Use specific location type
        const count = deckCardCounts[card.id];

        // Add count indicator
        const countIndicator = document.createElement('div');
        countIndicator.classList.add('card-in-deck-count');
        countIndicator.textContent = count;
        cardEl.appendChild(countIndicator);

        // Add click listener to remove card
        cardEl.addEventListener('click', () => {
            if (removeCardFromDeck(card.id)) {
                renderCurrentDeck(); // Update deck display
                renderCollection(); // Update collection display
                updateCardCount();
                 // Ensure deck name input is enabled if we modify a loaded deck
                 if (deckSelectEl.value !== 'new') {
                    deckNameInputEl.disabled = false;
                }
            }
        });

        currentDeckContainerEl.appendChild(cardEl);
    });
}

function updateCardCount() {
    if (cardCountEl) {
        cardCountEl.textContent = `Cards: ${currentDeck.length}/${MAX_DECK_SIZE}`;
        // Optionally add styling if count is invalid/valid
        if (currentDeck.length === MAX_DECK_SIZE) {
            cardCountEl.style.color = 'lightgreen';
        } else {
            cardCountEl.style.color = 'white'; // Default color
        }
    }
}

// Ensure init is called when the script loads or is imported
// initDeckEditor(); // Called from main.js or when shown now
