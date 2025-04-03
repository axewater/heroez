import { getPlayer } from './state.js';

/**
 * Recalculates and updates the current stats of all creatures on a player's board,
 * considering active Auras.
 * @param {string} playerId - The ID ('player' or 'opponent') of the player whose board needs updating.
 */
export function updateBoardStats(playerId) {
    const player = getPlayer(playerId);
    if (!player) return;

    console.log(`Updating board stats for ${playerId}`);

    // 1. Identify Auras and calculate total current Aura bonus
    let currentAuraAttackBonus = 0;
    const auraSources = []; // Keep track of which cards provide auras

    player.board.forEach(card => {
        if (card.mechanics?.includes("Aura")) {
            // Example: Battlefield Commander provides +1 Attack
            if (card.id === "r3") { // Battlefield Commander
                currentAuraAttackBonus += 1;
                auraSources.push(card.instanceId);
                console.log(`Aura source: ${card.name} (${card.instanceId}), contributes +1 attack.`);
            }
            // Add checks for other Aura cards here if needed
        }
    });

    // 2. Apply Aura buff changes to creatures
    player.board.forEach(card => {
        // Only apply Auras to non-source creatures
        if (!auraSources.includes(card.instanceId)) {
            const previousAuraBonus = card.appliedAuraAttackBonus || 0; // Get previously applied bonus
            const delta = currentAuraAttackBonus - previousAuraBonus; // Calculate the change

            if (delta !== 0) {
                card.currentAttack = Math.max(0, card.currentAttack + delta); // Apply the change, ensuring attack >= 0
                console.log(`Applying Aura delta of ${delta} to ${card.name} (${card.instanceId}). Previous Aura: ${previousAuraBonus}, Current Aura: ${currentAuraAttackBonus}. New Attack: ${card.currentAttack}`);
            }
            // Store the new total aura bonus applied to this creature
            card.appliedAuraAttackBonus = currentAuraAttackBonus;
        }
    });

    // Note: Rendering is handled separately after the state update.
}
