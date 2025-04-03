import { MAX_MANA, STARTING_HEALTH, STARTING_HAND_SIZE, MAX_BOARD_SIZE, MAX_HAND_SIZE } from './constants.js';
import { cardLibrary } from './cards.js';
import { resetState, getState, getPlayer, getCurrentPlayer, getOpponentPlayer, getOpponentId, setCurrentPlayerId, incrementTurn, getTurn, setGameOver, setMessageState, isGameOver } from './state.js';
import { renderGame, updatePlayableCards } from './render.js';
import { setMessage, logMessage } from './messaging.js';
import { showGameOverScreen, hideGameOverScreen } from './uiState.js';
import { cacheDOMElements, getDOMElement, assignElementsToPlayerState } from './dom.js';
import { dealDamage } from './cardEffects.js'; // Needed for fatigue
import { runAITurn } from './aiCore.js';

// --- Game Setup ---

export function initGame() {
    console.log("Initializing game...");
    cacheDOMElements(); // Find and store DOM elements
    hideGameOverScreen();

    // --- Build Decks (Needed before resetState) ---
    const allPlayerCards = [];
    const allOpponentCards = [];
    cardLibrary.filter(c => c.collectible !== false).forEach(card => {
        // Create temporary instances just for the deck list; owner will be set properly by resetState if needed or by draw
        allPlayerCards.push(createCardInstance(card, 'player'));
        allPlayerCards.push(createCardInstance(card, 'player'));
        allOpponentCards.push(createCardInstance(card, 'opponent'));
        allOpponentCards.push(createCardInstance(card, 'opponent'));
    });

    // --- Initialize State First ---
    resetState(allPlayerCards, allOpponentCards); // Initialize/reset the state object, pass decks

    // --- Now Access Player Data ---
    const player = getPlayer('player');
    const opponent = getPlayer('opponent');

    // Assign DOM elements after state is initialized and players exist
    assignElementsToPlayerState(getPlayer);

    // Shuffle the decks that are now in the state
    player.deck = shuffleDeck([...player.deck]); // Shuffle the deck copies from state
    opponent.deck = shuffleDeck([...opponent.deck]);

    // Draw initial hands
    for (let i = 0; i < STARTING_HAND_SIZE; i++) {
        drawCard(player);
        drawCard(opponent);
    }

    // Start the first turn (Player 1)
    player.maxMana = 1;
    player.currentMana = 1;
    opponent.maxMana = 0; // Opponent starts with 0 mana crystals available on Player 1's turn 1
    opponent.currentMana = 0;

    logMessage("Game Starting...", 'log-info');
    renderGame(); // Initial render before first turn starts

    // Delay slightly before starting the first turn for effect
    setTimeout(() => {
         startTurn('player');
         console.log("Game Initialized:", getState());
    }, 500);

}

export function createCardInstance(cardData, ownerId) {
    // Create a unique instance of a card from the library
    const libraryCard = cardLibrary.find(c => c.id === cardData.id); // Get fresh data
    if (!libraryCard) {
        console.error(`Card data not found in library for id: ${cardData.id}`);
        return null; // Or handle error appropriately
    }
    return {
        ...libraryCard, // Copy properties from library
        instanceId: generateId(), // Assign unique ID for this specific card instance
        owner: ownerId,
        currentHealth: libraryCard.health, // Initialize current health
        currentAttack: libraryCard.attack, // Initialize current attack
        // --- Runtime State (initialized here or when played/entering zone) ---
        canAttack: false,       // Can it attack this turn? (Set true on turn start if eligible)
        hasAttacked: false,     // Has it attacked this turn? (Reset on turn start)
        isFrozen: false,        // Frozen state (Reset on turn start)
        justPlayed: false,      // Played this turn? (Summoning Sickness - set true when played, false on turn start)
        effects: [],            // For temporary effects, statuses etc.
        // --- Derived State (set based on mechanics for easier access) ---
        isTaunt: !!libraryCard.mechanics?.includes("Taunt"),
        isSwift: !!libraryCard.mechanics?.includes("Swift"),
        // Add more state as needed (isStealthed, poisonCounters, etc.)
    };
}

export function generateId() {
    return Math.random().toString(36).substring(2, 11); // Longer ID for less collision chance
}

export function shuffleDeck(deck) {
    // Fisher-Yates (Knuth) Shuffle
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]]; // Swap elements
    }
    return deck;
}

// --- Turn Management ---

export function startTurn(playerId) {
    if (isGameOver()) return;

    incrementTurn();
    setCurrentPlayerId(playerId);
    const player = getCurrentPlayer();
    const opponent = getOpponentPlayer();
    console.log(`--- Turn ${getTurn()}: ${playerId} ---`);
    logMessage(`--- Turn ${getTurn()} (${playerId}) ---`, 'log-turn');

    // Increase Max Mana (up to MAX_MANA)
    if (player.maxMana < MAX_MANA) {
        player.maxMana++;
    }
    // Refill Mana
    player.currentMana = player.maxMana;

    // --- Start of Turn Effects & Resets ---
    // 1. Reset attack state for player's creatures
    // 2. Remove summoning sickness ('justPlayed')
    // 3. Unfreeze
    // 4. TODO: Handle other start-of-turn effects (e.g., card triggers)
    player.board.forEach(creature => {
        creature.hasAttacked = false;
        if (creature.isFrozen) {
            creature.isFrozen = false; // Unfreeze at start of turn
            creature.canAttack = !creature.justPlayed; // Can attack if not just played
        } else if (creature.justPlayed) {
            creature.justPlayed = false; // Remove summoning sickness
            creature.canAttack = true; // Can attack now (unless frozen, handled above)
        } else {
            creature.canAttack = true; // Already on board, can attack
        }
        // Ensure Swift creatures that were just played can still attack
        if (creature.isSwift) creature.canAttack = true;
        // Ensure frozen creatures definitely cannot attack
        if (creature.isFrozen) creature.canAttack = false;
        // Ensure 0 attack creatures cannot attack
        if (creature.currentAttack <= 0) creature.canAttack = false;
    });

    // TODO: Handle opponent's start-of-turn effects if any apply during player's turn (unlikely)

    // Draw a card
    drawCard(player);

    // Update UI
    // setMessageState(`${playerId}'s turn.`); // State message is less useful now
    setMessage(`${playerId}'s turn.`); // Update prompt bar
    renderGame(); // Render after state updates but before AI turn

    // Enable/disable button
    const endTurnButton = getDOMElement('endTurnButton');
    if (endTurnButton) endTurnButton.disabled = playerId !== 'player';

    // If it's the AI's turn, run its logic
    if (playerId === 'opponent') {
        setMessage("Opponent is thinking..."); // Show message while AI thinks
        // Disable player actions during AI turn (already handled by button disable and event checks)
        setTimeout(runAITurn, 1000); // Add delay for visibility
    }
}

export function endTurn() {
    if (isGameOver()) return;

    const currentPlayerId = getState().currentPlayerId;
    const currentPlayer = getCurrentPlayer();
    logMessage(`${currentPlayerId} ends turn.`);
    console.log(`${currentPlayerId} ends turn.`);

    // --- End of Turn Effects ---
    // TODO: Implement end-of-turn triggers (e.g., Poison, card effects)
    // Example: Clear temporary buffs
    // currentPlayer.board.forEach(c => {
    //     c.effects = c.effects?.filter(effect => {
    //         if (effect.type === 'tempBuff') {
    //             c.currentAttack -= effect.attack;
    //             c.currentHealth -= effect.health; // Be careful with health reduction
    //             // Handle duration decrement if implemented
    //             return false; // Remove effect
    //         }
    //         return true; // Keep other effects
    //     });
    // });

    // Check win condition *before* starting next turn (e.g., if end-of-turn effect was lethal)
    if (checkWinCondition()) return;

    // Start the next player's turn
    const nextPlayerId = getOpponentId(currentPlayerId);
    startTurn(nextPlayerId);
}

// --- Card Drawing ---

export function drawCard(player) {
    if (player.hand.length >= MAX_HAND_SIZE) {
        const burnedCard = player.deck.pop(); // Remove card from deck
        const cardName = burnedCard?.name || 'a card';
        console.log(`${player.id} hand full! Card burned: ${cardName}`);
        logMessage(`${player.id}'s hand is full! Burned ${cardName}.`, 'log-error');
        // Optionally show burned card briefly?
    } else if (player.deck.length > 0) {
        const card = player.deck.pop();
        player.hand.push(card);
        logMessage(`${player.id} draws ${card.name}.`);
        console.log(`${player.id} drew ${card.name}`);
        // TODO: Trigger draw effects if any
    } else {
        // Fatigue damage
        player.fatigue++;
        logMessage(`${player.id} is out of cards and takes ${player.fatigue} fatigue damage!`, 'log-error');
        console.log(`${player.id} deck empty! Taking ${player.fatigue} fatigue damage.`);
        setMessage(`${player.id} is out of cards and takes ${player.fatigue} fatigue damage!`);
        dealDamage(player.heroElement, player.fatigue); // dealDamage handles visuals and health update
        // Check win condition after fatigue damage
        checkWinCondition();
    }
    // No need to re-render here, startTurn/endTurn calls renderGame
    // But update player info immediately if not part of start/end turn?
    // renderPlayerInfo(player); // Maybe needed if called outside turn sequence
}


// --- Win Condition & Game Over ---

export function checkWinCondition() {
    if (isGameOver()) return true; // Already over

    const player = getPlayer('player');
    const opponent = getPlayer('opponent');

    if (player.heroHealth <= 0 && opponent.heroHealth <= 0) {
        gameOver("Draw!"); // Or decide winner based on who reached 0 first if tracked
        return true;
    }
    if (player.heroHealth <= 0) {
        gameOver("Opponent Wins!");
        return true;
    }
    if (opponent.heroHealth <= 0) {
        gameOver("Player Wins!");
        return true;
    }
    return false; // Game continues
}

export function gameOver(message) {
    console.log("Game Over:", message);
    setGameOver(true, message);
    setMessage(message); // Update message bar immediately with final result
    logMessage(`--- Game Over: ${message} ---`, 'log-turn'); // Log final result
    showGameOverScreen(message); // Show the overlay
}
