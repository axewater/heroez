import { getState, getPlayer, getCurrentPlayer, getOpponentPlayer, getOpponentId, setMessageState, setGameOver, isGameOver } from './state.js';
import { renderGame, updatePlayableCards, deselectCard, deselectAttacker, setMessage, logMessage, flashElement, getDOMElement } from './ui.js';
import { checkWinCondition, drawCard as drawCardLogic, createCardInstance } from './gameLogic.js';
import { MAX_BOARD_SIZE, STARTING_HEALTH } from './constants.js';
import { cardLibrary } from './cards.js'; // Needed for summonCreature

// --- Action Implementations Map ---
// Maps actionId from card data to actual functions
const actionImplementations = {
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
        console.log("Playing creature: ${playedCard.name}");
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

    } else if (playedCard.type === "Spell") {
        console.log("Playing spell: ${playedCard.name}");
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
             console.log("Spell ${playedCard.name} has no defined action.");
             // Spell still consumed, mana spent, but does nothing.
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

export function creatureAttack(attackerCard, targetElement) {
    const attackerPlayer = getPlayer(attackerCard.owner);
    const opponentPlayer = getOpponentPlayer(); // Assumes attacker is current player

    // Find the target instance (card or hero)
    const target = getTargetFromElement(targetElement, 'any', attackerPlayer); // 'any' type allows hero or creature

    if (target === "invalid") {
        console.error("Invalid attack target element.");
        deselectAttacker();
        renderGame();
        return;
    }

    // Check for Taunt if target is not Taunt itself
    const targetIsHero = target instanceof HTMLElement && target.classList.contains('hero-info');
    const targetCardInstance = (!targetIsHero && typeof target === 'object' && target.instanceId) ? target : null;

    const tauntMinions = opponentPlayer.board.filter(c => c.isTaunt);
    if (tauntMinions.length > 0 && (!targetCardInstance || !targetCardInstance.isTaunt)) {
        logMessage("Must attack a Taunt creature!", 'log-error');
        console.log("Attack blocked by Taunt");
        deselectAttacker();
        renderGame(); // Re-render to remove attacking state
        return;
    }

     // Check if attacker can attack (redundant with UI checks but good safety)
     if (!attackerCard.canAttack || attackerCard.hasAttacked || attackerCard.isFrozen || attackerCard.currentAttack <= 0) {
         console.log(`Attacker ${attackerCard.name} cannot attack (canAttack: ${attackerCard.canAttack}, hasAttacked: ${attackerCard.hasAttacked}, isFrozen: ${attackerCard.isFrozen}).`);
         setMessage("${attackerCard.name} cannot attack.");
         deselectAttacker();
         renderGame();
         return;
     }


    // --- Execute Combat ---
    const targetName = targetCardInstance ? targetCardInstance.name : (targetIsHero ? getOpponentId(attackerPlayer.id) + ' hero' : 'invalid target');
    logMessage(`${attackerCard.name} attacks ${targetName}.`);

    // Attacker deals damage to target
    dealDamage(target, attackerCard.currentAttack);

    // Target deals damage back to attacker (if it's a creature with attack > 0)
    if (targetCardInstance && targetCardInstance.currentAttack > 0) {
        dealDamage(attackerCard, targetCardInstance.currentAttack);
    }

    // Mark attacker as having attacked
    attackerCard.hasAttacked = true;
    attackerCard.canAttack = false; // Cannot attack again this turn (usually)

    // --- Post-Action Cleanup ---
    deselectAttacker(); // Clear selection state
    if (!isGameOver()) {
        checkWinCondition(); // Check win condition after combat
    }
     if (!isGameOver()) {
        renderGame(); // Update UI
        updatePlayableCards(attackerPlayer); // Update highlights (attacker can no longer attack)
    }
}


// --- Effect/Mechanic Functions ---

function triggerCardEffect(casterPlayer, sourceCard, actionId, params, target) {
    const actionFn = actionImplementations[actionId];
    if (actionFn) {
        try {
            console.log(`Triggering effect ${actionId} from ${sourceCard.name} on target:`, target);
            actionFn(target, params, casterPlayer); // Pass caster context if needed
            return true; // Indicate success
        } catch (e) {
            console.error("Error executing action ${actionId} for card ${sourceCard.name}:", e);
            return false; // Indicate failure
        }
    } else {
        console.warn(`Action ID ${actionId} not found in implementations.`);
        // Optionally treat as success or failure depending on game rules
        return false; // Treat unknown action as failure for safety
    }
}


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
            console.log("Creature ${target.name} (${target.instanceId}) died.");
            logMessage(`${target.name} is destroyed.`);
            removeCreatureFromBoard(target);
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

export function restoreHealth(target, amount) {
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

export function permanentBuff(targetCard, attackBuff, healthBuff) {
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

export function temporaryBuff(targetCard, attackBuff, healthBuff) {
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

export function freezeBoard(board) { // Expects the array of creatures
    // TODO: Implement Freeze mechanic properly
    console.warn("Freeze effect not fully implemented!");
    if (Array.isArray(board)) {
        board.forEach(creature => {
            if (creature && creature.type === 'Creature') {
                creature.isFrozen = true;
                creature.canAttack = false; // Frozen creatures cannot attack
                logMessage(`${creature.name} is frozen.`);
                console.log("${creature.name} is frozen.");
            }
        });
        setMessageState("Enemy creatures frozen!"); // Update message state
    } else {
         console.warn("freezeBoard target is not a board array:", board);
    }
    // Visual update happens in renderGame
}

export function summonCreature(player, cardIdToSummon, count) {
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
    // Visual update happens in renderGame
}


export function removeCreatureFromBoard(creature) {
    const owner = getPlayer(creature.owner);
    if (owner) {
        owner.board = owner.board.filter(c => c.instanceId !== creature.instanceId);
        console.log("Removed ${creature.name} from ${owner.id}'s board.");
        // Could add to a graveyard pile if needed: owner.graveyard.push(creature);
    } else {
        console.error("Could not find owner (${creature.owner}) for creature ${creature.name}");
    }
     // Visual update happens in renderGame
}

// --- Helper Functions ---

// Determines the actual target object (card instance or hero element) based on click event target
export function getTargetFromElement(element, targetType, caster) {
    if (!element && (targetType === 'creature' || targetType === 'any' || targetType === 'hero')) {
        console.log("Target required but none provided for type:", targetType);
        return "invalid"; // Requires a specific target but none given
    }
    if (targetType === 'self') return caster; // Target is the caster player object
    if (targetType === 'opponent-board') return getOpponentPlayer().board; // Target the array of creatures

    const cardInstanceId = element ? element.dataset.instanceId : null;
    const targetPlayerId = element ? (element.closest('#player-area') ? 'player' : (element.closest('#opponent-area') ? 'opponent' : null)) : null;

    if (element && element.classList.contains('hero-info')) { // Targeting a hero
        if (targetType === 'any' || targetType === 'hero') {
            return element; // Return the hero element itself
        } else {
            console.log("Invalid target: Hero targeted, but spell requires", targetType);
            return "invalid";
        }
    } else if (cardInstanceId && targetPlayerId) { // Targeting a creature
        const targetPlayer = getPlayer(targetPlayerId);
        const targetCard = targetPlayer?.board.find(c => c.instanceId === cardInstanceId);
        if (targetCard && (targetType === 'any' || targetType === 'creature')) {
            return targetCard; // Return the card instance object
        } else {
             console.log(`Invalid target: Card element found (id: ${cardInstanceId}), but spell requires ${targetType} or card not found on board.`);
            return "invalid";
        }
    }

    // If no specific element target was needed (e.g., 'self', 'opponent-board'), those cases are handled above.
    // If we reach here, it means a specific target was expected but not found or invalid.
    console.log("Invalid target: Could not determine target from element:", element);
    return "invalid";
}
