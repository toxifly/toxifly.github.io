// This import is likely okay if Buff is defined in types.ts
// If Buff also relies on BuffDefinition in types.ts, you might have another circle.
// Let's assume Buff is defined independently in types.ts for now.
// import { Buff } from '../types'; // Remove if Buff is not used or causes issues

// Define the static properties of buffs. Duration and stacks are dynamic.
// Using Omit<Buff, 'duration' | 'stacks'> as the base type for definitions.
export interface BuffDefinition {
    id: string;
    name: string;
    description: string;
    image?: string; // Optional: Path to buff icon (e.g., /images/buffs/strength.png)
    // Add properties like 'isDebuff', 'type', etc. if needed
}

export const buffs: Record<string, BuffDefinition> = {
    strength: {
        id: 'strength',
        name: 'Strength',
        description: 'Increases Attack damage.',
        image: '/images/buffs/strength.png', // Example path
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
        description: 'Takes 50% increased damage from Attacks.', // Example description update
        // image: 'vulnerable.png'
    },
    frail: {
        id: 'frail',
        name: 'Frail',
        description: 'Decreases Block gained.',
        // image: 'frail.png'
    },
    dexterity: {
        id: 'dexterity',
        name: 'Dexterity',
        description: 'Increases Block gained from cards.',
        // image: '/images/buffs/dexterity.png',
    },
    // Add more buffs as needed
}; 