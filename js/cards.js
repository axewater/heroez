export const cardLibrary = [
    // --- Movie Classics - Common Creatures ---
    { id: "mc_c1", name: "Security Guard", cost: 1, attack: 2, health: 1, type: "Creature", rarity: "common", mechanics: [] },
    { id: "mc_c2", name: "Barricade", cost: 2, attack: 1, health: 3, type: "Creature", rarity: "common", mechanics: ["Taunt"] },
    { id: "mc_c3", name: "Lab Experiment", cost: 1, attack: 3, health: 2, type: "Creature", rarity: "common", mechanics: ["Deploy"], deployActionId: 'dealDamageToSelf', deployParams: { amount: 1 }, effectText: "Deploy: Deal 1 damage to yourself." },
    { id: "mc_c4", name: "Motorcycle Courier", cost: 2, attack: 2, health: 2, type: "Creature", rarity: "common", mechanics: ["Swift"] },
    { id: "mc_c5", name: "Armored Truck", cost: 3, attack: 2, health: 4, type: "Creature", rarity: "common", mechanics: [] },
    { id: "mc_c6", name: "Field Medic", cost: 2, attack: 1, health: 2, type: "Creature", rarity: "common", mechanics: ["Deploy"], deployActionId: 'restoreHealthToSelf', deployParams: { amount: 2 }, effectText: "Deploy: Restore 2 health to your hero." },
    { id: "mc_c7", name: "Enraged Test Subject", cost: 3, attack: 3, health: 3, type: "Creature", rarity: "common", mechanics: ["Frenzy"], frenzyActionId: 'gainAttack', frenzyActionParams: { amount: 2 }, effectText: "Frenzy: Gains +2 Attack." },
    { id: "mc_c8", name: "Hidden Operative", cost: 3, attack: 4, health: 2, type: "Creature", rarity: "common", mechanics: ["Stealth"], effectText: "Stealth" },
    { id: "mc_c9", name: "Riot Police", cost: 1, attack: 0, health: 2, type: "Creature", rarity: "common", mechanics: ["Taunt"] },
    { id: "mc_c10", name: "Giant Spider", cost: 2, attack: 2, health: 3, type: "Creature", rarity: "common", mechanics: [] },
    { id: "mc_c11", name: "Hunter Drone", cost: 3, attack: 3, health: 4, type: "Creature", rarity: "common", mechanics: [] },
    { id: "mc_c12", name: "Escape Vehicle", cost: 4, attack: 2, health: 5, type: "Creature", rarity: "common", mechanics: ["Swift"] },
    { id: "mc_c13", name: "Zombie", cost: 1, attack: 2, health: 1, type: "Creature", rarity: "common", mechanics: [] },
    { id: "mc_c14", name: "Damaged Cyborg", cost: 4, attack: 3, health: 4, type: "Creature", rarity: "common", mechanics: ["Frenzy"], frenzyActionId: 'gainAttack', frenzyActionParams: { amount: 3 }, effectText: "Frenzy: Gains +3 Attack." },

    // --- Movie Classics - Rare Creatures ---
    { id: "mc_r1", name: "Xenomorph Drone", cost: 6, attack: 6, health: 6, type: "Creature", rarity: "rare", mechanics: [] },
    { id: "mc_r2", name: "SWAT Captain", cost: 5, attack: 4, health: 4, type: "Creature", rarity: "rare", mechanics: ["Aura"], effectText: "Aura: Your other creatures have +1 Attack." },
    { id: "mc_r3", name: "Temple Guard", cost: 3, attack: 3, health: 3, type: "Creature", rarity: "rare", mechanics: ["Taunt"] },
    { id: "mc_r4", name: "Mad Scientist", cost: 4, attack: 3, health: 2, type: "Creature", rarity: "rare", mechanics: ["Deploy"], deployActionId: 'drawCards', deployParams: { amount: 1 }, effectText: "Deploy: Draw a card." },
    { id: "mc_r5", name: "Hired Muscle", cost: 5, attack: 5, health: 4, type: "Creature", rarity: "rare", mechanics: ["Taunt"] },
    { id: "mc_r6", name: "Renfield", cost: 5, attack: 4, health: 4, type: "Creature", rarity: "rare", mechanics: ["Deploy"], deployActionId: 'restoreHealthToSelf', deployParams: { amount: 4 }, effectText: "Deploy: Restore 4 health to your hero." },
    { id: "mc_r7", name: "Jungle Predator", cost: 5, attack: 4, health: 4, type: "Creature", rarity: "rare", mechanics: ["Stealth"], effectText: "Stealth" },

    // --- Movie Classics - Epic Creatures ---
    { id: "mc_e1", name: "Heavy Mech Suit", cost: 6, attack: 6, health: 5, type: "Creature", rarity: "epic", mechanics: ["Taunt"] },
    { id: "mc_e2", name: "T-800 Endoskeleton", cost: 7, attack: 7, health: 7, type: "Creature", rarity: "epic", mechanics: [] },
    { id: "mc_e3", name: "Ancient Mummy", cost: 8, attack: 8, health: 8, type: "Creature", rarity: "epic", mechanics: ["Taunt"] },

    // --- Movie Classics - Common Spells ---
    { id: "mc_s1", name: "Explosion", cost: 3, type: "Spell", rarity: "common", target: "any", mechanics: [], actionId: 'dealDamage', actionParams: { amount: 4 }, effectText: "Deal 4 damage.", visualEffectType: 'fire' },
    { id: "mc_s2", name: "First Aid", cost: 2, type: "Spell", rarity: "common", target: "any", mechanics: [], actionId: 'restoreHealth', actionParams: { amount: 4 }, effectText: "Restore 4 health.", visualEffectType: 'holy' },
    { id: "mc_s3", name: "Adrenaline Rush", cost: 2, type: "Spell", rarity: "common", target: "creature", mechanics: [], actionId: 'permanentBuff', actionParams: { attack: 0, health: 3 }, effectText: "Give a creature +0/+3.", visualEffectType: 'physical' },
    { id: "mc_s4", name: "Research Notes", cost: 3, type: "Spell", rarity: "common", target: "self", mechanics: [], actionId: 'drawCards', actionParams: { amount: 2 }, effectText: "Draw 2 cards.", visualEffectType: 'arcane' },
    { id: "mc_s5", name: "Short Circuit", cost: 1, type: "Spell", rarity: "common", target: "any", mechanics: [], actionId: 'dealDamage', actionParams: { amount: 2 }, effectText: "Deal 2 damage.", visualEffectType: 'lightning' },
    { id: "mc_s6", name: "Reinforcements", cost: 2, type: "Spell", rarity: "common", target: "creature", mechanics: [], actionId: 'permanentBuff', actionParams: { attack: 2, health: 2 }, effectText: "Give a creature +2/+2.", visualEffectType: 'physical' },
    { id: "mc_s7", name: "Cryo Grenade", cost: 1, type: "Spell", rarity: "common", target: "creature", mechanics: [], actionId: 'freezeCreature', actionParams: {}, effectText: "Freeze a creature.", visualEffectType: 'frost' },

    // --- Movie Classics - Rare Spells ---
    { id: "mc_s8", name: "Flash Freeze", cost: 4, type: "Spell", rarity: "rare", target: "opponent-board", mechanics: [], actionId: 'freezeBoard', actionParams: {}, effectText: "Freeze all enemy creatures.", visualEffectType: 'frost' },
    { id: "mc_s9", name: "Laser Blast", cost: 2, type: "Spell", rarity: "rare", target: "creature", mechanics: [], actionId: 'dealDamage', actionParams: { amount: 3 }, effectText: "Deal 3 damage to a creature.", visualEffectType: 'lightning' },
    { id: "mc_s10", name: "Top Secret Files", cost: 5, type: "Spell", rarity: "rare", target: "self", mechanics: [], actionId: 'drawCards', actionParams: { amount: 4 }, effectText: "Draw 4 cards.", visualEffectType: 'shadow' },
    { id: "mc_s11", name: "Plasma Rifle", cost: 6, type: "Spell", rarity: "rare", target: "any", mechanics: [], actionId: 'dealDamage', actionParams: { amount: 5 }, effectText: "Deal 5 damage.", visualEffectType: 'lightning' },
    { id: "mc_s12", name: "Ancient Curse", cost: 4, type: "Spell", rarity: "rare", target: "creature", mechanics: [], actionId: 'permanentBuff', actionParams: { attack: 4, health: 4 }, effectText: "Give a creature +4/+4.", visualEffectType: 'holy' },

    // --- Movie Classics - Epic Spells ---
    { id: "mc_s13", name: "Orbital Strike", cost: 10, type: "Spell", rarity: "epic", target: "any", mechanics: [], actionId: 'dealDamage', actionParams: { amount: 10 }, effectText: "Deal 10 damage.", visualEffectType: 'fire' },

    // --- Movie Classics - Legendary Creatures ---
    { id: "mc_l1", name: "Alien Queen", cost: 8, attack: 7, health: 7, type: "Creature", rarity: "legendary", mechanics: ["Deploy"], deployActionId: 'summonCreature', deployParams: { cardId: "mc_facehugger", count: 1 }, effectText: "Deploy: Summon a 3/3 Facehugger." },
    { id: "mc_facehugger", name: "Facehugger", cost: 0, attack: 3, health: 3, type: "Creature", rarity: "token", mechanics: [], collectible: false },

    { id: "mc_l2", name: "Rolling Boulder", cost: 9, attack: 7, health: 7, type: "Creature", rarity: "legendary", mechanics: ["Taunt", "Deploy"], deployActionId: 'summonCreature', deployParams: { cardId: "mc_rockman", count: 1 }, effectText: "Taunt. Deploy: Summon a 1/1 Tiny Rockman with Taunt." },
    { id: "mc_rockman", name: "Tiny Rockman", cost: 0, attack: 1, health: 1, type: "Creature", rarity: "token", mechanics: ["Taunt"], collectible: false },

    // --- Special Cards ---
    { id: "coin", name: "Energy Disc", cost: 0, type: "Spell", rarity: "token", target: "self", mechanics: [], actionId: 'gainTemporaryMana', actionParams: { amount: 1 }, effectText: "Gain 1 Energy this turn only.", collectible: false, visualEffectType: 'physical' },

    // --- Hero Specific Cards (Not collectible in general pool) ---
    // T-1000
    { id: "h_t1", name: "Liquid Metal Form", cost: 1, type: "Spell", rarity: "basic", target: "creature", mechanics: [], actionId: 'temporaryBuff', actionParams: { attack: 2, health: 0 }, effectText: "Give a friendly creature +2 Attack this turn.", collectible: false, heroSpecific: true, visualEffectType: 'physical' },
    { id: "h_t2", name: "Police Disguise", cost: 3, attack: 3, health: 3, type: "Creature", rarity: "basic", mechanics: ["Stealth"], collectible: false, heroSpecific: true, effectText: "Stealth" },
    // Indiana Jones
    { id: "h_i1", name: "Whip Crack", cost: 2, type: "Spell", rarity: "basic", target: "any", mechanics: [], actionId: 'dealDamage', actionParams: { amount: 3 }, effectText: "Deal 3 damage.", collectible: false, heroSpecific: true, visualEffectType: 'physical' },
    { id: "h_i2", name: "Adventurous Assistant", cost: 1, attack: 1, health: 2, type: "Creature", rarity: "basic", mechanics: [], effectText: "Gains +1 Attack when you play a Spell.", collectible: false, heroSpecific: true },
    // Dracula
    { id: "h_d1", name: "Blood Drain", cost: 0, type: "Spell", rarity: "basic", target: "creature", mechanics: [], actionId: 'dealDamage', actionParams: { amount: 2 }, effectText: "Deal 2 damage to an undamaged creature.", collectible: false, heroSpecific: true, visualEffectType: 'shadow' },
    { id: "h_d2", name: "Vampire Bat", cost: 2, attack: 2, health: 1, type: "Creature", rarity: "basic", mechanics: ["Swift"], collectible: false, heroSpecific: true },
    // Dr. Emmett Brown
    { id: "h_db1", name: "Flux Capacitor Charge", cost: 1, type: "Spell", rarity: "basic", target: "creature", mechanics: [], actionId: 'permanentBuff', actionParams: { attack: 0, health: 2 }, effectText: "Give a creature +2 Health.", collectible: false, heroSpecific: true, visualEffectType: 'lightning' },
    { id: "h_db2", name: "Lab Assistant", cost: 1, attack: 1, health: 3, type: "Creature", rarity: "basic", mechanics: [], effectText: "Whenever a creature is healed, draw a card.", collectible: false, heroSpecific: true },
];
