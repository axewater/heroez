import { STARTING_HEALTH, MAX_MANA } from './constants.js';
import { getDOMElement } from './ui.js';

// Centralized game state
let state = {};

// Function to initialize or reset the state
export function resetState() {
    state = {
        players: {
            player: {
                id: 'player',
                heroHealth: STARTING_HEALTH,
                maxMana: 0,
                currentMana: 0,
                deck: [],
                hand: [],
                board: [],
                fatigue: 0,
                // DOM elements will be assigned in initGame after DOM is ready
                heroElement: null,
                healthElement: null,
                manaElement: null,
                deckElement: null,
                handElement: null,
                boardElement: null,
            },
            opponent: {
                id: 'opponent',
                heroHealth: STARTING_HEALTH,
                maxMana: 0,
                currentMana: 0,
                deck: [],
                hand: [],
                board: [],
                fatigue: 0,
                 // DOM elements will be assigned in initGame after DOM is ready
                heroElement: null,
                healthElement: null,
                manaElement: null,
                deckElement: null,
                handElement: null,
                boardElement: null,
            }
        },
        currentPlayerId: 'player',
        turn: 0,
        gameOver: false,
        message: "",
        selectedCard: null, // { card, location: 'hand'/'board', index (if hand) }
        selectedAttacker: null, // instanceId of creature attacking
        targetingMode: null, // 'spell', 'attack', null
        spellTargetType: null, // 'any', 'creature', 'opponent-board', 'self', etc.
        activeEffects: [], // For tracking temporary effects, auras etc.
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

export function isGameOver() {
    return state.gameOver;
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
