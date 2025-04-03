import { getDOMElement } from './dom.js';
import { STARTING_HEALTH } from './constants.js';
import { logMessage } from './messaging.js';

// --- AI Targeting Helpers ---

export function findBestSpellTarget(aiPlayer, humanPlayer, spellCard) {
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
        if ((targetType === 'any' || targetType === 'hero') && humanPlayer.heroHealth <= damageAmount && humanPlayer.heroElement) {
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
        if ((targetType === 'any' || targetType === 'hero') && humanPlayer.heroHealth > damageAmount && humanPlayer.heroElement) {
             potentialTargets.push({ element: humanPlayer.heroElement, score: 10 });
        }
    }
    // Healing Spells (e.g., Healing Touch)
    else if (spellCard.actionId === 'restoreHealth') {
         // Priority: Heal own hero if damaged > Heal high-value damaged creature
         const healAmount = spellCard.actionParams.amount;
         // Heal own hero
         if ((targetType === 'any' || targetType === 'hero') && aiPlayer.heroHealth < STARTING_HEALTH && aiPlayer.heroElement) {
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


export function findBestAttackTarget(attacker, humanPlayer) {
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
        if (humanPlayer.heroHealth <= attacker.currentAttack && humanPlayer.heroElement) {
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
         if (humanPlayer.heroHealth > attacker.currentAttack && humanPlayer.heroElement) {
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
