import { getState, getPlayer, getCurrentPlayer, getOpponentPlayer, getSelectedCard, getSelectedAttacker, getTargetingMode } from './state.js';
import { MAX_BOARD_SIZE } from './constants.js';
import { getDOMElement } from './dom.js';
import { handleHandCardClick, handleBoardCardClick } from './eventHandlers.js';

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

    // Update Message - Handled by messaging.js

    // Update Button State
    const endTurnButton = getDOMElement('endTurnButton');
    if (endTurnButton) {
        endTurnButton.disabled = state.currentPlayerId !== 'player' || state.targetingMode !== null;
    }

    // Highlight playable cards for the current player
    updatePlayableCards(getCurrentPlayer());

    // Highlight targetable entities if needed
    updateTargetHighlights();
}

function renderPlayerInfo(player) {
    if (!player || !player.healthElement || !player.manaElement || !player.drawPileElement || !player.discardPileElement) {
        // Elements might not be assigned yet if cacheDOMElements/assignElementsToPlayerState hasn't run
        // console.warn(`Player info elements not ready for ${player?.id}`);
        return;
    }
    player.healthElement.textContent = player.heroHealth;
    player.manaElement.textContent = `${player.currentMana}/${player.maxMana}`;
    player.drawPileElement.textContent = `Draw: ${player.drawPile.length}`;
    player.discardPileElement.textContent = `Discard: ${player.discardPile.length}`;
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
    // Add location to dataset for easier CSS targeting (e.g., debug mode)
    cardEl.dataset.location = location;
    const state = getState(); // Get current state for checks

    // Add state classes
    if (card.isTaunt) cardEl.classList.add('is-taunt');
    if (card.canAttack && location === 'board' && card.owner === state.currentPlayerId) cardEl.classList.add('can-attack');
    if (card.hasAttacked) cardEl.classList.add('has-attacked');
    if (card.isFrozen) cardEl.classList.add('is-frozen');
    if (card.mechanics?.includes("Frenzy") && !card.frenzyTriggered) cardEl.classList.add('has-frenzy'); // Add class if Frenzy is ready
    if (card.isStealthed) cardEl.classList.add('is-stealthed'); // Add class if Stealthed

    // Selection / Attacking highlights (applied during render based on state)
    const selectedCard = getSelectedCard();
    const selectedAttacker = getSelectedAttacker();
    if (selectedCard && selectedCard.card.instanceId === card.instanceId && selectedCard.location === location) {
        cardEl.classList.add('selected');
    }
    if (selectedAttacker && selectedAttacker.instanceId === card.instanceId && location === 'board') {
         cardEl.classList.add('attacking');
    }

    // --- Debug Mode Check for Opponent Hand ---
    const isOpponentHandCard = card.owner === 'opponent' && location === 'hand';
    const showOpponentCard = state.isDebugMode && isOpponentHandCard;

    // Card Content
    let effectText = card.effectText || "";
    if (card.mechanics && card.mechanics.length > 0) {
        const mechanicsText = `<b>${card.mechanics.join(', ')}</b>`;
        effectText = effectText ? `${mechanicsText}. ${effectText}` : mechanicsText;
    }

    // Only show details if it's not an opponent hand card OR if debug mode is on
    const shouldShowDetails = !isOpponentHandCard || showOpponentCard;
    cardEl.innerHTML = `
        <div class="card-cost">${shouldShowDetails ? card.cost : ''}</div>
        <div class="card-name">${shouldShowDetails ? card.name : ''}</div>
        ${card.type === 'Creature' ? `<div class="card-attack">${shouldShowDetails ? (card.currentAttack !== undefined ? card.currentAttack : card.attack) : ''}</div>` : ''}
        ${card.type === 'Creature' ? `<div class="card-health">${shouldShowDetails ? (card.currentHealth !== undefined ? card.currentHealth : card.health) : ''}</div>` : ''}
        <div class="card-effect">${shouldShowDetails ? effectText : ''}</div>
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

    // If it's an opponent hand card shown in debug mode, remove the default hidden style class
    if (showOpponentCard) {
        cardEl.classList.add('debug-visible'); // Add class for CSS override
    }

    return cardEl;
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
        if (targetType === 'creature' && targetCard.type === 'Creature' ) return true;
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
        if (canTargetHero(targetType) && currentPlayer.heroElement) {
            currentPlayer.heroElement.classList.add('targetable');
        }
        currentPlayer.board.forEach(card => {
            if (canTargetCreature(card, targetType)) { // Player can target their own stealthed minions
                const el = currentPlayer.boardElement?.querySelector(`.card[data-instance-id="${card.instanceId}"]`);
                if (el) el.classList.add('targetable');
            }
        });

        // Highlight opponent hero/creatures
        if (canTargetHero(targetType) && opponentPlayer.heroElement) {
            opponentPlayer.heroElement.classList.add('targetable');
        }
        opponentPlayer.board.forEach(card => {
            // Cannot target stealthed enemy minions with single-target spells
            if (canTargetCreature(card, targetType) && !card.isStealthed) {
                const el = opponentPlayer.boardElement?.querySelector(`.card[data-instance-id="${card.instanceId}"]`);
                if (el) el.classList.add('targetable');
            }
        });

    } else if (targeting.mode === 'attack') {
        // Highlight opponent creatures/hero that can be attacked
        const tauntMinions = opponentPlayer.board.filter(c => c.isTaunt && !c.isStealthed); // Stealthed minions cannot Taunt

        if (tauntMinions.length > 0) {
            // Only highlight taunt minions
            tauntMinions.forEach(card => {
                const el = opponentPlayer.boardElement?.querySelector(`.card[data-instance-id="${card.instanceId}"]`);
                if (el) el.classList.add('targetable'); // Already checked for stealth
            });
        } else {
            // Highlight all non-stealthed opponent creatures and hero
            opponentPlayer.board.forEach(card => {
                const el = opponentPlayer.boardElement?.querySelector(`.card[data-instance-id="${card.instanceId}"]`); // Check stealth before adding class
                if (el) el.classList.add('targetable');
            });
            if (opponentPlayer.heroElement) {
                opponentPlayer.heroElement.classList.add('targetable');
            }
        }
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
