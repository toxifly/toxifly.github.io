import { EnemyDefinition } from '../types';

// Define base properties for enemies, excluding dynamic state like hp, block, etc.
// type EnemyDefinition = Omit<
//   EnemyState,
//   'hp' | 'block' | 'momentum' | 'buffs'
// >;

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