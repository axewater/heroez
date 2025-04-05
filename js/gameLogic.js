import { MAX_MANA, STARTING_HEALTH, STARTING_HAND_SIZE, MAX_BOARD_SIZE, MAX_HAND_SIZE, AI_TURN_START_DELAY } from './constants.js';
import { cardLibrary } from './cards.js';
import { resetState, getState, getPlayer, getCurrentPlayer, getOpponentPlayer, getOpponentId, setCurrentPlayerId, incrementTurn, getTurn, setGameOver, setMessageState, isGameOver, setDebugMode, setFirstPlayerId } from './state.js';
import { renderGame, updatePlayableCards } from './render.js';
import { setMessage, logMessage } from './messaging.js';
import { showGameOverScreen, hideGameOverScreen, showGameUI, hideGameUI } from './uiState.js';
import { cacheDOMElements, getDOMElement, assignElementsToPlayerState } from './dom.js';
import { dealDamage } from './cardEffects.js'; // Needed for fatigue
import { runAITurn } from './aiCore.js';
import { showMulliganUI, hideMulliganUI } from './mulligan.js'; // Import mulligan UI functions
import { defaultDecks } from './decks.js'; // Import default deck data
import { animateStartGameCoinFlip } from './animations.js'; // Import the new coin flip animation function
import { playAudio, stopCurrentAudio } from './audioUtils.js'; // Import audio playback utility
import { heroData } from './heroes.js'; // Import hero data to get opponent details

const AVAILABLE_BACKGROUNDS = ['bg01.png', 'bg02.png', 'bg03.png', 'bg04.png'];
const STARTING_DRAW_DELAY = 1500; // Delay after showing who goes first before mulligan
const COIN_FLIP_DURATION = 1500; // Duration of the coin flip animation in ms
const STARTING_DRAW_VISUAL_PAUSE = 1000; // Pause to see the result

// --- Game Setup ---

export function initGame() {
    // This function is now primarily for resetting after a game ends.
    // The initial setup (deck building, etc.) happens in startGameWithHero.
    console.log("Initializing game...");
    cacheDOMElements(); // Find and store DOM elements
    hideGameOverScreen();
    hideGameUI(); // Ensure game UI is hidden before starting
    // The actual game start logic is now in startGameWithHero
}

export async function startGameWithHero(selectedHero, playerDeckCardIds, isDebug = false) {
    console.log("[GameLogic] startGameWithHero called for:", selectedHero?.name);
    console.log(`Starting game with hero: ${selectedHero.name}, Deck size: ${playerDeckCardIds.length}`);
    console.log(`[GameLogic] Debug mode: ${isDebug}`);

    cacheDOMElements(); // Ensure elements are cached
    hideGameOverScreen(); // Ensure overlay is hidden

    // --- Set Random Background ---
    const gameMainAreaEl = getDOMElement('gameMainArea');
    if (gameMainAreaEl) {
        const randomBackground = AVAILABLE_BACKGROUNDS[Math.floor(Math.random() * AVAILABLE_BACKGROUNDS.length)];
        gameMainAreaEl.style.backgroundImage = `url('img/areas/${randomBackground}')`;
        console.log(`[GameLogic] Set background to: ${randomBackground}`);
    }
    // --- End Set Random Background ---

    // --- Create Player Draw Pile Instances ---
    const playerDrawPileInstances = playerDeckCardIds.map(cardId => createCardInstanceById(cardId, 'player')).filter(Boolean);

    // --- Determine Opponent Hero and Deck ---
    // For now, pick a random hero that isn't the player's selected hero
    const availableOpponentHeroes = heroData.filter(h => h.id !== selectedHero.id);
    const opponentHero = availableOpponentHeroes.length > 0
        ? availableOpponentHeroes[Math.floor(Math.random() * availableOpponentHeroes.length)]
        : heroData.find(h => h.id !== selectedHero.id) || heroData[0]; // Fallback if only one hero exists

    console.log(`[GameLogic] Opponent hero selected: ${opponentHero.name}`);
    const opponentDefaultDeckIds = defaultDecks[opponentHero.id] || defaultDecks[Object.keys(defaultDecks)[0]]; // Use opponent's default deck or first available
    const opponentDrawPileInstances = opponentDefaultDeckIds.map(cardId => createCardInstanceById(cardId, 'opponent')).filter(Boolean);

    // Shuffle the draw pile lists before passing to resetState
    const initialPlayerDrawPile = shuffleDeck(playerDrawPileInstances);
    const initialOpponentDrawPile = shuffleDeck(opponentDrawPileInstances);
    console.log(`[GameLogic] Initial Player Draw Pile Size: ${initialPlayerDrawPile.length}, Opponent: ${initialOpponentDrawPile.length}`);

    // --- Initialize State First ---
    resetState(initialPlayerDrawPile, initialOpponentDrawPile); // Initialize/reset the state object, pass draw piles
    getState().isDebugMode = isDebug; // Set the debug mode in the state

    // --- Now Access Player Data ---
    const player = getPlayer('player');
    const opponent = getPlayer('opponent');

    player.heroData = selectedHero; // Store selected hero data in state
    opponent.heroData = opponentHero; // Store opponent hero data in state

    // Assign DOM elements after state is initialized and players exist
    assignElementsToPlayerState(getPlayer);

    // --- Hero Announcement Sequence ---
    const announcementOverlay = getDOMElement('heroAnnouncementOverlayEl');
    const announcementPlayerPortrait = getDOMElement('announcementPlayerPortraitEl');
    const announcementOpponentPortrait = getDOMElement('announcementOpponentPortraitEl');

    if (announcementOverlay && announcementPlayerPortrait && announcementOpponentPortrait && player.heroData?.portrait && opponent.heroData?.portrait) {
        console.log("Starting hero announcement sequence...");
        announcementPlayerPortrait.src = player.heroData.portrait;
        announcementOpponentPortrait.src = opponent.heroData.portrait;

        announcementOverlay.classList.remove('hidden'); // Make overlay visible

        try {
            // Wait briefly for CSS transition to start
            await new Promise(resolve => setTimeout(resolve, 100));

            // Play sounds sequentially
            if (player.heroData.audioName) await playAudio(player.heroData.audioName);
            await playAudio('versus.mp3');
            if (opponent.heroData.audioName) await playAudio(opponent.heroData.audioName);

            // Wait a bit after sounds finish before hiding
            await new Promise(resolve => setTimeout(resolve, 500));

        } catch (error) {
            console.error("Error during announcement audio playback:", error);
        } finally {
            announcementOverlay.classList.add('hidden'); // Hide overlay
            console.log("Hero announcement sequence finished.");
        }
    } else {
        console.warn("Skipping hero announcement: Elements or hero data missing.");
    }
    // --- End Hero Announcement Sequence ---

    // --- Determine Starting Player ---
    setMessage("Determining who goes first..."); // Set message for coin flip
    showGameUI(); // Make the game UI visible now (shows message)
    renderGame(); // Render initial empty state

    // --- Coin Flip Animation ---
    try {
        await animateStartGameCoinFlip(COIN_FLIP_DURATION);
    } catch (error) {
        console.error("Coin flip animation failed:", error);
    }
    // --- End Coin Flip Animation ---

    const firstPlayerRoll = Math.random();
    const firstPlayerId = firstPlayerRoll < 0.5 ? 'player' : 'opponent';
    setFirstPlayerId(firstPlayerId); // Store who goes first in state
    const secondPlayerId = getOpponentId(firstPlayerId);

    console.log(`[GameLogic] ${firstPlayerId} goes first.`);
    logMessage(`${firstPlayerId} will go first!`, 'log-info');
    setMessage(`${firstPlayerId} goes first!`); // Update message

    // Set initial mana based on who goes first
    const player1 = getPlayer(firstPlayerId);
    const player2 = getPlayer(secondPlayerId);
    player1.maxMana = 1;
    player1.currentMana = 1;
    player2.maxMana = 0;
    player2.currentMana = 0;

    renderGame(); // Re-render to show initial mana (optional)

    // Pause so player can see the result
    setTimeout(() => {
        // Draw initial hands
        console.log("[GameLogic] Drawing initial hands...");
        for (let i = 0; i < STARTING_HAND_SIZE; i++) {
            drawCard(player);
            drawCard(opponent);
        }
        renderGame(); // Render hands before mulligan UI
        // --- Trigger Mulligan Phase ---
        showMulliganUI(); // Show the mulligan screen for the player
    }, STARTING_DRAW_VISUAL_PAUSE); // Pause to see who goes first
}

/**
 * Creates a card instance from card data, assigning a unique instance ID and owner.
 * @param {object} cardData - The card data object from the card library.
 * @param {string} ownerId - 'player' or 'opponent'.
 * @returns {object|null} The created card instance or null if cardData is invalid.
 */
export function createCardInstance(cardData, ownerId) {
    // Create a unique instance of a card from the library
    // Ensure we're using the base data from the library if cardData might be an instance already
    const libraryCard = cardLibrary.find(c => c.id === cardData.id);
    if (!libraryCard) {
        console.error(`Card data not found in library for id: ${cardData?.id}`);
        return null;
    }
    // If the input *was* already an instance, we still want to create a *new* instance
    // based on the library definition for the draw pile.
    if (cardData.instanceId) {
        console.warn(`createCardInstance called with an existing instance (${cardData.name}, ${cardData.instanceId}). Creating new instance from library data.`);
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
        isStealthed: !!libraryCard.mechanics?.includes("Stealth"), // Initialize Stealth state
        // Add more state as needed (isStealthed, poisonCounters, etc.)
        // Frenzy specific state
        effects: [], // Initialize effects array here
        frenzyTriggered: false,
        frenzyActionId: libraryCard.frenzyActionId || null,
        appliedAuraAttackBonus: 0, // Initialize aura bonus tracking
        frenzyActionParams: libraryCard.frenzyActionParams || {},
    };
}

/**
 * Helper function to create a card instance directly from a card ID.
 * @param {string} cardId - The ID of the card in the card library.
 * @param {string} ownerId - 'player' or 'opponent'.
 * @returns {object|null} The created card instance or null if ID is invalid.
 */
function createCardInstanceById(cardId, ownerId) {
    const cardData = cardLibrary.find(c => c.id === cardId);
    return cardData ? createCardInstance(cardData, ownerId) : null;
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
    setMessage(`${playerId}'s turn.`); // Update prompt bar
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
    // 3. Unfreeze OPPONENT's creatures
    // 4. TODO: Handle other start-of-turn effects (e.g., card triggers)

    // 1. Unfreeze the OPPONENT'S creatures (they thaw at the start of this player's turn)
    opponent.board.forEach(creature => {
        if (creature.isFrozen) {
            creature.isFrozen = false; // Remove frozen status
            logMessage(`${creature.name} unfreezes.`);
            // Its canAttack status will be determined when its owner's turn starts.
        }
    });

    // 2. Reset CURRENT player's creatures' state for the new turn
    player.board.forEach(creature => {
        // Store the 'justPlayed' status from the *previous* turn before resetting it
        const wasJustPlayedLastTurn = creature.justPlayed;
        console.log(`[Start Turn ${getTurn()}] ${player.id}'s ${creature.name} (${creature.instanceId}) - Before update: justPlayed=${wasJustPlayedLastTurn}, isFrozen=${creature.isFrozen}, canAttack=${creature.canAttack}, hasAttacked=${creature.hasAttacked}`);

        // Reset turn-based states
        creature.hasAttacked = false;
        creature.justPlayed = false; // Summoning sickness wears off now

        // Determine if it can attack THIS turn
        // A creature can attack if it's not frozen and has > 0 attack.
        // The 'justPlayed' status only prevents attack on the turn it is played (handled in playCard),
        // unless it has Swift. By the start of the *next* turn, the sickness is gone.
        creature.canAttack = !creature.isFrozen && creature.currentAttack > 0;
        console.log(`[Start Turn ${getTurn()}] ${player.id}'s ${creature.name} (${creature.instanceId}) - After update: justPlayed=${creature.justPlayed}, isFrozen=${creature.isFrozen}, canAttack=${creature.canAttack}, hasAttacked=${creature.hasAttacked} (wasJustPlayedLastTurn=${wasJustPlayedLastTurn})`);
    });

    // TODO: Handle opponent's start-of-turn effects if any apply during player's turn (unlikely)

    // Draw a card
    drawCard(player);

    // Update UI
    setMessage(`${playerId}'s turn.`); // Update prompt bar
    renderGame(); // Render after state updates but before AI turn

    // Enable/disable button
    const endTurnButton = getDOMElement('endTurnButton');
    if (endTurnButton) endTurnButton.disabled = playerId !== 'player';

    // If it's the AI's turn, run its logic
    if (playerId === 'opponent') {
        setMessage("Opponent is thinking..."); // Show message while AI thinks
        // Disable player actions during AI turn (already handled by button disable and event checks)
        setTimeout(runAITurn, AI_TURN_START_DELAY); // Use constant for delay
    }
}

export function endTurn() {
    if (isGameOver()) return;

    const currentPlayerId = getState().currentPlayerId;
    const currentPlayer = getCurrentPlayer();
    logMessage(`${currentPlayerId} ends turn.`);
    console.log(`${currentPlayerId} ends turn.`);

    // --- End of Turn Effects for the player whose turn just ended ---
    // TODO: Implement end-of-turn triggers (e.g., Poison, card effects)
    // Process temporary buffs
    currentPlayer.board.forEach(creature => {
        // Iterate backwards to allow safe removal
        for (let i = creature.effects.length - 1; i >= 0; i--) {
            const effect = creature.effects[i];
            if (effect.type === 'tempBuff') {
                effect.duration--; // Decrement duration
                if (effect.duration <= 0) {
                    // Remove buff stats
                    creature.currentAttack = Math.max(0, creature.currentAttack - effect.attack);
                    creature.currentHealth -= effect.health; // Health can go to 0 or below, death check happens later
                    logMessage(`${creature.name}'s temporary buff (+${effect.attack}/+${effect.health}) wears off.`);
                    creature.effects.splice(i, 1); // Remove the effect object
                }
            }
            // Add handling for other end-of-turn effect types here (e.g., poison)
        }
    });

    // Check win condition *before* starting next turn (e.g., if end-of-turn effect was lethal)
    if (checkWinCondition()) return;

    // Start the next player's turn
    const nextPlayerId = getOpponentId(currentPlayerId);
    startTurn(nextPlayerId);
}

// --- Card Drawing ---

export function drawCard(player) {
    // Check if draw pile is empty
    if (player.drawPile.length === 0) {
        // Check if discard pile has cards
        if (player.discardPile.length > 0) {
            logMessage(`${player.id}'s draw pile is empty. Shuffling discard pile...`, 'log-info');
            // Shuffle discard pile and move it to draw pile
            player.drawPile = shuffleDeck(player.discardPile);
            player.discardPile = []; // Clear discard pile
            console.log(`${player.id} shuffled discard into draw pile. New draw pile size: ${player.drawPile.length}`);
        } else {
            // Both piles are empty - game might end or fatigue could be re-implemented here if desired
            logMessage(`${player.id} has no cards left in draw or discard piles!`, 'log-error');
            console.log(`${player.id} deck and discard empty! Cannot draw.`);
            // Currently, nothing happens. Fatigue is removed.
            return; // Exit the function, cannot draw
        }
    }

    // Proceed with drawing if cards are available in drawPile
    if (player.hand.length >= MAX_HAND_SIZE) {
        const burnedCard = player.drawPile.pop(); // Remove card from draw pile
        const cardName = burnedCard?.name || 'a card';
        console.log(`${player.id} hand full! Card burned: ${cardName}`);
        logMessage(`${player.id}'s hand is full! Burned ${cardName}.`, 'log-error');
    } else {
        const card = player.drawPile.pop(); // Draw from the draw pile
        player.hand.push(card);
        logMessage(`${player.id} draws ${card.name}.`);
        console.log(`${player.id} drew ${card.name}`);
    }
    // No need to re-render here, startTurn/endTurn calls renderGame
    // But update player info immediately if not part of start/end turn?
    // renderPlayerInfo(player); // Maybe needed if called outside turn sequence
    renderGame(); // Render immediately after draw during mulligan
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
    stopCurrentAudio(); // Stop any currently playing announcement audio
}

// --- Mulligan Logic ---

export function confirmMulligan(selectedIndices) {
    console.log("Confirming mulligan with indices:", selectedIndices);
    const state = getState();
    const player = getPlayer('player');

    // Sort indices descending to avoid issues when removing elements
    selectedIndices.sort((a, b) => b - a);

    const cardsToReplace = [];
    selectedIndices.forEach(index => {
        if (index >= 0 && index < player.hand.length) {
            cardsToReplace.push(player.hand.splice(index, 1)[0]);
        }
    });

    console.log("Cards removed from hand:", cardsToReplace.map(c => c.name));

    // Add replaced cards back to the draw pile
    player.drawPile.push(...cardsToReplace);
    console.log("Cards added back to draw pile. New size:", player.drawPile.length);

    // Shuffle the draw pile
    shuffleDeck(player.drawPile);
    console.log("Draw pile shuffled.");

    // Draw the same number of new cards
    for (let i = 0; i < cardsToReplace.length; i++) {
        drawCard(player);
    }
    console.log("Drew replacement cards. New hand size:", player.hand.length);

    // --- Add The Coin to the second player's hand ---
    const secondPlayerId = getOpponentId(state.firstPlayerId);
    const secondPlayer = getPlayer(secondPlayerId);
    const coinCardData = cardLibrary.find(c => c.id === 'coin');

    if (coinCardData && secondPlayer) {
        if (secondPlayer.hand.length < MAX_HAND_SIZE) {
            const coinInstance = createCardInstance(coinCardData, secondPlayerId);
            secondPlayer.hand.push(coinInstance);
            logMessage(`${secondPlayerId} receives The Coin.`, 'log-info');
            console.log(`Added The Coin to ${secondPlayerId}'s hand.`);
        } else {
            logMessage(`${secondPlayerId}'s hand is full, cannot receive The Coin!`, 'log-error');
            console.log(`${secondPlayerId}'s hand full, Coin burned.`);
        }
    }

    hideMulliganUI(); // Hide the mulligan screen
    renderGame(); // Render the final hands (including the coin)
    startTurn(state.firstPlayerId); // Start the actual first turn with the determined player
}
