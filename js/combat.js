import { getState, getPlayer, getOpponentId, getSelectedAttacker, setSelectedAttacker, setTargetingMode, getTargetingMode, isGameOver } from './state.js'; // Added getOpponentId and isGameOver
import { renderGame, updatePlayableCards } from './render.js'; // Corrected import path for render functions
import { deselectAttacker } from './uiState.js';
import { setMessage, logMessage } from './messaging.js';
import { checkWinCondition } from './gameLogic.js';
import { getTargetFromElement } from './actionUtils.js';
import { dealDamage } from './cardEffects.js';

export function creatureAttack(attackerCard, targetElement) {
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
         console.log(`Attacker ${attackerCard.name} cannot attack (canAttack: ${attackerCard.canAttack}, hasAttacked: ${attackerCard.hasAttacked}, isFrozen: ${attackerCard.isFrozen}, Attack: ${attackerCard.currentAttack}).`);
         setMessage(`${attackerCard.name} cannot attack.`);
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
