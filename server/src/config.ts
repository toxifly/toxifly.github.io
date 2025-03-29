/**
 * Game Configuration Constants
 */

export const config = {
    // Player Stats
    PLAYER_MAX_HP: 75,
    PLAYER_START_ENERGY: 3,
    PLAYER_START_MOMENTUM_MAX: 10,
    PLAYER_STARTING_DECK: ['Strike', 'Strike', 'Strike', 'Strike', 'Defend', 'Defend', 'Defend', 'Defend'], // Card IDs

    // Gameplay Mechanics
    STARTING_HAND_SIZE: 1, // How many cards drawn initially (after first card is set)
    NEXT_CARD_DRAWN_ON_SHUFFLE: true, // Does shuffling immediately draw the next card?
    MOMENTUM_PER_CARD: 1,
    MOMENTUM_PER_ZERO_COST_CARD: 2, // Can be different if desired
    MOMENTUM_PER_SHUFFLE: 3,

    // Rewards
    REWARD_CHOICES_COUNT: 3, // Number of cards offered per reward set
    REWARD_SETS: 2, // Number of reward choices after a fight

    // Client/Animation Settings (can be moved/split later if needed)
    ANIMATION_SPEEDS: {
        CARD_PLAY: 500, // ms
        ENEMY_TURN: 1000, // ms delay before enemy acts
        SHUFFLE: 300, // ms
    },

    // Other constants can be added here as needed
    // e.g., FLOOR_SCALING_FACTOR, specific buff durations, etc.
};

// Type definition for the config object (optional but good practice)
export type GameConfigConstants = typeof config; 