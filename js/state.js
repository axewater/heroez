import { STARTING_HEALTH, MAX_MANA } from './constants.js';

// Centralized game state
// --- Initialize state with default structure and settings ---
let state = {
    players: { player: null, opponent: null },
    firstPlayerId: null,
    isDebugMode: false,
    currentPlayerId: 'player',
    turn: 0,
    gameOver: false,
    message: "",
    selectedCard: null,
    selectedAttacker: null,
    targetingMode: null,
    spellTargetType: null,
    activeEffects: [],
    settings: { // Default settings defined here
        musicEnabled: true,
        musicVolume: 0.4,
        sfxEnabled: true,
        sfxVolume: 0.7,
    },
    mulliganActive: false,
    mulliganSelectedIndices: [],
};

const SETTINGS_STORAGE_KEY = 'aceBattlerSettings';
// Function to initialize or reset the state
export function resetState(initialPlayerDeck = [], initialOpponentDeck = []) {
    state = {
        players: {
            player: {
                id: 'player',
                heroHealth: STARTING_HEALTH,
                maxMana: 0,
                currentMana: 0,
                drawPile: [...initialPlayerDeck], // Renamed from deck
                hand: [],
                board: [],
                discardPile: [], // Added discard pile
                // DOM elements will be assigned in initGame after DOM is ready
                heroData: null, // Added to store selected hero details
                heroElement: null,
                healthElement: null,
                manaElement: null,
                drawPileElement: null, // Added draw pile element ref
                discardPileElement: null, // Added discard pile element ref
                handElement: null,
                boardElement: null,
            },
            opponent: {
                id: 'opponent',
                heroHealth: STARTING_HEALTH,
                maxMana: 0,
                currentMana: 0,
                drawPile: [...initialOpponentDeck], // Renamed from deck
                hand: [],
                board: [],
                discardPile: [], // Added discard pile
                 // DOM elements will be assigned in initGame after DOM is ready
                heroData: null, // Added to store selected hero details
                heroElement: null,
                healthElement: null,
                manaElement: null,
                drawPileElement: null, // Added draw pile element ref
                discardPileElement: null, // Added discard pile element ref
                handElement: null,
                boardElement: null,
            }
        },
        firstPlayerId: null, // Added to store who goes first
        isDebugMode: false, // Added debug mode flag
        currentPlayerId: 'player',
        turn: 0,
        gameOver: false,
        message: "",
        selectedCard: null, // { card, location: 'hand'/'board', index (if hand) }
        selectedAttacker: null, // instanceId of creature attacking
        targetingMode: null, // 'spell', 'attack', null
        spellTargetType: null, // 'any', 'creature', 'opponent-board', 'self', etc.
        activeEffects: [], // For tracking temporary effects, auras etc.
        settings: { ...state.settings }, // Copy initial default settings
        mulliganActive: false, // Is the mulligan phase currently active?
        mulliganSelectedIndices: [], // Array of hand indices selected for mulligan
    };
    console.log("Game state reset.");
}

// --- State Accessors/Mutators ---

export function getPlayer(playerId) {
    return state.players[playerId];
}

export function getCurrentPlayer() {
    return state.players[state.currentPlayerId];
}

export function getOpponentPlayer() {
    return state.players[getOpponentId(state.currentPlayerId)];
}

export function getOpponentId(playerId) {
    return playerId === 'player' ? 'opponent' : 'player';
}

export function setCurrentPlayerId(playerId) {
    state.currentPlayerId = playerId;
}

export function setFirstPlayerId(playerId) {
    state.firstPlayerId = playerId;
}

export function incrementTurn() {
    state.turn++;
}

export function setGameOver(isGameOver, message = "") {
    state.gameOver = isGameOver;
    state.message = message;
    console.log(`Game Over set to ${isGameOver}. Message: ${message}`);
}

export function setMessageState(newMessage) {
    state.message = newMessage;
    // Note: This only updates the state. UI update is separate.
}

export function setSelectedCard(cardData) {
    state.selectedCard = cardData; // cardData = { card, location, index } or null
}

export function getSelectedCard() {
    return state.selectedCard;
}

export function setSelectedAttacker(cardInstance) {
    state.selectedAttacker = cardInstance; // cardInstance or null
}

export function getSelectedAttacker() {
    return state.selectedAttacker;
}

export function setTargetingMode(mode, spellTargetType = null) {
    state.targetingMode = mode; // 'spell', 'attack', or null
    state.spellTargetType = spellTargetType;
}

export function getTargetingMode() {
    return {
        mode: state.targetingMode,
        spellTargetType: state.spellTargetType
    };
}

export function setDebugMode(isDebug) {
    state.isDebugMode = !!isDebug; // Ensure boolean
}

export function isGameOver() {
    return state.gameOver;
}

export function isMulliganActive() {
    return state.mulliganActive;
}

export function getMulliganSelectedIndices() {
    return state.mulliganSelectedIndices;
}

export function getCurrentMessage() {
    return state.message;
}

export function getTurn() {
    return state.turn;
}

// --- Direct State Access (Use with caution) ---
// Allows other modules to read parts of the state directly if needed.
// Avoid direct mutation from outside state.js where possible.
export function getState() {
    return state;
}

// --- Settings Load/Save ---
export function loadSettings() {
    // Define default settings structure here as well for fallback
    const defaultSettings = {
        musicEnabled: true,
        musicVolume: 0.4,
        sfxEnabled: true,
        sfxVolume: 0.7,
    };

    const savedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (savedSettings) {
        try {
            const parsed = JSON.parse(savedSettings);
            // Merge saved settings with defaults (in case new settings were added)
            state.settings = { ...defaultSettings, ...parsed }; // Use defaultSettings as base
            console.log("Loaded settings:", state.settings);
        } catch (e) {
            console.error("Failed to parse saved settings:", e);
            state.settings = { ...defaultSettings }; // Explicitly fall back to defaults on error
        }
    } else {
        console.log("No saved settings found, using defaults.");
    }
}
export function saveSettings() {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(state.settings));
    console.log("Settings saved:", state.settings);
}
