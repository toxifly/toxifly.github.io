import { CardDefinition, CardEffect } from '../types';

export const cards: Record<string, CardDefinition> = {
  strike: {
    id: 'strike',
    name: 'Strike',
    cost: 1,
    description: 'Deal 6 damage.',
    effects: [
      { type: 'damage', value: 6 },
    ],
  },
  defend: {
    id: 'defend',
    name: 'Defend',
    cost: 1,
    description: 'Gain 5 Block.',
    effects: [
      { type: 'block', value: 5 },
    ],
  },
  // Add more cards here
}; 