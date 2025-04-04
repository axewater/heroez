// /js/cardEffects.js
import { getState, getPlayer, getOpponentPlayer, getSelectedCard, getSelectedAttacker, setSelectedCard, setSelectedAttacker, setTargetingMode, getTargetingMode, getOpponentId } from './state.js';
import { flashElement } from './render.js'; // Assuming render.js is correct, ui.js had it before merge? Let's use render.js as per file structure
import { logMessage, setMessage } from './messaging.js'; // Assuming messaging.js is correct
import { updateBoardStats } from './boardLogic.js';
import { drawCard as drawCardLogic, createCardInstance, generateId } from './gameLogic.js';
import { STARTING_HEALTH, MAX_BOARD_SIZE, MAX_MANA } from './constants.js';
import { cardLibrary } from './cards.js';
import { animateDrawCard } from './animations.js'; // Import draw animation

// --- Action Implementations Map ---
// Maps actionId from card data to actual functions
export const actionImplementations = {
    dealDamage: (target, params, caster) => dealDamage(target, params.amount),
    restoreHealth: (target, params, caster) => restoreHealth(target, params.amount),
    temporaryBuff: (target, params, caster) => temporaryBuff(target, params.attack, params.health),
    permanentBuff: (target, params, caster) => permanentBuff(target, params.attack, params.health),
    freezeBoard: (target, params, caster) => freezeBoard(target),
    freezeCreature: (target, params, caster) => freezeCreature(target), // Added for single target freeze
    drawCards: async (target, params, caster) => { // Target is the caster player object
        const numToDraw = params.amount;
        console.log(`${caster.id} attempts to draw ${numToDraw} cards.`);

        // Trigger animations concurrently
        const animationPromises = [];
        for (let i = 0; i < numToDraw; i++) {
            animationPromises.push(animateDrawCard(caster));
        }
        await Promise.all(animationPromises); // Wait for all animations

        // After animations, update the state by actually drawing
        for (let i = 0; i < numToDraw; i++) {
            drawCardLogic(caster); // Use the imported gameLogic function
        }
    },
    dealDamageToSelf: (target, params, caster) => dealDamage(caster.heroElement, params.amount),
    restoreHealthToSelf: (target, params, caster) => restoreHealth(caster.heroElement, params.amount),
    summonCreature: (target, params, caster) => summonCreature(caster, params.cardId, params.count),
    gainTemporaryMana: (target, params, caster) => gainTemporaryMana(caster, params.amount), // Added Coin action
    gainAttack: (target, params, caster) => gainAttack(target, params.amount),
};

// --- Effect Trigger Function (Moved here) ---
export function triggerCardEffect(casterPlayer, sourceCard, actionId, params, target) {
    const actionFn = actionImplementations[actionId];
    if (actionFn) {
        try {
            console.log(`Triggering effect ${actionId} from ${sourceCard.name} on target:`, target);
            const result = actionFn(target, params, casterPlayer); // Pass caster context if needed
            return result; // Return the result, which might be a Promise
        } catch (e) {
            console.error(`Error executing action ${actionId} for card ${sourceCard.name}:`, e);
            return false; // Indicate failure
        }
    } else {
        console.warn(`Action ID ${actionId} not found in implementations.`);
        // Optionally treat as success or failure depending on game rules
        return false; // Treat unknown action as failure for safety
    }
}


// --- Effect/Mechanic Functions ---

export function dealDamage(target, amount) {
    if (amount <= 0 || !target) return;

    let targetHealth = -1;
    let targetName = "Unknown";
    let targetInstance = null; // Store the card instance if target is a creature

    if (target instanceof HTMLElement && target.classList.contains('hero-info')) {
        const playerId = target.id.includes('player') ? 'player' : 'opponent';
        const player = getPlayer(playerId);
        player.heroHealth -= amount;
        targetHealth = player.heroHealth;
        targetName = `${playerId} hero`;
        if (player.heroHealth <= 0) {
            player.heroHealth = 0;
        }
        flashElement(target, 'damage-flash');

    } else if (target && typeof target === 'object' && target.instanceId) {
        targetInstance = target; // Store the instance
        targetInstance.currentHealth -= amount;
        targetHealth = targetInstance.currentHealth;
        targetName = targetInstance.name;

        const cardEl = document.querySelector(`.card[data-instance-id="${targetInstance.instanceId}"]`);
        if (cardEl) {
            flashElement(cardEl, 'card-damage-shake');
            const healthEl = cardEl.querySelector('.card-health');
            if (healthEl) healthEl.textContent = targetInstance.currentHealth;
        }

        // Check for death AFTER applying damage visual but BEFORE frenzy
        if (targetInstance.currentHealth <= 0) {
            console.log(`Creature ${targetInstance.name} (${targetInstance.instanceId}) died.`);
            logMessage(`${targetInstance.name} is destroyed.`);
            removeCreatureFromBoard(targetInstance);
            // Don't trigger Frenzy if the creature dies
        } else {
            // Check for Frenzy only if the creature survived
            if (targetInstance.mechanics?.includes("Frenzy") && !targetInstance.frenzyTriggered && targetInstance.frenzyActionId) {
                targetInstance.frenzyTriggered = true; // Mark as triggered
                logMessage(`${targetInstance.name}'s Frenzy triggers!`, 'log-info');
                // Use the locally defined triggerCardEffect
                // Pass the creature instance itself as the target for the Frenzy effect (e.g., gainAttack targets self)
                triggerCardEffect(getPlayer(targetInstance.owner), targetInstance, targetInstance.frenzyActionId, targetInstance.frenzyActionParams || {}, targetInstance);
                // Remove 'has-frenzy' class visually via render update
            }
        }
    } else {
        console.warn("dealDamage called with invalid target:", target);
        return;
    }

    console.log(`${targetName} takes ${amount} damage. Health: ${targetHealth}`);
    // Win condition checked by caller (creatureAttack/playCard)
}

function restoreHealth(target, amount) {
    if (amount <= 0 || !target) return;

    let targetName = "Unknown";
    let currentHealth = 0;
    let maxHealth = STARTING_HEALTH;

    if (target instanceof HTMLElement && target.classList.contains('hero-info')) {
        const playerId = target.id.includes('player') ? 'player' : 'opponent';
        const player = getPlayer(playerId);
        player.heroHealth += amount;
        if (player.heroHealth > STARTING_HEALTH) player.heroHealth = STARTING_HEALTH;
        currentHealth = player.heroHealth;
        targetName = `${playerId} hero`;
        flashElement(target, 'heal-flash');

    } else if (target && typeof target === 'object' && target.instanceId) {
        maxHealth = target.health;
        target.currentHealth += amount;
        if (target.currentHealth > maxHealth) target.currentHealth = maxHealth;
        currentHealth = target.currentHealth;
        targetName = target.name;

        const cardEl = document.querySelector(`.card[data-instance-id="${target.instanceId}"]`);
        if (cardEl) {
            const healthEl = cardEl.querySelector('.card-health');
            if (healthEl) healthEl.textContent = target.currentHealth;
             // Maybe add heal flash to card?
             // flashElement(cardEl, 'card-heal-flash');
        }

    } else {
        console.warn("restoreHealth called with invalid target:", target);
        return;
    }

    console.log(`${targetName} restores ${amount} health. Health: ${currentHealth}/${maxHealth}`);
}

function permanentBuff(targetCard, attackBuff, healthBuff) {
    if (targetCard && targetCard.type === 'Creature') {
        const cardEl = document.querySelector(`.card[data-instance-id="${targetCard.instanceId}"]`);

        targetCard.currentAttack = Math.max(0, targetCard.currentAttack + attackBuff);
        // Update attack display immediately
        if (cardEl) {
            const attackEl = cardEl.querySelector('.card-attack');
            if (attackEl) attackEl.textContent = targetCard.currentAttack;
        }

        // If health is buffed, increase both current and max health
        if (healthBuff > 0) {
             targetCard.health += healthBuff;
             targetCard.currentHealth += healthBuff;
        } else { // If health is reduced (debuff), only affect current health, down to 1 minimum? Or allow 0? Let's allow 0 for now.
             targetCard.currentHealth += healthBuff;
             // Max health remains the same unless explicitly stated otherwise by effect
        }
         // Update health display immediately
         if (cardEl) {
            const healthEl = cardEl.querySelector('.card-health');
            if (healthEl) healthEl.textContent = targetCard.currentHealth;
        }


        logMessage(`${targetCard.name} gets permanently ${attackBuff >= 0 ? '+' : ''}${attackBuff}/${healthBuff >= 0 ? '+' : ''}${healthBuff}.`);
        console.log(`${targetCard.name} gets permanently +${attackBuff}/+${healthBuff}. Stats: ${targetCard.currentAttack}/${targetCard.currentHealth} (Max: ${targetCard.health})`);
        // Update board stats if the buff affects base stats used by auras (it shouldn't typically)
        // updateBoardStats(targetCard.owner);
        // updateBoardStats(getOpponentId(targetCard.owner));
    } else {
        console.warn("permanentBuff target is not a creature:", targetCard);
    }
}

function temporaryBuff(targetCard, attackBuff, healthBuff) {
    if (targetCard && targetCard.type === 'Creature') {
        const cardEl = document.querySelector(`.card[data-instance-id="${targetCard.instanceId}"]`);
        const effectId = `tempBuff_${generateId()}`; // Unique ID for this specific buff instance

        targetCard.currentAttack = Math.max(0, targetCard.currentAttack + attackBuff);
        if (cardEl) {
            const attackEl = cardEl.querySelector('.card-attack');
            if (attackEl) attackEl.textContent = targetCard.currentAttack;
        }

        targetCard.currentHealth += healthBuff;
        if (cardEl) {
            const healthEl = cardEl.querySelector('.card-health');
            if (healthEl) healthEl.textContent = targetCard.currentHealth;
        }

        // DO NOT increase max health (targetCard.health) for temporary buffs
        logMessage(`${targetCard.name} gets temporarily ${attackBuff >= 0 ? '+' : ''}${attackBuff}/${healthBuff >= 0 ? '+' : ''}${healthBuff}.`);
        console.log(`${targetCard.name} gets temporarily +${attackBuff}/+${healthBuff}. Stats: ${targetCard.currentAttack}/${targetCard.currentHealth}`);

        targetCard.effects.push({ id: effectId, type: 'tempBuff', attack: attackBuff, health: healthBuff, duration: 1 }); // Duration 1 = expires at end of this turn
    } else {
         console.warn("temporaryBuff target is not a creature:", targetCard);
    }
}

/**
 * Freezes all creatures on a given board (array of creature instances).
 * @param {Array<Object>} board - The array of creature instances to freeze.
 */
function freezeBoard(board) {
    if (Array.isArray(board)) {
        board.forEach(creature => {
            if (creature && creature.type === 'Creature') {
                creature.isFrozen = true;
                creature.canAttack = false; // Frozen creatures cannot attack
                logMessage(`${creature.name} is frozen.`);
                console.log(`${creature.name} (${creature.instanceId}) is frozen.`);
            }
        });
        setMessage("Enemy creatures frozen!");
    } else {
         console.warn("freezeBoard target is not a board array:", board);
    }
    // Visual update happens in renderGame
}

/**
 * Freezes a single target creature.
 * @param {Object} targetCard - The creature card instance to freeze.
 */
function freezeCreature(targetCard) {
    if (targetCard && targetCard.type === 'Creature') {
        targetCard.isFrozen = true;
        targetCard.canAttack = false; // Ensure cannot attack while frozen
        logMessage(`${targetCard.name} is frozen.`);
        console.log(`${targetCard.name} (${targetCard.instanceId}) is frozen.`);
        // Visual update happens in renderGame
    } else {
        console.warn("freezeCreature target is not a valid creature:", targetCard);
    }
}

function gainAttack(targetCard, amount) {
    if (targetCard && targetCard.type === 'Creature') {
        targetCard.currentAttack = Math.max(0, targetCard.currentAttack + amount);
        logMessage(`${targetCard.name} gains +${amount} Attack.`);
        console.log(`${targetCard.name} gains +${amount} Attack. New Attack: ${targetCard.currentAttack}`);

        // --- Immediate Visual Update ---
        const cardEl = document.querySelector(`.card[data-instance-id="${targetCard.instanceId}"]`);
        if (cardEl) {
            const attackEl = cardEl.querySelector('.card-attack');
            if (attackEl) {
                attackEl.textContent = targetCard.currentAttack;
                // Optional: Add a visual flash to the stat
                attackEl.classList.add('stat-change-flash');
                attackEl.addEventListener('animationend', () => attackEl.classList.remove('stat-change-flash'), { once: true });
            }
        }
        // --- End Immediate Visual Update ---

        // Re-check board stats if this interacts with Auras (unlikely for currentAttack)
    } else {
        console.warn("gainAttack target is not a creature:", targetCard);
    }
}

function gainTemporaryMana(casterPlayer, amount) {
    if (!casterPlayer) return;
    const manaGained = Math.min(amount, MAX_MANA - casterPlayer.currentMana); // Cannot exceed max mana
    if (manaGained > 0) {
        casterPlayer.currentMana += manaGained;
        logMessage(`${casterPlayer.id} gains ${manaGained} temporary Mana Crystal.`, 'log-info');
        console.log(`${casterPlayer.id} gains ${manaGained} mana. Current: ${casterPlayer.currentMana}/${casterPlayer.maxMana}`);
    }
}

function summonCreature(player, cardIdToSummon, count) {
    const cardData = cardLibrary.find(c => c.id === cardIdToSummon);
    if (!cardData) {
        console.error(`Card data not found for ID: ${cardIdToSummon}`);
        return;
    }
    let summoned = false;
    for (let i = 0; i < count; i++) {
        if (player.board.length < MAX_BOARD_SIZE) {
            const newCreature = createCardInstance(cardData, player.id);
             // Set justPlayed=true for summoned creatures too
             newCreature.justPlayed = true;
             newCreature.canAttack = !!newCreature.mechanics?.includes("Swift");
             newCreature.hasAttacked = false;
             newCreature.isFrozen = false;
            player.board.push(newCreature);
            logMessage(`${player.id} summons ${newCreature.name}.`);
            summoned = true;
        } else {
            logMessage(`Board full, cannot summon ${cardData.name}!`, 'log-error');
            break;
        }
    }
    // Update board stats only if a creature was actually summoned
    if (summoned) {
        updateBoardStats(player.id);
        updateBoardStats(getOpponentId(player.id));
    }
}

function removeCreatureFromBoard(creature) {
    const owner = getPlayer(creature.owner);
    if (owner) {
        const initialBoardSize = owner.board.length;
        // Add creature to discard pile *before* removing from board array
        owner.discardPile.push(creature);
        console.log(`Added ${creature.name} (${creature.instanceId}) to ${owner.id}'s discard pile.`);
        owner.board = owner.board.filter(c => c.instanceId !== creature.instanceId);
        const removed = owner.board.length < initialBoardSize;
        if (removed) {
            console.log(`Removed ${creature.name} from ${owner.id}'s board.`);
            updateBoardStats(owner.id);
            updateBoardStats(getOpponentId(owner.id));
        }
    } else {
        console.error(`Could not find owner (${creature.owner}) for creature ${creature.name}`);
    }
     // Visual update happens in renderGame called by the action that caused removal
}
