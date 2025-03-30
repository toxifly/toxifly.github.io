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
  bash: {
    id: 'bash',
    name: 'Bash',
    cost: 2,
    description: 'Deal 8 damage. Gain 3 Block.',
    effects: [
      { type: 'damage', value: 8 },
      { type: 'block', value: 3 },
    ],
  },
  quick_slash: {
    id: 'quick_slash',
    name: 'Quick Slash',
    cost: 0,
    description: 'Deal 3 damage.',
    effects: [
      { type: 'damage', value: 3 },
    ],
  },
}; 