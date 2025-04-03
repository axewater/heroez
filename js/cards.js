export const cardLibrary = [
    // Common Creatures
    { id: "c1", name: "Eager Recruit", cost: 1, attack: 2, health: 1, type: "Creature", mechanics: [] },
    { id: "c2", name: "Forest Guardian", cost: 2, attack: 1, health: 3, type: "Creature", mechanics: ["Taunt"] },
    { id: "c3", name: "Flame Imp", cost: 1, attack: 3, health: 2, type: "Creature", mechanics: ["Deploy"], deployActionId: 'dealDamageToSelf', deployParams: { amount: 1 }, effectText: "Deploy: Deal 1 damage to yourself." },
    { id: "c4", name: "Nimble Scout", cost: 2, attack: 2, health: 2, type: "Creature", mechanics: ["Swift"] },
    { id: "c5", name: "Stone Defender", cost: 3, attack: 2, health: 4, type: "Creature", mechanics: [] },
    { id: "c6", name: "Healing Acolyte", cost: 2, attack: 1, health: 2, type: "Creature", mechanics: ["Deploy"], deployActionId: 'restoreHealthToSelf', deployParams: { amount: 2 }, effectText: "Deploy: Restore 2 health to your hero." },
    { id: "c7", name: "Raging Berserker", cost: 3, attack: 3, health: 3, type: "Creature", mechanics: ["Frenzy"], effectText: "Frenzy: Gains +2 Atk when damaged." }, // Frenzy not implemented
    { id: "c8", name: "Shadow Stalker", cost: 4, attack: 3, health: 3, type: "Creature", mechanics: ["Stealth"], effectText: "Stealth (1 turn)" }, // Stealth not implemented

    // Rare Creatures
    { id: "r1", name: "Arcane Scholar", cost: 4, attack: 2, health: 4, type: "Creature", mechanics: ["Spell Power +1"], effectText: "Spell Power +1" }, // Spell Power not implemented
    { id: "r2", name: "War Golem", cost: 6, attack: 6, health: 6, type: "Creature", mechanics: [] },
    { id: "r3", name: "Battlefield Commander", cost: 5, attack: 4, health: 4, type: "Creature", mechanics: ["Aura"], effectText: "Aura: Your other creatures have +1 Attack." }, // Aura not implemented
    { id: "r4", name: "Venomous Spider", cost: 3, attack: 2, health: 3, type: "Creature", mechanics: ["Poison"], effectText: "Poison: Damages creature at end of turn." }, // Poison not implemented

    // Spells
    { id: "s1", name: "Fireball", cost: 3, type: "Spell", target: "any", mechanics: [], actionId: 'dealDamage', actionParams: { amount: 4 }, effectText: "Deal 4 damage." },
    { id: "s2", name: "Healing Touch", cost: 2, type: "Spell", target: "any", mechanics: [], actionId: 'restoreHealth', actionParams: { amount: 4 }, effectText: "Restore 4 health." },
    { id: "s3", name: "Battle Rage", cost: 1, type: "Spell", target: "creature", mechanics: [], actionId: 'temporaryBuff', actionParams: { attack: 2, health: 0 }, effectText: "Give a creature +2 Attack until end of turn." }, // Temp buff not fully implemented (lasts forever currently)
    { id: "s4", name: "Frost Nova", cost: 4, type: "Spell", target: "opponent-board", mechanics: [], actionId: 'freezeBoard', actionParams: {}, effectText: "Freeze all enemy creatures." }, // Freeze not implemented
    { id: "s5", name: "Arcane Intellect", cost: 3, type: "Spell", target: "self", mechanics: [], actionId: 'drawCards', actionParams: { amount: 2 }, effectText: "Draw 2 cards." },
    { id: "s6", name: "Shield Wall", cost: 2, type: "Spell", target: "creature", mechanics: [], actionId: 'permanentBuff', actionParams: { attack: 0, health: 3 }, effectText: "Give a creature +0/+3." },
    { id: "s7", name: "Lightning Bolt", cost: 2, type: "Spell", target: "creature", mechanics: [], actionId: 'dealDamage', actionParams: { amount: 3 }, effectText: "Deal 3 damage to a creature." },

    // Legendary Card
    { id: "l1", name: "Dragon Lord", cost: 8, attack: 7, health: 7, type: "Creature", mechanics: ["Deploy"], deployActionId: 'summonCreature', deployParams: { cardId: "whelp", count: 1 }, effectText: "Deploy: Summon a 3/3 Dragon Whelp." }, // Whelp summon needs definition
    // Definition for the summoned creature (could be in a separate list or marked as uncollectible)
    { id: "whelp", name: "Dragon Whelp", cost: 0, attack: 3, health: 3, type: "Creature", mechanics: [], collectible: false },
];
