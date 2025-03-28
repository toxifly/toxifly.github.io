import { CARD_TEMPLATES, getCardTemplate } from './cards.js';

export const ENEMIES = [
     {
         id: 'slime',
         name: 'Slime',
         hp: 14,
         maxHp: 14,
         energy: 3,
         maxEnergy: 3,
         deck: ['strike', 'strike', 'defend'],
         difficulty: 1
     },
     {
         id: 'goblin',
         name: 'Goblin',
         hp: 18,
         maxHp: 18,
         energy: 3,
         maxEnergy: 3,
         deck: ['strike', 'strike', 'quick_slash', 'defend'],
         difficulty: 1
     },
     {
         id: 'bandit',
         name: 'Bandit',
         hp: 22,
         maxHp: 22,
         energy: 3,
         maxEnergy: 3,
         deck: ['strike', 'quick_slash', 'heavy_blow', 'defend'],
         difficulty: 2
     },
     {
         id: 'skeleton_warrior',
         name: 'Skeleton Warrior',
         hp: 26,
         maxHp: 26,
         energy: 3,
         maxEnergy: 3,
         deck: ['strike', 'heavy_blow', 'bash', 'defend', 'defend'],
         difficulty: 2
     },
     {
         id: 'cultist',
         name: 'Cultist',
         hp: 30,
         maxHp: 30,
         energy: 3,
         maxEnergy: 3,
         deck: ['strike', 'blood_ritual', 'cleave', 'defend'],
         difficulty: 3
     },
     {
         id: 'knight',
         name: 'Knight',
         hp: 36,
         maxHp: 36,
         energy: 3,
         maxEnergy: 3,
         deck: ['heavy_blow', 'iron_wave', 'iron_wave', 'shrug_it_off', 'bash'],
         difficulty: 3
     },
     {
         id: 'dark_mage',
         name: 'Dark Mage',
         hp: 40,
         maxHp: 40,
         energy: 4,
         maxEnergy: 4,
         deck: ['blood_ritual', 'uppercut', 'cleave', 'berserk', 'defend', 'defend'],
         difficulty: 4
     },
     {
         id: 'dragon',
         name: 'Dragon',
         hp: 50,
         maxHp: 50,
         energy: 4,
         maxEnergy: 4,
         deck: ['heavy_blow', 'uppercut', 'cleave', 'sword_boomerang', 'berserk', 'offering'],
         difficulty: 5
     }
 ];

 export function generateEnemyForFloor(currentFloor) {
    console.log(`[EnemyGen] Generating enemy for floor ${currentFloor}...`);
    // Choose enemy based on current floor
    const difficultyLevel = Math.min(Math.ceil(currentFloor / 2), 5);
     console.log(`[EnemyGen] Calculated difficulty level: ${difficultyLevel}`);
    const possibleEnemies = ENEMIES.filter(e => e.difficulty <= difficultyLevel);
     console.log(`[EnemyGen] Possible enemies at this difficulty: ${possibleEnemies.map(e => e.id).join(', ')}`);
    const baseEnemyData = possibleEnemies[Math.floor(Math.random() * possibleEnemies.length)];
     console.log(`[EnemyGen] Selected base enemy type: ${baseEnemyData.id} (${baseEnemyData.name})`);
     // Use deep copy to avoid modifying the original template
     const enemyData = JSON.parse(JSON.stringify(baseEnemyData));


    // Scale enemy stats based on floor
    const scalingFactor = 1 + (currentFloor - 1) * 0.1;
    console.log(`[EnemyGen] Applying scaling factor: ${scalingFactor.toFixed(2)}`);
    const maxHpBefore = enemyData.maxHp;
    enemyData.maxHp = Math.floor(enemyData.maxHp * scalingFactor);
    enemyData.hp = enemyData.maxHp; // Start at full scaled HP
    console.log(`[EnemyGen] Scaled Max HP: ${maxHpBefore} -> ${enemyData.maxHp}`);

    // Add additional cards to enemy deck on higher floors
    if (currentFloor > 5) {
        const additionalCardsCount = Math.floor((currentFloor - 5) / 2);
         console.log(`[EnemyGen] Floor > 5, adding ${additionalCardsCount} extra cards to deck.`);
        for (let i = 0; i < additionalCardsCount; i++) {
            // Ensure CARD_TEMPLATES is accessible here or passed in if needed
            const randomCardTemplate = CARD_TEMPLATES[Math.floor(Math.random() * CARD_TEMPLATES.length)];
            enemyData.deck.push(randomCardTemplate.id);
            console.log(`[EnemyGen] Added random card ${i+1}/${additionalCardsCount}: ${randomCardTemplate.id}`);
        }
         console.log(`[EnemyGen] Final enemy deck size: ${enemyData.deck.length}`);
    } else {
        console.log(`[EnemyGen] Floor <= 5, no extra cards added.`);
    }

    // Initialize battle-specific properties
    enemyData.hand = [];
    enemyData.drawPile = []; // Draw pile will be populated in startBattle
    enemyData.discardPile = [];
    enemyData.block = 0;
    enemyData.vulnerable = 0; // Ensure these are initialized
    enemyData.berserk = 0;
    // Strength might need to be added if enemies can gain it
    // enemyData.strength = 0;


    console.log(`[EnemyGen] Final generated enemy data for floor ${currentFloor}:`, JSON.parse(JSON.stringify(enemyData)));
    return enemyData;
 } 