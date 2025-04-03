import { getPlayer } from './state.js';
import { cardLibrary } from './cards.js';

/**
 * Recalculates and updates the current stats of all creatures on a player's board,
 * considering active Auras.
 * @param {string} playerId - The ID ('player' or 'opponent') of the player whose board needs updating.
 */
export function updateBoardStats(playerId) {
    const player = getPlayer(playerId);
    if (!player) return;

    console.log(`Updating board stats for ${playerId}`);

    // 1. Identify Auras and calculate total buffs
    let totalAttackBonus = 0;
    const auraSources = []; // Keep track of which cards provide auras

    player.board.forEach(card => {
        if (card.mechanics?.includes("Aura")) {
            // Example: Battlefield Commander provides +1 Attack
            if (card.id === "r3") { // Battlefield Commander
                totalAttackBonus += 1;
                auraSources.push(card.instanceId);
                console.log(`Found Aura source: ${card.name} (${card.instanceId}), adding +1 attack bonus.`);
            }
            // Add checks for other Aura cards here if needed
        }
    });

    // 2. Apply buffs to creatures
    player.board.forEach(card => {
        // Reset current attack to base attack first
        const libraryCard = cardLibrary.find(c => c.id === card.id);
        if (!libraryCard) {
            console.error(`Cannot find library card for ${card.name} (ID: ${card.id}) during stat update.`);
            return; // Skip if base card data is missing
        }
        // Ensure base attack is defined before resetting
        card.currentAttack = libraryCard.attack !== undefined ? libraryCard.attack : 0;

        // Apply Aura buffs if the card is not the source of the aura itself
        if (!auraSources.includes(card.instanceId) && totalAttackBonus > 0) {
            card.currentAttack += totalAttackBonus;
            console.log(`Applying +${totalAttackBonus} attack to ${card.name} (${card.instanceId}). New Attack: ${card.currentAttack}`);
        }

        // TODO: Apply other static effects or recalculate health if needed in the future
    });

    // Note: Rendering is handled separately after the state update.
}
