import { getState, getPlayer, getOpponentId, getSelectedAttacker, setSelectedAttacker, setTargetingMode, getTargetingMode, isGameOver } from './state.js';
import { renderGame, updatePlayableCards, createCardElement } from './render.js';
import { deselectAttacker } from './uiState.js';
import { setMessage, logMessage } from './messaging.js';
import { checkWinCondition } from './gameLogic.js';
import { getTargetFromElement } from './actionUtils.js';
import { dealDamage, triggerCardEffect } from './cardEffects.js';
import { animateCardMovement } from './animations.js';
import { getDOMElement } from './dom.js';

export async function creatureAttack(attackerCard, targetElement) {
    console.log(`[Execute Attack] ${attackerCard.name} (${attackerCard.instanceId}) attacking. Status: canAttack=${attackerCard.canAttack}, hasAttacked=${attackerCard.hasAttacked}, isFrozen=${attackerCard.isFrozen}, justPlayed=${attackerCard.justPlayed}, currentAttack=${attackerCard.currentAttack}`);
    const attackerPlayer = getPlayer(attackerCard.owner);
    const opponentPlayer = getPlayer(getOpponentId(attackerPlayer.id)); // Assumes attacker is current player

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

    const tauntMinions = opponentPlayer.board.filter(c => c.isTaunt && !c.isStealthed); // Stealthed minions cannot Taunt
    if (tauntMinions.length > 0 && (!targetCardInstance || !targetCardInstance.isTaunt)) {
        logMessage("Must attack a Taunt creature!", 'log-error');
        console.log("Attack blocked by Taunt");
        deselectAttacker();
        renderGame(); // Re-render to remove attacking state
        return;
    }

    // --- Stealth Check ---
    if (targetCardInstance && targetCardInstance.isStealthed) {
        logMessage(`Cannot attack ${targetCardInstance.name}: It is Stealthed!`, 'log-error');
        console.log("Attack blocked by Stealth");
        deselectAttacker();
        renderGame();
        return;
    }
    // --- End Stealth Check ---

    // Check if attacker can attack (redundant with UI checks but good safety)
    if (!attackerCard.canAttack || attackerCard.hasAttacked || attackerCard.isFrozen || attackerCard.currentAttack <= 0) {
        console.log(`Attacker ${attackerCard.name} cannot attack (canAttack: ${attackerCard.canAttack}, hasAttacked: ${attackerCard.hasAttacked}, isFrozen: ${attackerCard.isFrozen}, Attack: ${attackerCard.currentAttack}).`);
        setMessage(`${attackerCard.name} cannot attack.`);
        deselectAttacker();
        renderGame();
        return;
    }

    // --- Animation Setup ---
    let attackerElement = getDOMElement(`${attackerPlayer.id}BoardEl`)?.querySelector(`.card[data-instance-id="${attackerCard.instanceId}"]`);
    let startRect = attackerElement?.getBoundingClientRect();
    let endRect = targetElement?.getBoundingClientRect(); // Target element could be card or hero
    let animationPromise = Promise.resolve();

    // --- Hide original attacker during animation ---
    if (attackerElement) {
        attackerElement.style.opacity = '0'; // Hide original during animation
    }

    // --- Trigger Attack Animation ---
    if (startRect && endRect) {
        // Calculate center of target for animation endpoint
        const targetCenterX = endRect.left + endRect.width / 2;
        const targetCenterY = endRect.top + endRect.height / 2;
        // Adjust endRect to be a point at the center (or use it to calculate delta)
        const adjustedEndRect = { left: targetCenterX, top: targetCenterY, width: 0, height: 0 }; // Simplified rect for delta calculation

        animationPromise = animateCardMovement(attackerCard, startRect, adjustedEndRect, 'attack');
    }

    // --- Execute Combat ---
    const targetName = targetCardInstance ? targetCardInstance.name : (targetIsHero ? getOpponentId(attackerPlayer.id) + ' hero' : 'invalid target');
    logMessage(`${attackerCard.name} attacks ${targetName}.`);

    // --- Wait for animation to complete before dealing damage ---
    await animationPromise;

    // Attacker deals damage to target
    dealDamage(target, attackerCard.currentAttack);

    // Target deals damage back to attacker (if it's a creature with attack > 0)
    if (targetCardInstance && targetCardInstance.currentAttack > 0) {
        dealDamage(attackerCard, targetCardInstance.currentAttack); // Pass the attacker card *instance*
    }

    // Mark attacker as having attacked
    attackerCard.hasAttacked = true;
    attackerCard.canAttack = false; // Cannot attack again this turn (usually)

    // --- Break Stealth ---
    if (attackerCard.isStealthed) {
        attackerCard.isStealthed = false;
        logMessage(`${attackerCard.name} loses Stealth.`);
    }

    // --- Restore original attacker visibility ---
    if (attackerElement) {
        attackerElement.style.opacity = '1'; // Make original visible again
    }

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
