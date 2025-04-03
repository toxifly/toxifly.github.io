// Define base properties for enemies, excluding dynamic state like hp, block, etc.
// type EnemyDefinition = Omit<
//   EnemyState,
//   'hp' | 'block' | 'momentum' | 'buffs'
// >;

export interface EnemyDefinition {
    id: string;
    name: string;
    maxHp: number;
    maxEnergy: number; // Added maxEnergy based on EnemyState
    deck: string[]; // Array of card IDs the enemy uses
    image?: string; // Optional: Explicit image path override
    description?: string; // Optional flavor text
    // Add base stats like strength, etc., if applicable
}

export const enemies: Record<string, EnemyDefinition> = {
  slime: {
    id: 'slime',
    name: 'Slime',
    maxHp: 15,
    maxEnergy: 1,
    deck: ['strike'], // Enemy uses card IDs
    description: 'A basic slime enemy.',
  },
  // Add more enemies here
}; 