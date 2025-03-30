import {
  GameConfig,
  GameState,
  PlayerState,
  EnemyState,
  CombatantState,
  CardDefinition,
  ActionRequest,
  Buff,
} from './types';
// Import the actual config constants now needed for initialization logic
import { config as gameConfigConstants } from './config';

/**
 * Manages the game state and logic for multiple players.
 */
export class DefaultGameManager {
  private config: GameConfig;
  private playerStates: Map<string, GameState> = new Map(); // Stores game state per player ID

  constructor(config: GameConfig) {
    this.config = config;
    // Ensure card/enemy definitions are part of the config passed in
    if (!config.cards || !config.enemies) {
      throw new Error(
        'GameConfig must include card and enemy definitions.'
      );
    }
    console.log('GameManager initialized');
  }

  /**
   * Retrieves the current game state for a given player.
   * If the player has no state, it initializes a new game state.
   * @param playerId The unique identifier for the player.
   * @returns The current GameState for the player.
   */
  getState(playerId: string): GameState {
    let state = this.playerStates.get(playerId);
    if (!state) {
      console.log(`No state found for player ${playerId}, initializing new game.`);
      // --- Remove TEMPORARY state initialization call ---
      // state = this.initializeNewGameState(playerId); // Old call
      // --- Implement proper initial state creation (Step 24) ---
      state = this.initializeNewGameState(playerId);
      this.setState(playerId, state);
      // --- End Step 24 Initialization ---
    }
    return state;
  }

  /**
   * Updates the game state for a specific player.
   * @param playerId The unique identifier for the player.
   * @param state The new GameState object.
   */
  setState(playerId: string, state: GameState): void {
    this.playerStates.set(playerId, state);
    console.log(`State updated for player ${playerId}`);
    // TODO: Consider if any side effects or broadcasts should happen here or elsewhere.
  }

  /**
   * Validates and processes a player action.
   * @param playerId The ID of the player requesting the action.
   * @param action The ActionRequest object from the client.
   * @returns A promise resolving to an object indicating success and an optional message.
   */
  async validateAction(
    playerId: string,
    action: ActionRequest
  ): Promise<{ success: boolean; message?: string }> {
    const currentState = this.getState(playerId);
    console.log(`Validating action ${action.type} for player ${playerId}`);

    // TODO: Implement action validation and processing logic (Steps 27, 28, 37, etc.)
    switch (action.type) {
      case 'autoPlayCard':
        // Placeholder logic
        return { success: true };
      case 'selectReward':
        // Placeholder logic
        return { success: true };
      case 'endTurn':
        // Placeholder logic
        return { success: true };
      case 'newGame':
        // Placeholder logic
        return { success: true };
      default:
        return { success: false, message: 'Unknown action type' };
    }
  }

  /**
   * Applies the effects of a card to the caster and target.
   * @param card The definition of the card being played.
   * @param caster The combatant playing the card.
   * @param target The combatant being targeted (can be the same as caster).
   * @param gameState The current game state (needed for context like drawing cards).
   */
  applyCardEffects(
    card: CardDefinition,
    caster: CombatantState,
    target: CombatantState,
    gameState: GameState // Added gameState for broader context
  ): void {
    console.log(`Applying effects of card ${card.name} from ${caster.name} to ${target.name}`);
    // TODO: Implement card effect logic (Step 26)
  }

  /**
   * Sets up the game state for the start of a new fight (e.g., next floor).
   * @param gameState The current game state to modify.
   */
  startNewFight(gameState: GameState): void {
    console.log(`Starting new fight for floor ${gameState.floor}`);
    // TODO: Implement new fight setup logic (Step 38)
  }

  /**
   * Generates reward options after a fight is won.
   * @param gameState The current game state to modify.
   */
  generateRewards(gameState: GameState): void {
    console.log(`Generating rewards for floor ${gameState.floor}`);
    // TODO: Implement reward generation logic (Step 36)
  }

  // --- Start: Updated initializeNewGameState for Step 24 ---
  /**
   * Initializes a brand new game state for a player.
   * Implements Step 24 logic.
   * @param playerId The player ID.
   * @returns The initialized GameState.
   */
  private initializeNewGameState(playerId: string): GameState {
    console.log(`Initializing new game state for player ${playerId}`);

    // Create Player State
    const startingDeckIds = gameConfigConstants.PLAYER_STARTING_DECK.map((id) =>
      id.toLowerCase()
    ); // Normalize IDs

    // Validate starting deck cards exist
    startingDeckIds.forEach((cardId) => {
        if (!this.config.cards[cardId]) {
            console.error(`ERROR: Starting deck card ID "${cardId}" not found in config.cards!`);
            // Potentially throw an error or filter out invalid cards
        }
    });

    const playerState: PlayerState = {
      id: playerId,
      name: 'Player', // Consider making this configurable later
      hp: this.config.PLAYER_MAX_HP,
      maxHp: this.config.PLAYER_MAX_HP,
      block: 0,
      momentum: 0,
      buffs: [],
      energy: this.config.PLAYER_START_ENERGY,
      maxEnergy: this.config.PLAYER_START_ENERGY,
      deck: startingDeckIds, // Use normalized IDs
      hand: [],
      discard: [],
      nextCard: null, // Will be set by initial draw
    };

    // Create Enemy State for Floor 1
    // TODO: Implement proper floor-based enemy selection based on config
    const enemyIds = Object.keys(this.config.enemies);
    if (enemyIds.length === 0) {
      throw new Error('No enemies defined in the game config!');
    }
    const floor1EnemyId = enemyIds[0]; // Use the first defined enemy for now
    const enemyDefinition = this.config.enemies[floor1EnemyId];

    const enemyState: EnemyState = {
      id: enemyDefinition.id,
      name: enemyDefinition.name,
      maxHp: enemyDefinition.maxHp,
      hp: enemyDefinition.maxHp, // Start at full HP
      block: 0,
      momentum: 0,
      buffs: [],
      maxEnergy: enemyDefinition.maxEnergy,
      deck: enemyDefinition.deck.map(id => id.toLowerCase()), // Ensure enemy card IDs are also normalized if needed
      description: enemyDefinition.description,
    };

    // Assemble initial Game State
    const initialGameState: GameState = {
      floor: 1,
      phase: 'fighting',
      turn: 'player',
      player: playerState,
      enemy: enemyState,
      rewardOptions: [],
      currentRewardSet: 0,
      // currency can be omitted or initialized to 0
    };

    // Initial setup actions
    this.shuffleDeck(initialGameState.player); // Shuffle the starting deck
    this.drawCard(initialGameState.player); // Set the first 'nextCard'

    console.log("Initial game state created:", initialGameState);
    return initialGameState;
  }
  // --- End: Updated initializeNewGameState for Step 24 ---

  /**
   * Draws a card for the player, handling deck shuffle.
   * (Placeholder for Step 25 logic)
   * @param playerState The player state to modify.
   */
  private drawCard(playerState: PlayerState): void {
    // TODO: Implement Step 25
    console.log(`Drawing card for player ${playerState.id}... (Stub)`);
    // Step 25 will handle deck logic, shuffling, and setting nextCard.
    // For now, as a stub, we can just log or do nothing.
    // If the deck wasn't empty, Step 25 would move a card ID from deck to nextCard.
  }

  /**
   * Shuffles the player's discard pile into their deck.
   * (Placeholder for Step 25 logic)
   * @param playerState The player state to modify.
   */
  private shuffleDeck(playerState: PlayerState): void {
    // TODO: Implement Step 25
    console.log(`Shuffling deck for player ${playerState.id}... (Stub)`);
    // Step 25 will implement the actual shuffle logic.
  }
} 