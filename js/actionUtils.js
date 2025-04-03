import { getPlayer, getOpponentPlayer } from './state.js';

// --- Helper Functions ---

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
        // --- Stealth Check ---
        // Cannot target an enemy stealthed creature with single-target effects/attacks
        if (targetCard && targetCard.isStealthed && targetPlayerId !== caster.id) {
            console.log(`Invalid target: Cannot target stealthed creature ${targetCard.name}`);
            return "invalid";
        }
        // --- End Stealth Check ---
        if (targetCard && (targetType === 'any' || targetType === 'creature')) {
            return targetCard; // Return the card instance object
        } else {
             console.log(`Invalid target: Card element found (id: ${cardInstanceId}), but spell requires ${targetType} or card not found on board.`);
             return "invalid";
        }
    }

    // If no specific element target was needed (e.g., 'self', 'opponent-board', 'none'), those cases are handled above.
    // If we reach here, it means a specific target was expected but not found or invalid.
    // Also handle cases where targetType implies no element needed, like 'opponent-board' or 'self' already handled above.
    if (targetType === 'self' || targetType === 'opponent-board' || targetType === 'none') {
        // These were handled earlier or don't require an element.
        // If getTargetFromElement was called with an element for these, it's likely an error in the caller.
        // Let's assume the earlier returns handled valid cases, so reaching here means something is wrong if element exists.
        if(element) console.warn(`getTargetFromElement called with element for targetType ${targetType}`);
        // However, if no element was passed and targetType is one of these, it's valid, handled above.
        // This path might be reached if element is null AND targetType is specific like 'creature'.
        // The initial check `if (!element && ...)` should catch this.
    }


    console.log(`Invalid target: Could not determine target from element: ${element?.id || element?.tagName}, targetType: ${targetType}`);
    return "invalid";
}
