import { getState, getPlayer, getOpponentId, isGameOver } from './state.js';
import { renderGame, updatePlayableCards } from './render.js';
import { deselectCard } from './uiState.js';
import { logMessage } from './messaging.js';
import { updateBoardStats } from './boardLogic.js';
import { checkWinCondition } from './gameLogic.js';
import { MAX_BOARD_SIZE } from './constants.js';
import { cardLibrary } from './cards.js';
import { triggerCardEffect, getTargetFromElement } from './actionUtils.js';

// --- Core Action Functions ---

export function playCard(player, card, cardIndexInHand, targetElement = null) {
    console.log(`${player.id} attempts to play ${card.name}`);

    // Basic checks (redundant with UI checks but good for safety)
    if (player.currentMana < card.cost) {
        logMessage(`Cannot play ${card.name}: Not enough mana!`, 'log-error');
        console.log("Not enough mana");
        deselectCard(); // Ensure card is deselected if play fails
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

    // Deduct mana first
    player.currentMana -= card.cost;

    // Remove card from hand *before* resolving effects
    const playedCard = player.hand.splice(cardIndexInHand, 1)[0]; // Use the removed card instance

    // --- Resolve the card ---
    let success = true;
    if (playedCard.type === "Creature") {
        console.log(`Playing creature: ${playedCard.name}`);
        logMessage(`${player.id} plays ${playedCard.name}.`);
        // Assign runtime properties
        playedCard.justPlayed = true; // Has summoning sickness
        playedCard.canAttack = !!playedCard.mechanics?.includes("Swift"); // Can attack immediately if Swift
        playedCard.hasAttacked = false;
        playedCard.isFrozen = false;
        // Reset health/attack to base values (in case it was somehow modified in hand)
        const libraryCard = cardLibrary.find(c => c.id === playedCard.id);
        playedCard.currentHealth = libraryCard.health;
        playedCard.currentAttack = libraryCard.attack;
        playedCard.health = libraryCard.health; // Ensure max health is correct
        playedCard.attack = libraryCard.attack; // Ensure base attack is correct

        player.board.push(playedCard);

        // Handle Deploy effects AFTER the creature is on the board
        if (playedCard.deployActionId) {
            triggerCardEffect(player, playedCard, playedCard.deployActionId, playedCard.deployParams || {}, null); // No specific target needed for deploy usually
        }

        // Update board stats for both players after creature enters
        updateBoardStats(player.id);
        updateBoardStats(getOpponentId(player.id));

    } else if (playedCard.type === "Spell") {
        console.log(`Playing spell: ${playedCard.name}`);
        logMessage(`${player.id} plays ${playedCard.name}.`);
        if (playedCard.actionId) {
            const target = getTargetFromElement(targetElement, playedCard.target, player);
            if (target !== "invalid") {
                console.log(`Executing spell action ${playedCard.actionId} on target:`, target);
                success = triggerCardEffect(player, playedCard, playedCard.actionId, playedCard.actionParams || {}, target);
            } else {
                console.log("Invalid target for spell.");
                logMessage(`Invalid target for ${playedCard.name}.`, 'log-error');
                // Refund mana & put card back (simple rollback)
                player.hand.splice(cardIndexInHand, 0, playedCard);
                player.currentMana += playedCard.cost;
                success = false; // Mark as failed
            }
        } else {
             console.log(`Spell ${playedCard.name} has no defined action.`);
             // Spells usually go to a graveyard, but we'll just let it be removed from hand for simplicity
        }
        // Spells usually go to a graveyard, but we'll just let it be removed from hand for simplicity
    }

    // --- Post-Action Cleanup ---
    deselectCard(); // Clear selection state regardless of success/failure (unless rolled back)
    if (success && !isGameOver()) {
        checkWinCondition(); // Check win condition immediately after potential damage/healing
    }
    if (!isGameOver()) {
        renderGame(); // Update UI
        updatePlayableCards(player); // Mana changed, update playable cards
    }
}
