// /js/decks.js

// Default 30-card decks for each hero class
// Using card IDs from cardLibrary in cards.js

import { MIN_DECK_SIZE, MAX_DECK_SIZE } from './constants.js';

export const defaultDecks = {
    t1000: [ // Terminator T-1000 Deck (Resilience, Damage, Stealth)
        // Creatures
        "mc_c1", // Security Guard
        "mc_c3", "mc_c3", // Lab Experiment (Self Damage)
        "mc_c4", "mc_c4", // Motorcycle Courier (Swift)
        "mc_c5", "mc_c5", // Armored Truck
        "mc_c7", "mc_c7", // Enraged Test Subject (Frenzy)
        "mc_c8", "mc_c8", // Hidden Operative (Stealth)
        "mc_c11", "mc_c11", // Hunter Drone
        "mc_c14", "mc_c14", // Damaged Cyborg (Frenzy)
        "mc_r2", // SWAT Captain (Aura)
        "mc_e2", // T-800 Endoskeleton
        // Spells
        "mc_s1", "mc_s1", // Explosion (Damage)
        "mc_s5", "mc_s5", // Short Circuit (Damage)
        "mc_s6", "mc_s6", // Reinforcements (Buff)
        "mc_s9", // Laser Blast (Creature Damage)
        // Hero Specific
        "h_t1", "h_t1", // Liquid Metal Form (Temp Attack)
        "h_t2", "h_t2", // Police Disguise (Stealth)
    ],
    indy: [ // Indiana Jones Deck (Value, Swift, Artifacts/Traps)
        // Creatures
        "mc_c1", "mc_c1", // Security Guard
        "mc_c4", "mc_c4", // Motorcycle Courier (Swift)
        "mc_c10", "mc_c10", // Giant Spider
        "mc_c11", "mc_c11", // Hunter Drone
        "mc_c12", "mc_c12", // Escape Vehicle (Swift)
        "mc_r3", "mc_r3", // Temple Guard (Taunt)
        "mc_r4", "mc_r4", // Mad Scientist (Draw)
        "mc_r7", // Jungle Predator (Stealth)
        "mc_l2", // Rolling Boulder (Legendary)
        // Spells
        "mc_s1", "mc_s1", // Explosion (Damage)
        "mc_s4", "mc_s4", // Research Notes (Draw)
        "mc_s6", "mc_s6", // Reinforcements (Buff)
        "mc_s10", // Top Secret Files (Draw)
        "mc_s12", // Ancient Curse (Buff)
        // Hero Specific
        "h_i1", "h_i1", // Whip Crack (Damage)
        "h_i2", "h_i2", // Adventurous Assistant (Spell Synergy)
    ],
    dracula: [ // Count Dracula Deck (Swift, Stealth, Life Drain/Heal)
        // Creatures
        "mc_c3", "mc_c3", // Lab Experiment (Self Damage)
        "mc_c6", "mc_c6", // Field Medic (Heal)
        "mc_c8", "mc_c8", // Hidden Operative (Stealth)
        "mc_c9", "mc_c9", // Riot Police (Taunt)
        "mc_c13", "mc_c13", // Zombie
        "mc_r5", "mc_r5", // Hired Muscle (Taunt)
        "mc_r6", "mc_r6", // Renfield (Heal)
        "mc_r7", "mc_r7", // Jungle Predator (Stealth)
        "mc_e3", // Ancient Mummy (Taunt)
        // Spells
        "mc_s2", "mc_s2", // First Aid (Heal)
        "mc_s5", "mc_s5", // Short Circuit (Damage)
        "mc_s7", "mc_s7", // Cryo Grenade (Freeze)
        "mc_s8", // Flash Freeze (Freeze Board)
        "mc_s9", // Laser Blast (Creature Damage)
        // Hero Specific
        "h_d1", "h_d1", // Blood Drain (Damage)
        "h_d2", "h_d2", // Vampire Bat (Swift)
    ],
    docbrown: [ // Dr. Emmett Brown Deck (Draw, Buffs, Tech/Control)
        // Creatures
        "mc_c2", "mc_c2", // Barricade (Taunt)
        "mc_c6", "mc_c6", // Field Medic (Heal)
        "mc_c10", "mc_c10", // Giant Spider
        "mc_c11", "mc_c11", // Hunter Drone
        "mc_c12", "mc_c12", // Escape Vehicle (Swift)
        "mc_r1", // Xenomorph Drone
        "mc_r4", "mc_r4", // Mad Scientist (Draw)
        "mc_e1", // Heavy Mech Suit (Taunt)
        // Spells
        "mc_s2", "mc_s2", // First Aid (Heal)
        "mc_s3", "mc_s3", // Adrenaline Rush (Buff)
        "mc_s4", "mc_s4", // Research Notes (Draw)
        "mc_s7", "mc_s7", // Cryo Grenade (Freeze)
        "mc_s10", // Top Secret Files (Draw)
        "mc_s11", // Plasma Rifle (Damage)
        // Hero Specific
        "h_db1", "h_db1", // Flux Capacitor Charge (Buff)
        "h_db2", "h_db2", // Lab Assistant (Heal Synergy)
    ]
};

// Validate default deck sizes against the allowed range
for (const heroId in defaultDecks) {
    const deckSize = defaultDecks[heroId].length;
    if (deckSize < MIN_DECK_SIZE || deckSize > MAX_DECK_SIZE) {
        console.warn(`Warning: Default deck for ${heroId} has ${deckSize} cards, expected between ${MIN_DECK_SIZE} and ${MAX_DECK_SIZE}.`);
    }
}
