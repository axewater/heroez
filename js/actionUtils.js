import { getPlayer, getOpponentPlayer } from './state.js';
import { actionImplementations } from './cardEffects.js'; // Import the map

// --- Helper Functions ---

// Triggers the actual function associated with a card's actionId
export function triggerCardEffect(casterPlayer, sourceCard, actionId, params, target) {
    const actionFn = actionImplementations[actionId];
    if (actionFn) {
        try {
            console.log(`Triggering effect ${actionId} from ${sourceCard.name} on target:`, target);
            actionFn(target, params, casterPlayer); // Pass caster context if needed
            return true; // Indicate success
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


// Determines the actual target object (card instance or hero element) based on click event target
export function getTargetFromElement(element, targetType, caster) {
    if (!element && (targetType === 'creature' || targetType === 'any' || targetType === 'hero')) {
        console.log("Target required but none provided for type:", targetType);
        return "invalid"; // Requires a specific target but none given
    }
    if (targetType === 'self') return caster; // Target is the caster player object
    if (targetType === 'opponent-board') return getOpponentPlayer().board; // Target the array of creatures
    if (targetType === 'none') return null; // Explicitly no target needed

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

    // If no specific element target was needed (e.g., 'self', 'opponent-board', 'none'), those cases are handled above.
    // If we reach here, it means a specific target was expected but not found or invalid.
    console.log("Invalid target: Could not determine target from element:", element);
    return "invalid";
}
