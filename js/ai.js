import { getState, getPlayer, getCurrentPlayer, getOpponentPlayer, isGameOver } from './state.js';
import { playCard, creatureAttack, getTargetFromElement } from './actions.js';
import { endTurn } from './gameLogic.js';
import { MAX_BOARD_SIZE, STARTING_HEALTH } from './constants.js';
import { getDOMElement, logMessage } from './ui.js'; // To find target elements, added logMessage

const AI_ACTION_DELAY = 750; // ms between AI actions
const AI_ATTACK_DELAY = 500; // ms before AI attack visualization
const AI_TURN_START_DELAY = 1000; // ms before AI starts thinking (set in gameLogic)
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

        if (playableCards.length > 0) {
            const cardToPlay = playableCards[0];
            const cardIndex = aiPlayer.hand.findIndex(c => c.instanceId === cardToPlay.instanceId);

            console.log(`AI considering playing: ${cardToPlay.name} (Cost: ${cardToPlay.cost}, Mana: ${aiPlayer.currentMana})`);

            if (cardToPlay.type === "Creature") {
                // Simple: Play creature directly if possible
                console.log(`AI plays creature: ${cardToPlay.name}`);
                playCard(aiPlayer, cardToPlay, cardIndex); // playCard handles mana, removal, deploy etc.
                actionExecuted = true;
            } else if (cardToPlay.type === "Spell") {
                let targetElement = null;
                let targetObject = null; // For self/board targets

                // Determine target based on spell requirements
                if (cardToPlay.target === 'self') {
                    targetObject = aiPlayer; // Target the player object itself
                } else if (cardToPlay.target === 'opponent-board') {
                    targetObject = humanPlayer.board; // Target the array of creatures
                } else {
                    // Needs specific target (creature, any, hero)
                    targetElement = findBestSpellTarget(aiPlayer, humanPlayer, cardToPlay);
                }

                // Check if a valid target was found or if target is object-based
                if (targetElement || targetObject) {
                     console.log(`AI plays spell: ${cardToPlay.name} on target:`, targetElement || targetObject);
                     // Pass element for specific targets, null if target is self/board (action handles it)
                     playCard(aiPlayer, cardToPlay, cardIndex, targetElement);
                     actionExecuted = true;
                } else if (!cardToPlay.target || cardToPlay.target === 'none') {
                     // Spell has no target or target is implicit (handled by action)
                     console.log(`AI plays spell with no explicit target: ${cardToPlay.name}`);
                     playCard(aiPlayer, cardToPlay, cardIndex, null);
                     actionExecuted = true;
                } else {
                    logMessage(`AI could not find suitable target for ${cardToPlay.name}. Skipping play.`, 'log-info');
                    // Card remains in hand for now, maybe try attacking instead.
                }
            }
        }

        // 2. If no card was played, try to attack
        if (!actionExecuted) {
            const availableAttackers = aiPlayer.board.filter(c => c.canAttack && !c.hasAttacked && !c.isFrozen && c.currentAttack > 0)
                                                .sort((a, b) => b.currentAttack - a.currentAttack); // Prioritize high attack

            if (availableAttackers.length > 0) {
                const attacker = availableAttackers[0]; // Use the highest attack available creature

                // Find best target for this attacker
                const targetElement = findBestAttackTarget(attacker, humanPlayer);

                if (targetElement) {
                    console.log(`AI ${attacker.name} initiates attack on target:`, targetElement);
                    // Use a timeout for visual delay before attacking
                    // IMPORTANT: Check game state again inside timeout before executing attack
                    setTimeout(() => {
                        if (!isGameOver() && getState().currentPlayerId === aiPlayer.id && getPlayer(aiPlayer.id).board.includes(attacker)) { // Check game state & if attacker still exists
                            const currentTargetElement = findBestAttackTarget(attacker, humanPlayer); // Re-evaluate target, it might have died
                            if (currentTargetElement) {
                                console.log(`AI ${attacker.name} executes attack on target:`, currentTargetElement);
                                creatureAttack(attacker, currentTargetElement); // creatureAttack handles state checks, damage, render
                                // Check if more actions can be taken after attack
                                setTimeout(performNextAIAction, AI_ACTION_DELAY); // Check for next action after a short delay
                            } else {
                                 logMessage(`AI ${attacker.name} target disappeared before attack.`, 'log-info');
                                 performNextAIAction(); // Try next action
                            }
                        } else {
                             logMessage(`AI ${attacker.name} attack cancelled (Game state changed).`, 'log-info');
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


// --- AI Targeting Helpers ---

function findBestSpellTarget(aiPlayer, humanPlayer, spellCard) {
    let potentialTargets = []; // Array of { element: DOMElement, score: number }
    const targetType = spellCard.target;

    // Helper to get element for a card instance
    const getCardElement = (cardInstance) => {
        const ownerPrefix = cardInstance.owner === 'player' ? 'player' : 'opponent';
        return getDOMElement(`${ownerPrefix}BoardEl`)?.querySelector(`.card[data-instance-id="${cardInstance.instanceId}"]`);
    };

    // --- Evaluate Potential Targets ---

    // Damage Spells (e.g., Fireball, Lightning Bolt)
    if (spellCard.actionId === 'dealDamage') {
        // Priority: Lethal on hero > Remove high-attack creature > Remove taunt > Damage hero > Damage other creature
        const damageAmount = spellCard.actionParams.amount;

        // Check hero lethal
        if ((targetType === 'any' || targetType === 'hero') && humanPlayer.heroHealth <= damageAmount) {
            potentialTargets.push({ element: humanPlayer.heroElement, score: 1000 });
        }
        // Check creature targets
        humanPlayer.board.forEach(creature => {
            if (targetType === 'any' || targetType === 'creature') {
                const element = getCardElement(creature);
                if (element) {
                    let score = 0;
                    if (creature.currentHealth <= damageAmount) score += 100; // Lethal on creature
                    if (creature.isTaunt) score += 50; // Prioritize removing taunt
                    score += creature.currentAttack * 10; // Prioritize high attack
                    score += creature.currentHealth; // Lower health slightly better target
                    potentialTargets.push({ element, score });
                }
            }
        });
         // Target hero non-lethal (lower priority)
        if ((targetType === 'any' || targetType === 'hero') && humanPlayer.heroHealth > damageAmount) {
             potentialTargets.push({ element: humanPlayer.heroElement, score: 10 });
        }
    }
    // Healing Spells (e.g., Healing Touch)
    else if (spellCard.actionId === 'restoreHealth') {
         // Priority: Heal own hero if damaged > Heal high-value damaged creature
         const healAmount = spellCard.actionParams.amount;
         // Heal own hero
         if ((targetType === 'any' || targetType === 'hero') && aiPlayer.heroHealth < STARTING_HEALTH) {
             const healthMissing = STARTING_HEALTH - aiPlayer.heroHealth;
             potentialTargets.push({ element: aiPlayer.heroElement, score: Math.min(healAmount, healthMissing) * 5 }); // Score based on effective healing
         }
         // Heal own creatures
         aiPlayer.board.forEach(creature => {
             if ((targetType === 'any' || targetType === 'creature') && creature.currentHealth < creature.health) {
                 const element = getCardElement(creature);
                 if (element) {
                     const healthMissing = creature.health - creature.currentHealth;
                     let score = Math.min(healAmount, healthMissing) * 2; // Base score on effective healing
                     score += creature.attack * 1; // Prioritize healing valuable creatures
                     potentialTargets.push({ element, score });
                 }
             }
         });
         // Low priority: Heal enemy if 'any' and nothing else to heal (usually bad idea)
    }
    // Buff Spells (e.g., Battle Rage, Shield Wall)
    else if (spellCard.actionId === 'permanentBuff' || spellCard.actionId === 'temporaryBuff') {
        // Priority: Buff creature that can attack this turn > Buff high-attack creature > Buff high-health creature
        aiPlayer.board.forEach(creature => {
            if (targetType === 'creature') { // Buffs usually target creatures
                 const element = getCardElement(creature);
                 if (element) {
                     let score = 10; // Base score for valid target
                     if (creature.canAttack && !creature.hasAttacked) score += 50; // Can use buff immediately
                     score += creature.currentAttack * 2;
                     score += creature.currentHealth;
                     potentialTargets.push({ element, score });
                 }
            }
        });
    }
    // Add more spell targeting logic here...

    // --- Select Best Target ---
    if (potentialTargets.length > 0) {
        potentialTargets.sort((a, b) => b.score - a.score); // Sort descending by score
        console.log(`AI Spell Targeting for ${spellCard.name}: Best target score ${potentialTargets[0].score}`, potentialTargets[0].element);
        return potentialTargets[0].element; // Return the DOM element of the best target
    }

    logMessage(`AI Spell Targeting for ${spellCard.name}: No suitable target found.`, 'log-info');
    return null; // No suitable target found
}


function findBestAttackTarget(attacker, humanPlayer) {
    let potentialTargets = []; // Array of { element: DOMElement, score: number }

    const opponentTaunts = humanPlayer.board.filter(c => c.isTaunt);

    // Helper to get element for a card instance or hero
    const getElement = (target) => {
        if (target === humanPlayer.heroElement) return humanPlayer.heroElement;
        const ownerPrefix = target.owner === 'player' ? 'player' : 'opponent';
        return getDOMElement(`${ownerPrefix}BoardEl`)?.querySelector(`.card[data-instance-id="${target.instanceId}"]`);
    };


    if (opponentTaunts.length > 0) {
        // Must attack Taunt
        opponentTaunts.forEach(tauntCreature => {
            const element = getElement(tauntCreature);
            if (element) {
                let score = 1000; // High base score for mandatory target
                // Prioritize killing the taunt if possible
                if (tauntCreature.currentHealth <= attacker.currentAttack) score += 500;
                // Lower score if attacker would die
                if (attacker.currentHealth <= tauntCreature.currentAttack) score -= 200;
                score -= tauntCreature.currentHealth; // Slightly prefer lower health taunts
                potentialTargets.push({ element, score });
            }
        });
    } else {
        // Can attack any valid target (creatures or hero)
        // Priority: Lethal on hero > Kill creature (value trade) > Damage hero > Damage creature (unfavorable trade)

        // Check hero lethal
        if (humanPlayer.heroHealth <= attacker.currentAttack) {
            potentialTargets.push({ element: humanPlayer.heroElement, score: 10000 });
        }

        // Check creatures
        humanPlayer.board.forEach(creature => {
             const element = getElement(creature);
             if (element) {
                 let score = 50; // Base score for attacking a creature
                 const lethalOnTarget = creature.currentHealth <= attacker.currentAttack;
                 const attackerDies = attacker.currentHealth <= creature.currentAttack;

                 if (lethalOnTarget) score += 200; // Good to kill things
                 if (attackerDies) score -= 150; // Bad if attacker dies
                 if (lethalOnTarget && !attackerDies) score += 300; // Excellent trade

                 score += creature.currentAttack * 5; // Prioritize removing threats
                 score -= creature.currentHealth; // Prefer lower health targets if not lethal

                 potentialTargets.push({ element, score });
             }
        });

         // Target hero non-lethal (lower priority than good trades)
         if (humanPlayer.heroHealth > attacker.currentAttack) {
              potentialTargets.push({ element: humanPlayer.heroElement, score: 40 });
         }
    }

     // --- Select Best Target ---
    if (potentialTargets.length > 0) {
        potentialTargets.sort((a, b) => b.score - a.score); // Sort descending by score
        console.log(`AI Attack Targeting for ${attacker.name}: Best target score ${potentialTargets[0].score}`, potentialTargets[0].element);
        return potentialTargets[0].element; // Return the DOM element of the best target
    }

    logMessage(`AI Attack Targeting for ${attacker.name}: No target found.`, 'log-info');
    return null; // No target found
}
