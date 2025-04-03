// /js/aiCore.js
import { getState, getPlayer, getCurrentPlayer, getOpponentPlayer, isGameOver } from './state.js';
import { playCard } from './playerActions.js';
import { creatureAttack } from './combat.js';
import { endTurn } from './gameLogic.js';
import { MAX_BOARD_SIZE } from './constants.js';
import { logMessage } from './messaging.js';
import { findBestSpellTarget, findBestAttackTarget } from './aiTargeting.js';

const AI_ACTION_DELAY = 750; // ms between AI actions
const AI_ATTACK_DELAY = 500; // ms before AI attack visualization
const MAX_AI_ACTIONS_PER_TURN = 20; // Safety break

export function runAITurn() {
    console.log("--- AI Turn Start ---");
    if (isGameOver()) {
        logMessage("AI Turn: Game already over.", 'log-info');
        return;
    }
    const aiPlayer = getCurrentPlayer(); // AI is the current player
    const humanPlayer = getOpponentPlayer();

    let actionsTakenThisTurn = 0;

    function performNextAIAction() {
        if (isGameOver() || getState().currentPlayerId !== aiPlayer.id || actionsTakenThisTurn++ >= MAX_AI_ACTIONS_PER_TURN) {
            if (!isGameOver() && getState().currentPlayerId === aiPlayer.id) {
                logMessage("--- AI Turn End (Max Actions or No More Plays) ---", 'log-turn');
                endTurn();
            } else if (isGameOver()) {
                 logMessage("AI Action loop stopped: Game Over.", 'log-info');
            } else if (getState().currentPlayerId !== aiPlayer.id) {
                 logMessage("AI Action loop stopped: No longer AI's turn.", 'log-info');
            } else {
                 logMessage("AI Action loop stopped: Max actions reached.", 'log-info');
                 endTurn(); // Force end turn if stuck
            }
            return;
        }

        let actionExecuted = false;

        // --- AI Decision Logic ---

        // 1. Try to play a card
        const playableCards = aiPlayer.hand.filter(card =>
            card.cost <= aiPlayer.currentMana &&
            !(card.type === "Creature" && aiPlayer.board.length >= MAX_BOARD_SIZE)
        ).sort((a, b) => b.cost - a.cost); // Prioritize playing higher cost cards first

        // Find the first playable card for which the AI can execute the action (e.g., find a target if needed)
        let cardToPlay = null;
        let cardIndex = -1;
        let targetElement = null;
        let targetObject = undefined; // Use undefined to differentiate from null target for 'none'
        let requiresSpecificTarget = false;

        for (let i = 0; i < playableCards.length; i++) {
            const potentialCard = playableCards[i];
            const potentialIndex = aiPlayer.hand.findIndex(c => c.instanceId === potentialCard.instanceId);
            targetElement = null; // Reset for each potential card
            targetObject = undefined;
            requiresSpecificTarget = false;

            if (potentialCard.type === "Creature") {
                cardToPlay = potentialCard;
                cardIndex = potentialIndex;
                break; // Found a creature to play, no target needed initially
            } else if (potentialCard.type === "Spell") {
                requiresSpecificTarget = ['creature', 'any', 'hero'].includes(potentialCard.target);

                if (potentialCard.target === 'self') {
                    targetObject = aiPlayer;
                } else if (potentialCard.target === 'opponent-board') {
                    targetObject = humanPlayer.board;
                } else if (potentialCard.target === 'none') {
                    targetObject = null; // Explicitly no target needed
                } else {
                    // Needs specific target
                    targetElement = findBestSpellTarget(aiPlayer, humanPlayer, potentialCard);
                }

                // Check if this spell can be played
                if (requiresSpecificTarget && targetElement) {
                    // Found a specific target
                    cardToPlay = potentialCard;
                    cardIndex = potentialIndex;
                    break;
                } else if (!requiresSpecificTarget && targetObject !== undefined) {
                    // No specific target needed, and targetObject is set (e.g., self, board, none)
                    cardToPlay = potentialCard;
                    cardIndex = potentialIndex;
                    break;
                } else if (requiresSpecificTarget && !targetElement) {
                    // Specific target needed but not found, log and continue checking other cards
                     logMessage(`AI considering ${potentialCard.name}, but no suitable target found.`, 'log-info');
                }
            }
        }


        // If a playable card action was identified
        if (cardToPlay && cardIndex !== -1) {
            console.log(`AI determined to play: ${cardToPlay.name} (Cost: ${cardToPlay.cost}, Mana: ${aiPlayer.currentMana})`);

            if (cardToPlay.type === "Creature") {
                console.log(`AI plays creature: ${cardToPlay.name}`);
                playCard(aiPlayer, cardToPlay, cardIndex);
                actionExecuted = true;
            } else if (cardToPlay.type === "Spell") {
                 // We already determined targetElement/targetObject when selecting the card
                 console.log(`AI plays spell: ${cardToPlay.name} on target:`, targetElement || targetObject);
                 playCard(aiPlayer, cardToPlay, cardIndex, targetElement); // Pass element only if it exists
                 actionExecuted = true;
            }
        }


        // 2. If no card was played, try to attack
        if (!actionExecuted) {
            const availableAttackers = aiPlayer.board.filter(c => c.canAttack && !c.hasAttacked && !c.isFrozen && c.currentAttack > 0)
                                                .sort((a, b) => b.currentAttack - a.currentAttack); // Prioritize high attack

            if (availableAttackers.length > 0) {
                const attacker = availableAttackers[0]; // Use the highest attack available creature

                // Find best target for this attacker
                const attackTargetElement = findBestAttackTarget(attacker, humanPlayer);
                console.log(`[AI Attack Attempt] AI considering attack with ${attacker.name} (${attacker.instanceId}). Status: canAttack=${attacker.canAttack}, hasAttacked=${attacker.hasAttacked}, isFrozen=${attacker.isFrozen}, justPlayed=${attacker.justPlayed}, currentAttack=${attacker.currentAttack}`);

                if (attackTargetElement) {
                    console.log(`AI ${attacker.name} initiates attack on target:`, attackTargetElement);
                    // Use a timeout for visual delay before attacking
                    setTimeout(() => {
                        // Check game state & if attacker still exists on board and is owned by AI
                        const currentAIPlayer = getPlayer(aiPlayer.id); // Get potentially updated player state
                        const attackerStillExists = currentAIPlayer?.board.find(c => c.instanceId === attacker.instanceId);

                        if (!isGameOver() && getState().currentPlayerId === aiPlayer.id && attackerStillExists && attackerStillExists.canAttack && !attackerStillExists.hasAttacked && !attackerStillExists.isFrozen) {
                             // Re-evaluate target, it might have died or a better one appeared
                            const currentTargetElement = findBestAttackTarget(attackerStillExists, getOpponentPlayer());
                            if (currentTargetElement) {
                                console.log(`AI ${attackerStillExists.name} executes attack on target:`, currentTargetElement);
                                creatureAttack(attackerStillExists, currentTargetElement); // creatureAttack handles state checks, damage, render
                                // Check if more actions can be taken after attack
                                setTimeout(performNextAIAction, AI_ACTION_DELAY); // Check for next action after a short delay
                            } else {
                                 logMessage(`AI ${attackerStillExists.name} target disappeared before attack.`, 'log-info');
                                 performNextAIAction(); // Try next action
                            }
                        } else {
                             logMessage(`AI ${attacker.name} attack cancelled (Game state changed, attacker removed, or cannot attack anymore).`, 'log-info');
                             if (!isGameOver() && getState().currentPlayerId === aiPlayer.id) {
                                 performNextAIAction(); // Still AI's turn, try next action
                             } else if (!isGameOver()){
                                 // Turn likely ended by other means, do nothing.
                             }
                        }
                    }, AI_ATTACK_DELAY);
                    return; // Exit function early, attack timeout will trigger next check
                } else {
                    logMessage(`AI ${attacker.name} found no valid target to attack.`, 'log-info');
                    // Try next attacker or end turn if no attackers left
                }
            }
        }

        // 3. Decide next step
        if (actionExecuted) {
            // If a card was played, wait and then check for more actions
            setTimeout(performNextAIAction, AI_ACTION_DELAY);
        } else {
            // If no card played and no attack initiated, end the turn
            logMessage("--- AI Turn End (No more actions found) ---", 'log-turn');
            endTurn();
        }
    }

    // Start the AI action loop
    performNextAIAction();
}
