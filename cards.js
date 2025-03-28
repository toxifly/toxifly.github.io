import { CARD_TYPES } from './constants.js';

// Basic card templates
export const CARD_TEMPLATES = [
    {
        id: 'strike',
        name: 'Strike',
        type: CARD_TYPES.ATTACK,
        cost: 1,
        description: 'Deal 6 damage.',
        rarity: 'common',
        effect: (game, source, target) => {
            console.log(`[Card:strike] Executing effect. Source: ${source.name}, Target: ${target.name}`);
            game.dealDamage(source, target, 6);
        }
    },
    {
        id: 'defend',
        name: 'Defend',
        type: CARD_TYPES.DEFENSE,
        cost: 1,
        description: 'Gain 5 block.',
        rarity: 'common',
        effect: (game, source) => {
            console.log(`[Card:defend] Executing effect. Source: ${source.name}`);
            const blockBefore = source.block;
            source.block += 5;
            console.log(`[Card:defend] Source block changed: ${blockBefore} -> ${source.block}`);
            game.log(`${source.name} gained 5 block.`, source === game.player ? 'player' : 'enemy');
        }
    },
    {
        id: 'quick_slash',
        name: 'Quick Slash',
        type: CARD_TYPES.ATTACK,
        cost: 1,
        description: 'Deal 4 damage. Draw a card.',
        rarity: 'common',
        effect: (game, source, target) => {
            console.log(`[Card:quick_slash] Executing effect. Source: ${source.name}, Target: ${target.name}`);
            game.dealDamage(source, target, 4);
            if (source === game.player) {
                console.log(`[Card:quick_slash] Player drawing card.`);
                game.drawCard();
            }
        }
    },
    {
        id: 'heavy_blow',
        name: 'Heavy Blow',
        type: CARD_TYPES.ATTACK,
        cost: 2,
        description: 'Deal 10 damage.',
        rarity: 'common',
        effect: (game, source, target) => {
            console.log(`[Card:heavy_blow] Executing effect. Source: ${source.name}, Target: ${target.name}`);
            game.dealDamage(source, target, 10);
        }
    },
    {
        id: 'iron_wave',
        name: 'Iron Wave',
        type: CARD_TYPES.ATTACK,
        cost: 1,
        description: 'Gain 5 block. Deal 5 damage.',
        rarity: 'common',
        effect: (game, source, target) => {
            console.log(`[Card:iron_wave] Executing effect. Source: ${source.name}, Target: ${target.name}`);
            const blockBefore = source.block;
            source.block += 5;
            console.log(`[Card:iron_wave] Source block changed: ${blockBefore} -> ${source.block}`);
            game.log(`${source.name} gained 5 block.`, source === game.player ? 'player' : 'enemy');
            game.dealDamage(source, target, 5);
        }
    },
    {
        id: 'bash',
        name: 'Bash',
        type: CARD_TYPES.ATTACK,
        cost: 2,
        description: 'Deal 8 damage. Apply 2 Vulnerable.',
        rarity: 'uncommon',
        effect: (game, source, target) => {
            console.log(`[Card:bash] Executing effect. Source: ${source.name}, Target: ${target.name}`);
            game.dealDamage(source, target, 8);
            const vulnerableBefore = target.vulnerable || 0;
            target.vulnerable = (target.vulnerable || 0) + 2;
            console.log(`[Card:bash] Target vulnerable changed: ${vulnerableBefore} -> ${target.vulnerable}`);
            game.log(`${target.name} became Vulnerable for 2 turns.`, source === game.player ? 'player' : 'enemy');
        }
    },
    {
        id: 'cleave',
        name: 'Cleave',
        type: CARD_TYPES.ATTACK,
        cost: 1,
        description: 'Deal 8 damage. Deal 3 damage to yourself.',
        rarity: 'uncommon',
        effect: (game, source, target) => {
            console.log(`[Card:cleave] Executing effect. Source: ${source.name}, Target: ${target.name}`);
            game.dealDamage(source, target, 8);
            console.log(`[Card:cleave] Applying self-damage (3) to ${source.name}.`);
            game.dealDamage(source, source, 3, true); // Deal damage logs details
        }
    },
    {
        id: 'blood_ritual',
        name: 'Blood Ritual',
        type: CARD_TYPES.SKILL,
        cost: 0,
        description: 'Lose 3 HP. Gain 2 energy.',
        rarity: 'uncommon',
        effect: (game, source) => {
            console.log(`[Card:blood_ritual] Executing effect. Source: ${source.name}`);
            const hpBefore = source.hp;
            const energyBefore = source.energy;
            source.hp -= 3;
            game.log(`${source.name} lost 3 HP.`, source === game.player ? 'player' : 'enemy');
            source.energy += 2;
            game.log(`${source.name} gained 2 energy.`, source === game.player ? 'player' : 'enemy');
            console.log(`[Card:blood_ritual] Source HP: ${hpBefore} -> ${source.hp}, Energy: ${energyBefore} -> ${source.energy}`);
            game.updateStats(); // Use UI.updateStats in game.js

            if (source.hp <= 0) {
                console.warn(`[Card:blood_ritual] Source ${source.name} HP dropped to ${source.hp} or below.`);
                if (source === game.player) {
                    game.gameOver(false);
                } else {
                    game.enemyDefeated();
                }
            }
        }
    },
    {
        id: 'shrug_it_off',
        name: 'Shrug It Off',
        type: CARD_TYPES.DEFENSE,
        cost: 1,
        description: 'Gain 8 block. Draw a card.',
        rarity: 'uncommon',
        effect: (game, source) => {
            console.log(`[Card:shrug_it_off] Executing effect. Source: ${source.name}`);
            const blockBefore = source.block;
            source.block += 8;
            console.log(`[Card:shrug_it_off] Source block changed: ${blockBefore} -> ${source.block}`);
            game.log(`${source.name} gained 8 block.`, source === game.player ? 'player' : 'enemy');
            if (source === game.player) {
                console.log(`[Card:shrug_it_off] Player drawing card.`);
                game.drawCard();
            }
        }
    },
    {
        id: 'uppercut',
        name: 'Uppercut',
        type: CARD_TYPES.ATTACK,
        cost: 2,
        description: 'Deal 13 damage.',
        rarity: 'uncommon',
        effect: (game, source, target) => {
            console.log(`[Card:uppercut] Executing effect. Source: ${source.name}, Target: ${target.name}`);
            game.dealDamage(source, target, 13);
        }
    },
    {
        id: 'sword_boomerang',
        name: 'Sword Boomerang',
        type: CARD_TYPES.ATTACK,
        cost: 1,
        description: 'Deal 3 damage 3 times.',
        rarity: 'uncommon',
        effect: (game, source, target) => {
            console.log(`[Card:sword_boomerang] Executing effect. Source: ${source.name}, Target: ${target.name}`);
            for (let i = 0; i < 3; i++) {
                console.log(`[Card:sword_boomerang] Dealing damage instance ${i + 1} of 3.`);
                // Check if target is still alive before dealing damage again
                if (target.hp > 0) {
                    game.dealDamage(source, target, 3);
                } else {
                    console.log(`[Card:sword_boomerang] Target ${target.name} defeated, stopping multi-hit.`);
                    break;
                }
            }
        }
    },
    {
        id: 'berserk',
        name: 'Berserk',
        type: CARD_TYPES.SKILL,
        cost: 1,
        description: 'Gain 1 energy each turn. Take 2 damage at the start of your turn.',
        rarity: 'rare',
        effect: (game, source) => {
            console.log(`[Card:berserk] Executing effect. Source: ${source.name}`);
            const berserkBefore = source.berserk || 0;
            source.berserk = (source.berserk || 0) + 1;
            console.log(`[Card:berserk] Source berserk changed: ${berserkBefore} -> ${source.berserk}`);
            game.log(`${source.name} will gain 1 energy each turn but take 2 damage.`, source === game.player ? 'player' : 'enemy');
        }
    },
    {
        id: 'offering',
        name: 'Offering',
        type: CARD_TYPES.SKILL,
        cost: 0,
        description: 'Lose 6 HP. Gain 2 energy and draw 3 cards.',
        rarity: 'rare',
        effect: (game, source) => {
            console.log(`[Card:offering] Executing effect. Source: ${source.name}`);
            const hpBefore = source.hp;
            const energyBefore = source.energy;
            source.hp -= 6;
            game.log(`${source.name} lost 6 HP.`, source === game.player ? 'player' : 'enemy');
            source.energy += 2;
            game.log(`${source.name} gained 2 energy.`, source === game.player ? 'player' : 'enemy');
            console.log(`[Card:offering] Source HP: ${hpBefore} -> ${source.hp}, Energy: ${energyBefore} -> ${source.energy}`);
            game.updateStats(); // Use UI.updateStats in game.js

            if (source === game.player) {
                console.log(`[Card:offering] Player drawing 3 cards.`);
                for (let i = 0; i < 3; i++) {
                    game.drawCard();
                }
            }

            if (source.hp <= 0) {
                console.warn(`[Card:offering] Source ${source.name} HP dropped to ${source.hp} or below.`);
                if (source === game.player) {
                    game.gameOver(false);
                } else {
                    game.enemyDefeated();
                }
            }
        }
    },
    {
        id: 'feed',
        name: 'Feed',
        type: CARD_TYPES.ATTACK,
        cost: 2,
        description: 'Deal 10 damage. If this kills the enemy, gain 3 max HP.',
        rarity: 'rare',
        effect: (game, source, target) => {
            console.log(`[Card:feed] Executing effect. Source: ${source.name}, Target: ${target.name}`);
            const targetHpBefore = target.hp;
            console.log(`[Card:feed] Target HP before damage: ${targetHpBefore}`);
            const targetDefeated = game.dealDamage(source, target, 10); // dealDamage returns true if target is defeated

            if (targetDefeated && targetHpBefore > 0 && source === game.player) {
                const maxHpBefore = source.maxHp;
                const hpBefore = source.hp;
                source.maxHp += 3;
                source.hp += 3; // Also heal the amount gained
                console.log(`[Card:feed] Player killed enemy. Max HP: ${maxHpBefore} -> ${source.maxHp}, HP: ${hpBefore} -> ${source.hp}`);
                game.log(`${source.name} gained 3 maximum HP!`, 'reward');
                game.updateStats(); // Use UI.updateStats in game.js
            } else if (targetDefeated) {
                console.log(`[Card:feed] Target was defeated, but condition for Max HP gain not met (Source not player or target already dead).`);
            } else {
                console.log(`[Card:feed] Target survived the damage.`);
            }
        }
    },
    {
        id: 'impervious',
        name: 'Impervious',
        type: CARD_TYPES.DEFENSE,
        cost: 2,
        description: 'Gain 20 block.',
        rarity: 'rare',
        effect: (game, source) => {
            console.log(`[Card:impervious] Executing effect. Source: ${source.name}`);
            const blockBefore = source.block;
            source.block += 20;
            console.log(`[Card:impervious] Source block changed: ${blockBefore} -> ${source.block}`);
            game.log(`${source.name} gained 20 block.`, source === game.player ? 'player' : 'enemy');
        }
    },
    {
        id: 'limit_break',
        name: 'Limit Break',
        type: CARD_TYPES.SKILL,
        cost: 1,
        description: 'Double your strength.',
        rarity: 'rare',
        effect: (game, source) => {
            console.log(`[Card:limit_break] Executing effect. Source: ${source.name}`);
            if (source.strength && source.strength > 0) { // Only double positive strength
                const strengthBefore = source.strength;
                source.strength *= 2;
                console.log(`[Card:limit_break] Source strength doubled: ${strengthBefore} -> ${source.strength}`);
                game.log(`${source.name}'s strength doubled to ${source.strength}!`, source === game.player ? 'player' : 'enemy');
            } else {
                console.log(`[Card:limit_break] Source has no positive strength (${source.strength || 0}) to double.`);
                game.log(`${source.name} has no strength to double.`, source === game.player ? 'player' : 'enemy');
            }
        }
    }
];

export function getCardTemplate(id) {
    // console.debug(`[Data] Getting card template for ID: ${id}`); // Can be noisy
    const template = CARD_TEMPLATES.find(card => card.id === id);
    if (!template) {
        console.error(`[Data] Card template not found for ID: ${id}`);
    }
    return template;
} 