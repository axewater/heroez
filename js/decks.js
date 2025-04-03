// /js/decks.js

// Default 30-card decks for each hero class
// Using card IDs from cardLibrary in cards.js

export const defaultDecks = {
    warrior: [
        // Creatures (Focus on Taunt, Swift, some direct damage)
        "c1", // Eager Recruit
        "c2", "c2", // Forest Guardian (Taunt)
        "c4", "c4", // Nimble Scout (Swift)
        "c5", "c5", // Stone Defender
        "c9", "c9", // Shield Bearer (Taunt)
        "c10", "c10", // River Crocolisk
        "c11", "c11", // Spider Tank
        "c12", "c12", // Stormwind Knight (Swift)
        "r5", "r5", // Knight Protector (Taunt)
        "r7", // Booty Bay Bodyguard (Taunt)
        "e1", // Lord of the Arena (Taunt)
        // Spells (Focus on buffs, removal)
        "s6", "s6", // Shield Wall (+Health)
        "s7", "s7", // Lightning Bolt (Creature Damage)
        "s9", "s9", // Reinforce (+Atk/+Health)
        "s14", // Blessing of Kings (+Atk/+Health)
        // Hero Specific
        "h_w1", "h_w1", // Charge! (Temp Attack)
        "h_w2", "h_w2", // Armored Raider (Swift)
    ],
    mage: [
        // Creatures (Focus on value, some spell synergy placeholders)
        "c1", "c1", // Eager Recruit
        "c10", // River Crocolisk
        "c6", "c6", // Healing Acolyte (Deploy Heal)
        "c10", "c10", // River Crocolisk
        "c11", "c11", // Spider Tank
        "r6", "r6", // Cult Adept (Deploy Draw)
        "r8", // Priestess of Elune (Deploy Heal)
        "e2", // War Golem Veteran
        // Spells (Focus on damage, draw, control)
        "s1", "s1", // Fireball (Damage)
        "s4", "s4", // Frost Nova (Freeze Board)
        "s5", "s5", // Arcane Intellect (Draw)
        "s8", "s8", // Holy Smite (Damage)
        "s11", "s11", // Starfire (Damage)
        "s12", // Pyroblast (Damage)
        "s13", "s13", // Frost Shock (Freeze Creature)
        // Hero Specific
        "h_m1", "h_m1", // Arcane Blast (Damage)
        "h_m2", "h_m2", // Mana Wyrm (Placeholder effect)
    ],
    rogue: [
        // Creatures (Focus on Swift, Stealth, Deploy effects)
        "c1", "c1", // Eager Recruit
        "c3", "c3", // Flame Imp (Deploy Damage Self)
        "c10", // River Crocolisk
        "c4", "c4", // Nimble Scout (Swift)
        "c10", "c10", // River Crocolisk
        "c11", "c11", // Spider Tank
        "c15", "c15", // Shadow Panther (Stealth)
        "r6", "r6", // Cult Adept (Deploy Draw)
        "r9", "r9", // Jungle Stalker (Stealth)
        "e2", // War Golem Veteran
        // Spells (Focus on cheap removal, draw, buffs)
        "s1", "s1", // Fireball (Damage)
        "s5", // Arcane Intellect (Draw)
        "s7", "s7", // Lightning Bolt (Creature Damage)
        "s8", "s8", // Holy Smite (Damage)
        "s10", // Sprint (Draw)
        // Hero Specific
        "h_r1", "h_r1", // Backstab (Conditional Damage)
        "h_r2", "h_r2", // Silent Assassin (Stealth)
    ],
    priest: [
        // Creatures (Focus on Health, Taunt, Healing synergy placeholders)
        "c2", "c2", // Forest Guardian (Taunt)
        "c5", "c5", // Stone Defender
        "c10", // River Crocolisk
        "c6", "c6", // Healing Acolyte (Deploy Heal)
        "c9", "c9", // Shield Bearer (Taunt)
        "c11", "c11", // Spider Tank
        "r5", "r5", // Knight Protector (Taunt)
        "r8", "r8", // Priestess of Elune (Deploy Heal)
        "e1", // Lord of the Arena (Taunt)
        "e3", // Ironbark Protector (Taunt)
        // Spells (Focus on Healing, Buffs, Removal)
        "s2", "s2", // Healing Touch (Heal)
        "s6", "s6", // Shield Wall (+Health)
        "s8", "s8", // Holy Smite (Damage)
        "s9", "s9", // Reinforce (+Atk/+Health)
        "s14", // Blessing of Kings (+Atk/+Health)
        // Hero Specific
        "h_p1", "h_p1", // Power Word: Shield (+Health)
        "h_p2", "h_p2", // Northshire Cleric (Placeholder effect)
    ]
};

// Validate deck sizes (Optional but recommended)
for (const heroId in defaultDecks) {
    if (defaultDecks[heroId].length !== 30) {
        console.warn(`Warning: Default deck for ${heroId} has ${defaultDecks[heroId].length} cards, expected 30.`);
    }
}
