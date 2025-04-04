import { getState, getPlayer, getOpponentId, isGameOver } from './state.js';
import { renderGame, updatePlayableCards, createCardElement } from './render.js';
import { deselectCard } from './uiState.js';
import { logMessage } from './messaging.js';
import { updateBoardStats } from './boardLogic.js';
import { checkWinCondition } from './gameLogic.js';
import { MAX_BOARD_SIZE } from './constants.js';
import { cardLibrary } from './cards.js';
import { getTargetFromElement } from './actionUtils.js';
import { triggerCardEffect } from './cardEffects.js';
import { animateCardMovement, animateSpellEffect, animateDrawCard } from './animations.js';
import { getDOMElement } from './dom.js';

export async function playCard(player, card, cardIndexInHand, targetElement = null) {
    console.log(`${player.id} attempts to play ${card.name}`);

    if (player.currentMana < card.cost) {
        logMessage(`Cannot play ${card.name}: Not enough mana!`, 'log-error');
        console.log("Not enough mana");
        deselectCard();
        renderGame();
        return;
    }
    if (card.type === "Creature" && player.board.length >= MAX_BOARD_SIZE) {
         logMessage(`Cannot play ${card.name}: Board is full!`, 'log-error');
         console.log("Board is full");
         deselectCard();
         renderGame();
         return;
    }

    // --- Animation Setup ---
    let startRect = null;
    let endRect = null;
    const handCardElement = player.handElement?.querySelector(`.card[data-hand-index="${cardIndexInHand}"]`);

    if (handCardElement) {
        startRect = handCardElement.getBoundingClientRect();
        // Hide the original card in hand immediately
        handCardElement.style.opacity = '0';
    }

    player.currentMana -= card.cost;

    // Remove card from hand state *before* animation starts,
    // but keep the data for animation/effects.
    const playedCard = player.hand.splice(cardIndexInHand, 1)[0];

    let success = true;
    let animationPromise = Promise.resolve(); // Default to resolved promise if no animation

    // --- Calculate End Position for Animation ---
    if (startRect) {
        if (playedCard.type === "Creature") {
            // Target the next available slot on the board
            const boardEl = getDOMElement(`${player.id}BoardEl`);
            const tempBoardCard = createCardElement(playedCard, 'board'); // Create a temporary element to measure
            tempBoardCard.style.visibility = 'hidden'; // Don't show it
            boardEl.appendChild(tempBoardCard);
            endRect = tempBoardCard.getBoundingClientRect();
            boardEl.removeChild(tempBoardCard); // Clean up temp element
        }
        // Add logic for spell target position if desired (e.g., center of board or target)
    }

    if (playedCard.type === "Creature") {
        console.log(`Playing creature: ${playedCard.name}`);
        logMessage(`${player.id} plays ${playedCard.name}.`);
        playedCard.justPlayed = true;
        playedCard.canAttack = !!playedCard.mechanics?.includes("Swift");
        playedCard.hasAttacked = false;
        playedCard.isFrozen = false;
        console.log(`[Play Creature] ${playedCard.name} (${playedCard.instanceId}) played. Initial state: justPlayed=${playedCard.justPlayed}, canAttack=${playedCard.canAttack}`);
        const libraryCard = cardLibrary.find(c => c.id === playedCard.id);
        playedCard.health = libraryCard.health;
        playedCard.attack = libraryCard.attack;

        // --- Trigger Play Animation ---
        if (startRect && endRect) {
            animationPromise = animateCardMovement(playedCard, startRect, endRect, 'play');
        }

        if (playedCard.deployActionId) {
            // Effects will trigger after animation visually completes
        }

        updateBoardStats(player.id);
        updateBoardStats(getOpponentId(player.id));

    } else if (playedCard.type === "Spell") {
        console.log(`Playing spell: ${playedCard.name}`);
        logMessage(`${player.id} plays ${playedCard.name}.`);

        // --- Trigger Spell Animation (optional - maybe just fade out?) ---
        // For now, let's just use the hand card fade out.
        // If animation is desired, calculate endRect (e.g., center of board/target)
        // animationPromise = animateCardMovement(playedCard, startRect, endRect, 'play');
        // Instead, we'll trigger a spell-specific animation.
        let spellAnimationPromise = Promise.resolve();

        if (playedCard.actionId) {
            const target = getTargetFromElement(targetElement, playedCard.target, player);

            if (target !== "invalid") {
                console.log(`Executing spell action ${playedCard.actionId} on target:`, target);

                // --- Trigger Spell Visual Effect ---
                if (playedCard.visualEffectType) {
                    const casterHeroElement = getDOMElement(`${player.id}HeroEl`);
                    // Pass the actual target element (card or hero) or null if target is board/self
                    spellAnimationPromise = animateSpellEffect(casterHeroElement, targetElement, playedCard.visualEffectType);
                }
                // Trigger the effect logic (which might be async itself, e.g., drawCards)
                // Ensure triggerCardEffect returns a promise if the action is async
                success = triggerCardEffect(player, playedCard, playedCard.actionId, playedCard.actionParams || {}, target);
                // If the effect is async (like drawCards), we need to await it here
                if (success instanceof Promise) {
                    success = await success; // Wait for the async effect to complete
                }
            } else {
                console.log("Invalid target for spell.");
                if (handCardElement) handCardElement.style.opacity = '1'; // Make original card visible again
                logMessage(`Invalid target for ${playedCard.name}.`, 'log-error');
                player.hand.splice(cardIndexInHand, 0, playedCard);
                player.currentMana += playedCard.cost;
                success = false;
            }
        } else {
             console.log(`Spell ${playedCard.name} has no defined action.`);
        }

        // --- Wait for Spell Visual Effect ---
        // This ensures the visual happens before the game state potentially changes drastically
        // from the card effect (e.g., creature dying).
        await spellAnimationPromise;


        // Add successfully played spell to discard pile
        if (success) {
            player.discardPile.push(playedCard);
            console.log(`${playedCard.name} added to ${player.id}'s discard pile.`);
        }
    }

    // --- Wait for Animation and Apply Effects ---
    await animationPromise;

    // Add creature to board state *after* the animation finishes visually landing
    if (success && playedCard.type === "Creature") {
        player.board.push(playedCard);
        updateBoardStats(player.id); // Update stats after adding to board
        updateBoardStats(getOpponentId(player.id));
    }

    // Apply deploy effects *after* the creature animation finishes visually landing
    if (success && playedCard.type === "Creature" && playedCard.deployActionId) {
        console.log(`Triggering deploy effect for ${playedCard.name} after animation.`);
        triggerCardEffect(player, playedCard, playedCard.deployActionId, playedCard.deployParams || {}, null);
    }

    deselectCard();
    if (success && !isGameOver()) {
        checkWinCondition();
    }
    if (!isGameOver()) {
        renderGame();
        updatePlayableCards(player);
    }
}
