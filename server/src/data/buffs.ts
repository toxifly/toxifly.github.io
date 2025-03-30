import { Buff } from '../types';

// Define the static properties of buffs. Duration and stacks are dynamic.
// Using Omit<Buff, 'duration' | 'stacks'> as the base type for definitions.
export type BuffDefinition = Omit<Buff, 'duration' | 'stacks'>;

export const buffs: Record<string, BuffDefinition> = {
    strength: {
        id: 'strength',
        name: 'Strength',
        description: 'Increases Attack damage.',
        // image: 'strength.png' // Assumes images are in public/images/buffs/
        // Add trigger logic markers if needed later, e.g., effectValue: 1
    },
    weakness: {
        id: 'weakness',
        name: 'Weakness',
        description: 'Decreases Attack damage dealt.',
        // image: 'weakness.png'
    },
    vulnerable: {
        id: 'vulnerable',
        name: 'Vulnerable',
        description: 'Takes increased damage from Attacks.',
        // image: 'vulnerable.png'
    },
    frail: {
        id: 'frail',
        name: 'Frail',
        description: 'Decreases Block gained.',
        // image: 'frail.png'
    },
    // Add more buffs as needed
}; 