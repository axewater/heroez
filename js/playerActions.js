import { getState, getPlayer, getOpponentId, isGameOver } from './state.js';
import { renderGame, updatePlayableCards } from './render.js';
import { deselectCard } from './uiState.js';
import { logMessage } from './messaging.js';
import { updateBoardStats } from './boardLogic.js';
import { checkWinCondition } from './gameLogic.js';
import { MAX_BOARD_SIZE } from './constants.js';
import { cardLibrary } from './cards.js';
// Updated imports: triggerCardEffect now comes from cardEffects
import { getTargetFromElement } from './actionUtils.js';
import { triggerCardEffect } from './cardEffects.js';

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
        // Assign runtime properties (ensure instance has these from createCardInstance)
        playedCard.justPlayed = true; // Has summoning sickness
        playedCard.canAttack = !!playedCard.mechanics?.includes("Swift"); // Can attack immediately if Swift
        playedCard.hasAttacked = false;
        playedCard.isFrozen = false;
        // Reset health/attack to base values (in case it was somehow modified in hand - createCardInstance should handle this)
        const libraryCard = cardLibrary.find(c => c.id === playedCard.id);
        // Ensure current health/attack exist and reset them if necessary
        // createCardInstance should initialize these correctly. Re-setting here might override buffs applied in hand (if ever possible).
        // Let's trust createCardInstance. If stats seem wrong, check there.
        // playedCard.currentHealth = libraryCard.health;
        // playedCard.currentAttack = libraryCard.attack;
        playedCard.health = libraryCard.health; // Ensure max health is correct
        playedCard.attack = libraryCard.attack; // Ensure base attack is correct

        player.board.push(playedCard);

        // Handle Deploy effects AFTER the creature is on the board
        if (playedCard.deployActionId) {
            // Target for deploy is often null/self/implicit, handled by the effect itself
            // We pass null here, the effect implementation (e.g., dealDamageToSelf) uses the caster context.
            triggerCardEffect(player, playedCard, playedCard.deployActionId, playedCard.deployParams || {}, null);
        }

        // Update board stats for both players after creature enters and deploy resolves
        updateBoardStats(player.id);
        updateBoardStats(getOpponentId(player.id));

    } else if (playedCard.type === "Spell") {
        console.log(`Playing spell: ${playedCard.name}`);
        logMessage(`${player.id} plays ${playedCard.name}.`);
        if (playedCard.actionId) {
            // Get the target object/element based on the clicked element and spell's target type
            const target = getTargetFromElement(targetElement, playedCard.target, player);

            // Check if the target is valid (not the string "invalid")
            if (target !== "invalid") {
                console.log(`Executing spell action ${playedCard.actionId} on target:`, target);
                // Pass the resolved target (which could be a player object, board array, card instance, or DOM element)
                success = triggerCardEffect(player, playedCard, playedCard.actionId, playedCard.actionParams || {}, target);
            } else {
                // Invalid target was selected or required target type wasn't met
                console.log("Invalid target for spell.");
                logMessage(`Invalid target for ${playedCard.name}.`, 'log-error');
                // Refund mana & put card back (simple rollback)
                player.hand.splice(cardIndexInHand, 0, playedCard);
                player.currentMana += playedCard.cost;
                success = false; // Mark as failed
            }
        } else {
             console.log(`Spell ${playedCard.name} has no defined action.`);
             // Spell still consumed, mana spent, but does nothing.
        }
        // Spells usually go to a graveyard, but we'll just let it be removed from hand for simplicity
    }

    // --- Post-Action Cleanup ---
    deselectCard(); // Clear selection state regardless of success/failure (unless rolled back)
    if (success && !isGameOver()) {
        checkWinCondition(); // Check win condition immediately after potential damage/healing/death
    }
    // Re-render happens AFTER checking win condition, otherwise we might render a dead state briefly
    if (!isGameOver()) {
        renderGame(); // Update UI
        updatePlayableCards(player); // Mana changed, update playable cards
    }
}
