export const cardLibrary = [
    // --- Existing Common Creatures ---
    { id: "c1", name: "Eager Recruit", cost: 1, attack: 2, health: 1, type: "Creature", mechanics: [] },
    { id: "c2", name: "Forest Guardian", cost: 2, attack: 1, health: 3, type: "Creature", mechanics: ["Taunt"] },
    { id: "c3", name: "Flame Imp", cost: 1, attack: 3, health: 2, type: "Creature", mechanics: ["Deploy"], deployActionId: 'dealDamageToSelf', deployParams: { amount: 1 }, effectText: "Deploy: Deal 1 damage to yourself." },
    { id: "c4", name: "Nimble Scout", cost: 2, attack: 2, health: 2, type: "Creature", mechanics: ["Swift"] },
    { id: "c5", name: "Stone Defender", cost: 3, attack: 2, health: 4, type: "Creature", mechanics: [] },
    { id: "c6", name: "Healing Acolyte", cost: 2, attack: 1, health: 2, type: "Creature", mechanics: ["Deploy"], deployActionId: 'restoreHealthToSelf', deployParams: { amount: 2 }, effectText: "Deploy: Restore 2 health to your hero." },
    { id: "c7", name: "Raging Berserker", cost: 3, attack: 3, health: 3, type: "Creature", mechanics: ["Frenzy"], frenzyActionId: 'gainAttack', frenzyActionParams: { amount: 2 }, effectText: "Frenzy: Gains +2 Attack the first time it survives damage." },
    { id: "c15", name: "Shadow Panther", cost: 3, attack: 4, health: 2, type: "Creature", mechanics: ["Stealth"], effectText: "Stealth" },

    // --- New Common Creatures ---
    { id: "c9", name: "Shield Bearer", cost: 1, attack: 0, health: 2, type: "Creature", mechanics: ["Taunt"] },
    { id: "c10", name: "River Crocolisk", cost: 2, attack: 2, health: 3, type: "Creature", mechanics: [] },
    { id: "c11", name: "Spider Tank", cost: 3, attack: 3, health: 4, type: "Creature", mechanics: [] },
    { id: "c12", name: "Stormwind Knight", cost: 4, attack: 2, health: 5, type: "Creature", mechanics: ["Swift"] },
    { id: "c13", name: "Murloc Raider", cost: 1, attack: 2, health: 1, type: "Creature", mechanics: [] },
    { id: "c14", name: "Enraged Gryphon", cost: 4, attack: 3, health: 4, type: "Creature", mechanics: ["Frenzy"], frenzyActionId: 'gainAttack', frenzyActionParams: { amount: 3 }, effectText: "Frenzy: Gains +3 Attack the first time it survives damage." },

    // --- Existing Rare Creatures ---
    // { id: "r1", name: "Arcane Scholar", cost: 4, attack: 2, health: 4, type: "Creature", mechanics: ["Spell Power +1"], effectText: "Spell Power +1" }, // Spell Power not implemented
    { id: "r2", name: "War Golem", cost: 6, attack: 6, health: 6, type: "Creature", mechanics: [] },
    { id: "r3", name: "BF Commander", cost: 5, attack: 4, health: 4, type: "Creature", mechanics: ["Aura"], effectText: "Aura: Your other creatures have +1 Attack." },
    // { id: "r4", name: "Venomous Spider", cost: 3, attack: 2, health: 3, type: "Creature", mechanics: ["Poison"], effectText: "Poison: Damages creature at end of turn." }, // Poison not implemented

    // --- New Rare Creatures ---
    { id: "r5", name: "Knight Protector", cost: 3, attack: 3, health: 3, type: "Creature", mechanics: ["Taunt"] },
    { id: "r6", name: "Cult Adept", cost: 4, attack: 3, health: 2, type: "Creature", mechanics: ["Deploy"], deployActionId: 'drawCards', deployParams: { amount: 1 }, effectText: "Deploy: Draw a card." },
    { id: "r7", name: "Booty Bay Bodyguard", cost: 5, attack: 5, health: 4, type: "Creature", mechanics: ["Taunt"] },
    { id: "r8", name: "Priestess of Elune", cost: 5, attack: 4, health: 4, type: "Creature", mechanics: ["Deploy"], deployActionId: 'restoreHealthToSelf', deployParams: { amount: 4 }, effectText: "Deploy: Restore 4 health to your hero." },
    { id: "r9", name: "Jungle Stalker", cost: 5, attack: 4, health: 4, type: "Creature", mechanics: ["Stealth"], effectText: "Stealth" },

    // --- New Epic Creatures ---
    { id: "e1", name: "Lord of the Arena", cost: 6, attack: 6, health: 5, type: "Creature", mechanics: ["Taunt"] },
    { id: "e2", name: "War Golem Veteran", cost: 7, attack: 7, health: 7, type: "Creature", mechanics: [] },
    { id: "e3", name: "Ironbark Protector", cost: 8, attack: 8, health: 8, type: "Creature", mechanics: ["Taunt"] },

    // --- Existing Spells ---
    { id: "s1", name: "Fireball", cost: 3, type: "Spell", target: "any", mechanics: [], actionId: 'dealDamage', actionParams: { amount: 4 }, effectText: "Deal 4 damage." },
    { id: "s2", name: "Healing Touch", cost: 2, type: "Spell", target: "any", mechanics: [], actionId: 'restoreHealth', actionParams: { amount: 4 }, effectText: "Restore 4 health." },
    // { id: "s3", name: "Battle Rage", cost: 1, type: "Spell", target: "creature", mechanics: [], actionId: 'temporaryBuff', actionParams: { attack: 2, health: 0 }, effectText: "Give a creature +2 Attack until end of turn." }, // Temp buff not fully implemented
    { id: "s4", name: "Frost Nova", cost: 4, type: "Spell", target: "opponent-board", mechanics: [], actionId: 'freezeBoard', actionParams: {}, effectText: "Freeze all enemy creatures." },
    { id: "s5", name: "Arcane Intellect", cost: 3, type: "Spell", target: "self", mechanics: [], actionId: 'drawCards', actionParams: { amount: 2 }, effectText: "Draw 2 cards." },
    { id: "s6", name: "Shield Wall", cost: 2, type: "Spell", target: "creature", mechanics: [], actionId: 'permanentBuff', actionParams: { attack: 0, health: 3 }, effectText: "Give a creature +0/+3." },
    { id: "s7", name: "Lightning Bolt", cost: 2, type: "Spell", target: "creature", mechanics: [], actionId: 'dealDamage', actionParams: { amount: 3 }, effectText: "Deal 3 damage to a creature." },

    // --- New Spells ---
    { id: "s8", name: "Holy Smite", cost: 1, type: "Spell", target: "any", mechanics: [], actionId: 'dealDamage', actionParams: { amount: 2 }, effectText: "Deal 2 damage." },
    { id: "s9", name: "Reinforce", cost: 2, type: "Spell", target: "creature", mechanics: [], actionId: 'permanentBuff', actionParams: { attack: 2, health: 2 }, effectText: "Give a creature +2/+2." },
    { id: "s10", name: "Sprint", cost: 5, type: "Spell", target: "self", mechanics: [], actionId: 'drawCards', actionParams: { amount: 4 }, effectText: "Draw 4 cards." },
    { id: "s11", name: "Starfire", cost: 6, type: "Spell", target: "any", mechanics: [], actionId: 'dealDamage', actionParams: { amount: 5 }, effectText: "Deal 5 damage." },
    { id: "s12", name: "Pyroblast", cost: 10, type: "Spell", target: "any", mechanics: [], actionId: 'dealDamage', actionParams: { amount: 10 }, effectText: "Deal 10 damage." },
    { id: "s13", name: "Frost Shock", cost: 1, type: "Spell", target: "creature", mechanics: [], actionId: 'freezeCreature', actionParams: {}, effectText: "Freeze a creature." },
    { id: "s14", name: "Blessing of Kings", cost: 4, type: "Spell", target: "creature", mechanics: [], actionId: 'permanentBuff', actionParams: { attack: 4, health: 4 }, effectText: "Give a creature +4/+4." },

    // --- Existing Legendary Card ---
    { id: "l1", name: "Dragon Lord", cost: 8, attack: 7, health: 7, type: "Creature", mechanics: ["Deploy"], deployActionId: 'summonCreature', deployParams: { cardId: "whelp", count: 1 }, effectText: "Deploy: Summon a 3/3 Dragon Whelp." },
    // Definition for the summoned creature
    { id: "whelp", name: "Dragon Whelp", cost: 0, attack: 3, health: 3, type: "Creature", mechanics: [], collectible: false },

    // --- New Legendary Card ---
    { id: "l2", name: "Obsidian Destroyer", cost: 9, attack: 7, health: 7, type: "Creature", mechanics: ["Taunt", "Deploy"], deployActionId: 'summonCreature', deployParams: { cardId: "scarab", count: 1 }, effectText: "Taunt. Deploy: Summon a 1/1 Scarab with Taunt." },
    // Definition for the summoned Scarab
    { id: "scarab", name: "Scarab", cost: 0, attack: 1, health: 1, type: "Creature", mechanics: ["Taunt"], collectible: false },

    // --- Hero Specific Cards (Not collectible in general pool) ---
    // Warrior
    { id: "h_w1", name: "Charge!", cost: 1, type: "Spell", target: "creature", mechanics: [], actionId: 'temporaryBuff', actionParams: { attack: 2, health: 0 }, effectText: "Give a friendly creature +2 Attack this turn.", collectible: false, heroSpecific: true },
    { id: "h_w2", name: "Armored Raider", cost: 3, attack: 3, health: 3, type: "Creature", mechanics: ["Swift"], collectible: false, heroSpecific: true },
    // Mage
    { id: "h_m1", name: "Arcane Blast", cost: 2, type: "Spell", target: "any", mechanics: [], actionId: 'dealDamage', actionParams: { amount: 3 }, effectText: "Deal 3 damage.", collectible: false, heroSpecific: true },
    { id: "h_m2", name: "Mana Wyrm", cost: 1, attack: 1, health: 2, type: "Creature", mechanics: [], effectText: "Gains +1 Attack whenever you cast a spell.", collectible: false, heroSpecific: true }, // Effect not implemented yet
    // Rogue
    { id: "h_r1", name: "Backstab", cost: 0, type: "Spell", target: "creature", mechanics: [], actionId: 'dealDamage', actionParams: { amount: 2 }, effectText: "Deal 2 damage to an undamaged creature.", collectible: false, heroSpecific: true }, // Condition not implemented yet
    { id: "h_r2", name: "Silent Assassin", cost: 2, attack: 2, health: 1, type: "Creature", mechanics: ["Stealth"], collectible: false, heroSpecific: true },
    // Priest
    { id: "h_p1", name: "Power Word: Shield", cost: 1, type: "Spell", target: "creature", mechanics: [], actionId: 'permanentBuff', actionParams: { attack: 0, health: 2 }, effectText: "Give a creature +2 Health.", collectible: false, heroSpecific: true }, // Should also draw a card ideally
    { id: "h_p2", name: "Northshire Cleric", cost: 1, attack: 1, health: 3, type: "Creature", mechanics: [], effectText: "Whenever a creature is healed, draw a card.", collectible: false, heroSpecific: true }, // Effect not implemented yet
];
