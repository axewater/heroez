import { getState, getPlayer, getCurrentPlayer, getOpponentPlayer, getOpponentId, getSelectedCard, setSelectedCard, getSelectedAttacker, setSelectedAttacker, setTargetingMode, getTargetingMode, setMessageState } from './state.js';
import { playCard, creatureAttack } from './actions.js';
import { MAX_BOARD_SIZE } from './constants.js';

// --- DOM Element References ---
let domElements = {};

export function cacheDOMElements() {
    domElements = {
        opponentHealthEl: document.getElementById('opponent-health'),
        opponentManaEl: document.getElementById('opponent-mana'),
        opponentDeckEl: document.getElementById('opponent-deck'),
        opponentHandEl: document.getElementById('opponent-hand'),
        opponentBoardEl: document.getElementById('opponent-board'),
        opponentHeroEl: document.getElementById('opponent-hero'),

        playerHealthEl: document.getElementById('player-health'),
        playerManaEl: document.getElementById('player-mana'),
        playerDeckEl: document.getElementById('player-deck'),
        playerHandEl: document.getElementById('player-hand'),
        playerBoardEl: document.getElementById('player-board'),
        playerHeroEl: document.getElementById('player-hero'),

        messageAreaEl: document.getElementById('message-area'),
        endTurnButton: document.getElementById('end-turn-button'),
        gameOverOverlay: document.getElementById('game-over-overlay'),
        gameOverMessage: document.getElementById('game-over-message'),
        restartButton: document.getElementById('restart-button'),
    };
    console.log("DOM elements cached.");

    // Assign elements to player state objects
    const player = getPlayer('player');
    player.heroElement = domElements.playerHeroEl;
    player.healthElement = domElements.playerHealthEl;
    player.manaElement = domElements.playerManaEl;
    player.deckElement = domElements.playerDeckEl;
    player.handElement = domElements.playerHandEl;
    player.boardElement = domElements.playerBoardEl;

    const opponent = getPlayer('opponent');
    opponent.heroElement = domElements.opponentHeroEl;
    opponent.healthElement = domElements.opponentHealthEl;
    opponent.manaElement = domElements.opponentManaEl;
    opponent.deckElement = domElements.opponentDeckEl;
    opponent.handElement = domElements.opponentHandEl;
    opponent.boardElement = domElements.opponentBoardEl;
}

export function getDOMElement(id) {
    return domElements[id];
}


// --- Rendering Functions ---

export function renderGame() {
    const state = getState();
    console.log("Rendering game state...");
    if (state.gameOver) return; // Don't render if game over is showing

    // Render Player Stats
    renderPlayerInfo(getPlayer('player'));
    renderPlayerInfo(getPlayer('opponent'));

    // Render Hands
    renderHand(getPlayer('player'));
    renderHand(getPlayer('opponent'));

    // Render Boards
    renderBoard(getPlayer('player'));
    renderBoard(getPlayer('opponent'));

    // Update Message
    setMessage(state.message || `${state.currentPlayerId}'s turn.`);

    // Update Button State
    domElements.endTurnButton.disabled = state.currentPlayerId !== 'player' || state.targetingMode !== null;

    // Highlight playable cards for the current player
    updatePlayableCards(getCurrentPlayer());

    // Highlight targetable entities if needed
    updateTargetHighlights();
}

function renderPlayerInfo(player) {
    if (!player || !player.healthElement || !player.manaElement || !player.deckElement) {
        console.warn(`Player info elements not ready for ${player?.id}`);
        return;
    }
    player.healthElement.textContent = player.heroHealth;
    player.manaElement.textContent = `${player.currentMana}/${player.maxMana}`;
    player.deckElement.textContent = `Deck: ${player.deck.length}`;
}

function renderHand(player) {
    if (!player || !player.handElement) return;
    player.handElement.innerHTML = ''; // Clear current hand
    player.hand.forEach((card, index) => {
        const cardEl = createCardElement(card, 'hand', index);
        player.handElement.appendChild(cardEl);
    });
}

function renderBoard(player) {
     if (!player || !player.boardElement) return;
    player.boardElement.innerHTML = ''; // Clear current board
    player.board.forEach(card => {
        const cardEl = createCardElement(card, 'board');
        player.boardElement.appendChild(cardEl);
    });
}

export function createCardElement(card, location, indexInHand = -1) {
    const cardEl = document.createElement('div');
    cardEl.classList.add('card', card.type);
    cardEl.dataset.instanceId = card.instanceId; // Store unique ID
    cardEl.dataset.cardId = card.id; // Store library ID
    if (location === 'hand') cardEl.dataset.handIndex = indexInHand;
    if (location === 'board') cardEl.dataset.owner = card.owner;

    const state = getState(); // Get current state for checks

    // Add state classes
    if (card.isTaunt) cardEl.classList.add('is-taunt');
    if (card.canAttack && location === 'board' && card.owner === state.currentPlayerId) cardEl.classList.add('can-attack');
    if (card.hasAttacked) cardEl.classList.add('has-attacked');
    if (card.isFrozen) cardEl.classList.add('is-frozen');

    // Selection / Attacking highlights (applied during render based on state)
    const selectedCard = getSelectedCard();
    const selectedAttacker = getSelectedAttacker();
    if (selectedCard && selectedCard.card.instanceId === card.instanceId && selectedCard.location === location) {
        cardEl.classList.add('selected');
    }
    if (selectedAttacker && selectedAttacker.instanceId === card.instanceId && location === 'board') {
         cardEl.classList.add('attacking');
    }


    // Card Content
    let effectText = card.effectText || "";
    if (card.mechanics && card.mechanics.length > 0) {
        const mechanicsText = `<b>${card.mechanics.join(', ')}</b>`;
        effectText = effectText ? `${mechanicsText}. ${effectText}` : mechanicsText;
    }

    cardEl.innerHTML = `
        <div class="card-cost">${card.cost}</div>
        <div class="card-name">${card.name}</div>
        ${card.type === 'Creature' ? `<div class="card-attack">${card.currentAttack !== undefined ? card.currentAttack : card.attack}</div>` : ''}
        ${card.type === 'Creature' ? `<div class="card-health">${card.currentHealth !== undefined ? card.currentHealth : card.health}</div>` : ''}
        <div class="card-effect">${effectText}</div>
    `;

    // Add event listeners only for the player's interactive elements
    if (!state.gameOver) {
        if (location === 'hand' && card.owner === 'player') {
            cardEl.addEventListener('click', () => handleHandCardClick(card, indexInHand));
        } else if (location === 'board' && card.owner === 'player') {
            cardEl.addEventListener('click', () => handleBoardCardClick(card));
        }
        // Add targeting listeners for opponent's board cards (handled by delegation in main.js)
    }

    return cardEl;
}

export function setMessage(msg) {
    if (domElements.messageAreaEl) {
        domElements.messageAreaEl.textContent = msg;
        // Also update state if this is the source of truth
        // setMessageState(msg); // Be careful not to create loops if state change triggers render->setMessage
    }
}

export function updatePlayableCards(player) {
    if (!player || !player.handElement) return;

    // Remove existing playable class
    player.handElement.querySelectorAll('.card').forEach(el => el.classList.remove('playable'));

    if (player.id !== getState().currentPlayerId) return; // Only highlight for current player

    player.hand.forEach((card, index) => {
         let canPlay = player.currentMana >= card.cost;
         if (card.type === "Creature" && player.board.length >= MAX_BOARD_SIZE) {
             canPlay = false; // Cannot play if board is full
         }
         // Add more checks if needed (e.g., specific card requirements)

         if (canPlay) {
            const cardEl = player.handElement?.querySelector(`.card[data-hand-index="${index}"]`);
            if (cardEl) cardEl.classList.add('playable');
         }
    });
}

export function updateTargetHighlights() {
    // Clear previous highlights
    document.querySelectorAll('.targetable').forEach(el => el.classList.remove('targetable'));

    const targeting = getTargetingMode();
    if (!targeting.mode) return; // Only highlight when targeting

    const currentPlayer = getCurrentPlayer();
    const opponentPlayer = getOpponentPlayer();

    const canTargetCreature = (targetCard, targetType) => {
        if (!targetCard) return false;
        if (targetType === 'any') return true;
        if (targetType === 'creature' && targetCard.type === 'Creature') return true;
        // Add more checks (e.g., cannot target stealthed unless AOE?)
        return false;
    };
    const canTargetHero = (targetType) => {
         if (targetType === 'any' || targetType === 'hero') return true;
         return false;
    };

    if (targeting.mode === 'spell') {
        const spell = getSelectedCard()?.card;
        if (!spell) return;

        const targetType = spell.target;

        // Highlight player hero/creatures
        if (canTargetHero(targetType)) {
            currentPlayer.heroElement?.classList.add('targetable');
        }
        currentPlayer.board.forEach(card => {
            if (canTargetCreature(card, targetType)) {
                const el = currentPlayer.boardElement?.querySelector(`.card[data-instance-id="${card.instanceId}"]`);
                if (el) el.classList.add('targetable');
            }
        });

        // Highlight opponent hero/creatures
        if (canTargetHero(targetType)) {
            opponentPlayer.heroElement?.classList.add('targetable');
        }
        opponentPlayer.board.forEach(card => {
            if (canTargetCreature(card, targetType)) {
                const el = opponentPlayer.boardElement?.querySelector(`.card[data-instance-id="${card.instanceId}"]`);
                if (el) el.classList.add('targetable');
            }
        });

    } else if (targeting.mode === 'attack') {
        // Highlight opponent creatures/hero that can be attacked
        const tauntMinions = opponentPlayer.board.filter(c => c.isTaunt); // Assuming isTaunt property exists

        if (tauntMinions.length > 0) {
            // Only highlight taunt minions
            tauntMinions.forEach(card => {
                const el = opponentPlayer.boardElement?.querySelector(`.card[data-instance-id="${card.instanceId}"]`);
                if (el) el.classList.add('targetable');
            });
        } else {
            // Highlight all opponent creatures and hero
            opponentPlayer.board.forEach(card => {
                const el = opponentPlayer.boardElement?.querySelector(`.card[data-instance-id="${card.instanceId}"]`);
                if (el) el.classList.add('targetable');
            });
            opponentPlayer.heroElement?.classList.add('targetable');
        }
    }
}


// --- UI State Management ---

export function deselectCard() {
    const selectedCard = getSelectedCard();
    if (selectedCard) {
        const player = getPlayer(selectedCard.card.owner);
        // Element might be gone if card was played, so check existence
        const cardEl = player?.handElement?.querySelector(`.card[data-instance-id="${selectedCard.card.instanceId}"]`);
        if (cardEl) cardEl.classList.remove('selected');

        setSelectedCard(null);
        if (getTargetingMode().mode === 'spell') {
            setTargetingMode(null);
            setMessageState(`${getState().currentPlayerId}'s turn.`); // Reset message
            updateTargetHighlights(); // Clear target highlights
        }
    }
}

export function deselectAttacker() {
    const selectedAttacker = getSelectedAttacker();
    if (selectedAttacker) {
        const player = getPlayer(selectedAttacker.owner);
         // Element might be gone if creature died, so check existence
        const cardEl = player?.boardElement?.querySelector(`.card[data-instance-id="${selectedAttacker.instanceId}"]`);
        if (cardEl) cardEl.classList.remove('attacking');

        setSelectedAttacker(null);
        if (getTargetingMode().mode === 'attack') {
            setTargetingMode(null);
            setMessageState(`${getState().currentPlayerId}'s turn.`); // Reset message
            updateTargetHighlights(); // Clear target highlights
        }
    }
}

export function showGameOverScreen(message) {
    if (domElements.gameOverOverlay && domElements.gameOverMessage) {
        domElements.gameOverMessage.textContent = message;
        domElements.gameOverOverlay.style.display = 'flex';
    }
     if (domElements.endTurnButton) {
        domElements.endTurnButton.disabled = true;
     }
}

export function hideGameOverScreen() {
     if (domElements.gameOverOverlay) {
        domElements.gameOverOverlay.style.display = 'none';
    }
}

// --- Visual Feedback ---
export function flashElement(element, className) {
    if (element) {
        element.classList.add(className);
        // Use animationend event for more robust removal
        element.addEventListener('animationend', () => {
            element.classList.remove(className);
        }, { once: true });
    }
}

// --- Event Handlers (Player Interaction Logic) ---

export function handleHandCardClick(card, index) {
    console.log(`Clicked hand card: ${card.name} at index ${index}`);
    const player = getCurrentPlayer();
    const targetingMode = getTargetingMode().mode;

    if (getState().currentPlayerId !== 'player' || targetingMode) return; // Not player's turn or already targeting

    const selectedCard = getSelectedCard();

    if (selectedCard && selectedCard.card.instanceId === card.instanceId) {
        // Clicked the same card again, deselect
        deselectCard();
    } else {
        // Select this card
        deselectCard(); // Deselect previous if any
        deselectAttacker(); // Deselect attacker if any

        if (player.currentMana >= card.cost) {
            const cardEl = player.handElement?.querySelector(`.card[data-hand-index="${index}"]`);
            if (cardEl) {
                // Don't add 'selected' class here, renderGame will do it based on state
                setSelectedCard({ card: card, location: 'hand', index: index });

                // Determine next action based on card type
                if (card.type === 'Creature') {
                    // Check board space before playing
                    if (player.board.length < MAX_BOARD_SIZE) {
                        playCard(player, card, index); // Play immediately (no target needed initially)
                        // deselectCard() is called within playCard's flow
                    } else {
                         setMessage("Board is full!");
                         setSelectedCard(null); // Deselect invalid play
                    }
                } else if (card.type === 'Spell') {
                    // Enter targeting mode if the spell requires it
                    if (card.target && card.target !== 'self' && card.target !== 'opponent-board') { // Needs specific target
                        setTargetingMode('spell', card.target);
                        setMessageState(`Select a target for ${card.name}`);
                        // Highlights updated in renderGame
                    } else {
                        // Play spell immediately (targets self or whole board)
                        playCard(player, card, index, null); // Pass null target for self/board spells
                        // deselectCard() called within playCard's flow
                    }
                }
            }
        } else {
            setMessage("Not enough mana!");
        }
    }
    renderGame(); // Update UI with selection/deselection/highlights
}

export function handleBoardCardClick(card) {
    console.log(`Clicked own board card: ${card.name} (${card.instanceId})`);
    const player = getCurrentPlayer();
    const targeting = getTargetingMode();

    if (getState().currentPlayerId !== 'player') return; // Not player's turn

    if (targeting.mode === 'spell') {
        // Clicked own creature while targeting for a spell
        const spell = getSelectedCard()?.card;
        const targetElement = player.boardElement?.querySelector(`.card[data-instance-id="${card.instanceId}"]`);
        if (targetElement && targetElement.classList.contains('targetable') && spell) {
            playCard(player, spell, getSelectedCard().index, targetElement);
            // deselectCard/renderGame called within playCard's flow
        } else {
            setMessage("Invalid target for spell.");
            // Maybe deselect spell here? For now, do nothing.
        }
    } else if (targeting.mode === 'attack') {
        // Clicked own creature while selecting target for attack - invalid action
        setMessage("Select an enemy target to attack.");
        // Maybe deselect attacker? For now, do nothing.
    } else {
        // No targeting active, try selecting this creature for attack
        deselectCard();    // Deselect any hand card
        const currentAttacker = getSelectedAttacker();

        if (currentAttacker && currentAttacker.instanceId === card.instanceId) {
            // Clicked selected attacker again, deselect
            deselectAttacker();
        } else {
            deselectAttacker(); // Deselect previous attacker if any
            if (card.canAttack && !card.hasAttacked && !card.isFrozen) {
                const cardEl = player.boardElement?.querySelector(`.card[data-instance-id="${card.instanceId}"]`);
                if (cardEl) {
                    // Don't add 'attacking' class here, renderGame will do it based on state
                    setSelectedAttacker(card);
                    setTargetingMode('attack');
                    setMessageState(`Select target for ${card.name} to attack.`);
                    // Highlights updated in renderGame
                }
            } else if (card.hasAttacked) {
                setMessage(`${card.name} has already attacked this turn.`);
            } else if (card.isFrozen) {
                setMessage(`${card.name} is frozen.`);
            } else {
                setMessage(`${card.name} cannot attack yet.`);
            }
        }
    }
    renderGame(); // Update highlights etc.
}

// Handles clicks on potential targets (opponent cards, opponent hero, potentially own cards/hero for spells)
export function handleTargetClick(targetElement) {
    console.log("Clicked target element:", targetElement);
    const player = getCurrentPlayer(); // The player initiating the action
    const targeting = getTargetingMode();

    if (getState().currentPlayerId !== 'player' || !targeting.mode) return;

    if (!targetElement.classList.contains('targetable')) {
        setMessage("Invalid target.");
        // Consider deselecting spell/attacker here if needed
        return;
    }

    if (targeting.mode === 'spell') {
        const spellData = getSelectedCard();
        if (spellData) {
            playCard(player, spellData.card, spellData.index, targetElement);
            // deselectCard/renderGame called within playCard's flow
        } else {
             console.error("Targeting spell, but no spell selected in state.");
             setTargetingMode(null); // Reset targeting state
             renderGame();
        }
    } else if (targeting.mode === 'attack') {
        const attacker = getSelectedAttacker();
        if (attacker) {
            creatureAttack(attacker, targetElement);
            // deselectAttacker/renderGame called within creatureAttack's flow
        } else {
             console.error("Targeting attack, but no attacker selected in state.");
             setTargetingMode(null); // Reset targeting state
             renderGame();
        }
    }
}
