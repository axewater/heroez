import { getState, getPlayer, getOpponentPlayer, getSelectedCard, getSelectedAttacker, setSelectedCard, setSelectedAttacker, setTargetingMode, getTargetingMode, getOpponentId } from './state.js'; // Added getOpponentId
import { flashElement } from './render.js';
import { logMessage, setMessage } from './messaging.js';
import { updateBoardStats } from './boardLogic.js';
import { drawCard as drawCardLogic, createCardInstance } from './gameLogic.js'; // Renamed to avoid conflict
import { STARTING_HEALTH, MAX_BOARD_SIZE } from './constants.js';
import { cardLibrary } from './cards.js';

// --- Action Implementations Map ---
// Maps actionId from card data to actual functions
export const actionImplementations = {
    dealDamage: (target, params, caster) => dealDamage(target, params.amount),
    restoreHealth: (target, params, caster) => restoreHealth(target, params.amount),
    temporaryBuff: (target, params, caster) => temporaryBuff(target, params.attack, params.health),
    permanentBuff: (target, params, caster) => permanentBuff(target, params.attack, params.health),
    freezeBoard: (target, params, caster) => freezeBoard(target), // Target here is expected to be the board array
    drawCards: (target, params, caster) => { // Target is the caster player object
        for (let i = 0; i < params.amount; i++) {
            drawCardLogic(caster); // Use the imported gameLogic function
        }
    },
    dealDamageToSelf: (target, params, caster) => dealDamage(caster.heroElement, params.amount),
    restoreHealthToSelf: (target, params, caster) => restoreHealth(caster.heroElement, params.amount),
    summonCreature: (target, params, caster) => summonCreature(caster, params.cardId, params.count),
    // Add more actions here as needed
};


// --- Effect/Mechanic Functions ---

export function dealDamage(target, amount) {
    if (amount <= 0 || !target) return; // No damage dealt or invalid target

    let targetHealth = -1;
    let targetName = "Unknown";

    if (target instanceof HTMLElement && target.classList.contains('hero-info')) { // Target is Hero
        const playerId = target.id.includes('player') ? 'player' : 'opponent';
        const player = getPlayer(playerId);
        player.heroHealth -= amount;
        targetHealth = player.heroHealth;
        targetName = `${playerId} hero`;
        if (player.heroHealth <= 0) {
            player.heroHealth = 0; // Don't go below 0
            // Win condition checked separately
        }
        flashElement(target, 'damage-flash');

    } else if (target && typeof target === 'object' && target.instanceId) { // Target is Creature
        target.currentHealth -= amount;
        targetHealth = target.currentHealth;
        targetName = target.name;

        const cardEl = document.querySelector(`.card[data-instance-id="${target.instanceId}"]`);
        if (cardEl) {
            flashElement(cardEl, 'card-damage-shake');
            // Update health display immediately for feedback (renderGame will do it again)
            const healthEl = cardEl.querySelector('.card-health');
            if (healthEl) healthEl.textContent = target.currentHealth;
        }

        // Check for death AFTER applying damage visual
        if (target.currentHealth <= 0) {
            console.log(`Creature ${target.name} (${target.instanceId}) died.`);
            logMessage(`${target.name} is destroyed.`);
            removeCreatureFromBoard(target);
            // Update board stats for both players after creature leaves
            // Note: removeCreatureFromBoard already calls updateBoardStats
            // updateBoardStats(target.owner);
            // updateBoardStats(getOpponentId(target.owner));
            // Don't check win condition here, let the calling action do it
        } else {
            // Trigger Frenzy? (Not implemented yet)
            // if (target.mechanics.includes("Frenzy")) { ... }
        }
    } else {
        console.warn("dealDamage called with invalid target:", target);
        return; // Exit if target wasn't valid
    }

    console.log(`${targetName} takes ${amount} damage. Health: ${targetHealth}`);
    // Re-rendering and win check happens in the calling function (playCard/creatureAttack)
}

function restoreHealth(target, amount) {
    if (amount <= 0 || !target) return;

    let targetName = "Unknown";
    let currentHealth = 0;
    let maxHealth = STARTING_HEALTH; // Default for heroes

    if (target instanceof HTMLElement && target.classList.contains('hero-info')) { // Target is Hero
        const playerId = target.id.includes('player') ? 'player' : 'opponent';
        const player = getPlayer(playerId);
        player.heroHealth += amount;
        if (player.heroHealth > STARTING_HEALTH) player.heroHealth = STARTING_HEALTH; // Cap at max health
        currentHealth = player.heroHealth;
        targetName = `${playerId} hero`;
        flashElement(target, 'heal-flash');

    } else if (target && typeof target === 'object' && target.instanceId) { // Target is Creature
        maxHealth = target.health; // Creature's max health
        target.currentHealth += amount;
        if (target.currentHealth > maxHealth) target.currentHealth = maxHealth; // Cap at max health
        currentHealth = target.currentHealth;
        targetName = target.name;

        const cardEl = document.querySelector(`.card[data-instance-id="${target.instanceId}"]`);
         if (cardEl) {
             // Add heal flash? Maybe green border?
             // Update health display immediately
             const healthEl = cardEl.querySelector('.card-health');
             if (healthEl) healthEl.textContent = target.currentHealth;
         }

    } else {
        console.warn("restoreHealth called with invalid target:", target);
        return;
    }

    console.log(`${targetName} restores ${amount} health. Health: ${currentHealth}/${maxHealth}`);
    // Re-rendering happens in the calling function (playCard)
}

function permanentBuff(targetCard, attackBuff, healthBuff) {
    if (targetCard && targetCard.type === 'Creature') {
        targetCard.currentAttack = Math.max(0, targetCard.currentAttack + attackBuff); // Attack can't be negative
        targetCard.currentHealth += healthBuff;
        targetCard.health += healthBuff; // Increase max health as well
        logMessage(`${targetCard.name} gets permanently +${attackBuff}/+${healthBuff}.`);
        console.log(`${targetCard.name} gets permanently +${attackBuff}/+${healthBuff}. Stats: ${targetCard.currentAttack}/${targetCard.currentHealth}`);
        // Visual update happens in renderGame
    } else {
        console.warn("permanentBuff target is not a creature:", targetCard);
    }
}

function temporaryBuff(targetCard, attackBuff, healthBuff) {
    // TODO: Implement proper temporary effect tracking and removal
    console.warn("Temporary buff applied - currently lasts forever!");
    if (targetCard && targetCard.type === 'Creature') {
        targetCard.currentAttack = Math.max(0, targetCard.currentAttack + attackBuff);
        targetCard.currentHealth += healthBuff;
        // DO NOT increase max health (targetCard.health) for temporary buffs
        logMessage(`${targetCard.name} gets temporarily +${attackBuff}/+${healthBuff}.`);
        console.log(`${targetCard.name} gets temporarily +${attackBuff}/+${healthBuff}. Stats: ${targetCard.currentAttack}/${targetCard.currentHealth}`);
        // Add effect to card.effects list to be cleared at end of turn
        // targetCard.effects = targetCard.effects || [];
        // targetCard.effects.push({ type: 'tempBuff', attack: attackBuff, health: healthBuff, duration: 1 });
    } else {
         console.warn("temporaryBuff target is not a creature:", targetCard);
    }
}

function freezeBoard(board) { // Expects the array of creatures
    // TODO: Implement Freeze mechanic properly
    console.warn("Freeze effect not fully implemented!");
    if (Array.isArray(board)) {
        board.forEach(creature => {
            if (creature && creature.type === 'Creature') {
                creature.isFrozen = true;
                creature.canAttack = false; // Frozen creatures cannot attack
                logMessage(`${creature.name} is frozen.`);
                console.log(`${creature.name} is frozen.`);
            }
        });
        setMessage("Enemy creatures frozen!"); // Update message state
    } else {
         console.warn("freezeBoard target is not a board array:", board);
    }
    // Visual update happens in renderGame
}

function summonCreature(player, cardIdToSummon, count) {
    const cardData = cardLibrary.find(c => c.id === cardIdToSummon);
    if (!cardData) {
        console.error(`Card data not found for ID: ${cardIdToSummon}`);
        return;
    }
    for (let i = 0; i < count; i++) {
        if (player.board.length < MAX_BOARD_SIZE) {
            const newCreature = createCardInstance(cardData, player.id);
            player.board.push(newCreature);
            logMessage(`${player.id} summons ${newCreature.name}.`);
        } else {
            logMessage(`Board full, cannot summon ${cardData.name}!`, 'log-error');
            break;
        }
    }
    // Update board stats for both players after summoning
    updateBoardStats(player.id);
    updateBoardStats(getOpponentId(player.id));

    // Visual update happens in renderGame
}


function removeCreatureFromBoard(creature) {
    const owner = getPlayer(creature.owner);
    if (owner) {
        owner.board = owner.board.filter(c => c.instanceId !== creature.instanceId);
        console.log(`Removed ${creature.name} from ${owner.id}'s board.`);
        // Update board stats for both players after creature leaves
        updateBoardStats(owner.id);
        updateBoardStats(getOpponentId(owner.id)); // This call should now work
        // Could add to a graveyard pile if needed: owner.graveyard.push(creature);
    } else {
        console.error(`Could not find owner (${creature.owner}) for creature ${creature.name}`);
    }
     // Visual update happens in renderGame
}
