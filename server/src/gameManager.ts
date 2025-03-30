import {
  GameConfig,
  GameState,
  PlayerState,
  EnemyState,
  CombatantState,
  CardDefinition,
  ActionRequest,
  Buff,
  BuffDefinition,
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
    // Use a mutable copy for modifications within this action handler
    const state = JSON.parse(JSON.stringify(currentState)) as GameState;
    const player = state.player;
    const enemy = state.enemy;

    console.log(`Processing action ${action.type} for player ${playerId}`);

    switch (action.type) {
      case 'autoPlayCard': { // Added block scope for clarity
        // --- Validation (Step 27 - Mostly complete) ---
        if (state.phase !== 'fighting') {
            return { success: false, message: "Cannot play cards outside of fighting phase." };
        }
        if (state.turn !== 'player') {
          return { success: false, message: "Not player's turn." };
        }
        // Use player from the mutable 'state' object
        const cardToPlay = player.nextCard;
        if (!cardToPlay) {
          return { success: false, message: 'No card ready to play.' };
        }
        if (player.energy < cardToPlay.cost) {
          return {
            success: false,
            message: `Not enough energy to play ${cardToPlay.name} (Cost: ${cardToPlay.cost}, Have: ${player.energy}).`,
          };
        }
        // --- Validation Passed ---
        console.log(`Action 'autoPlayCard' (${cardToPlay.name}) validated. Executing...`);

        // --- Execution (Step 28) ---
        // No need to re-declare state, player, enemy, card here

        // 1. Deduct Energy
        player.energy -= cardToPlay.cost;
        console.log(`Player ${playerId} spent ${cardToPlay.cost} energy. Remaining: ${player.energy}`);

        // 2. Apply Card Effects (Simplified Targeting Heuristic)
        let primaryTarget: CombatantState = player;
        if (cardToPlay.effects.some(e => e.type === 'damage')) {
            primaryTarget = enemy;
        }
        console.log(`Applying effects of ${cardToPlay.name}. Caster: Player, Primary Target: ${primaryTarget.name}`);
        this.applyCardEffects(cardToPlay, player, primaryTarget, state);

        // 3. Add Momentum
        const momentumToAdd = cardToPlay.cost === 0
            ? gameConfigConstants.MOMENTUM_PER_ZERO_COST_CARD
            : gameConfigConstants.MOMENTUM_PER_CARD;
        player.momentum += momentumToAdd;
        console.log(`Player ${playerId} gained ${momentumToAdd} momentum. Total: ${player.momentum}`);

        // 4. Move Card from nextCard to Discard
        player.discard.push(cardToPlay.id); // Add card ID to discard
        player.nextCard = null; // Clear the next card slot
        console.log(`Card ${cardToPlay.name} (ID: ${cardToPlay.id}) moved to discard. Discard size: ${player.discard.length}`);

        // 5. Draw Next Card (Prepare the *next* card)
        this.drawCard(player);

        // 6. Check Momentum Cap -> Switch Turn?
        if (player.momentum >= gameConfigConstants.PLAYER_START_MOMENTUM_MAX) {
            console.log(`Player ${playerId} reached momentum cap (${player.momentum}/${gameConfigConstants.PLAYER_START_MOMENTUM_MAX}). Switching turn.`);
            // Apply end-of-turn effects *before* switching
            this.applyEndOfTurnBuffs(player); // Tick duration/remove buffs
            player.momentum = 0; // Reset momentum
            state.turn = 'enemy';
            // Note: The start-of-turn buffs for the enemy will be handled in index.ts -> runEnemyTurn
        }

        // 7. Check Win/Loss Conditions (Calls helper function)
        this.checkCombatEnd(state); // Modifies 'state' directly

        // 8. Update State (Save all modifications)
        this.setState(playerId, state);

        // 9. Return Success
        console.log(`Action 'autoPlayCard' (${cardToPlay.name}) executed successfully for player ${playerId}. Current phase: ${state.phase}, Turn: ${state.turn}`);
        return { success: true };
      } // End case 'autoPlayCard'
      case 'selectReward': {
        // --- Validation ---
        if (state.phase !== 'reward') {
            return { success: false, message: "Cannot select rewards outside of reward phase." };
        }
        if (action.payload === undefined || typeof action.payload.cardIndex !== 'number') {
            return { success: false, message: "Invalid payload for selectReward action." };
        }
        const cardIndex = action.payload.cardIndex;
        const currentRewardSetIndex = state.currentRewardSet;
        const currentOptions = state.rewardOptions[currentRewardSetIndex];

        if (currentRewardSetIndex >= state.rewardOptions.length) {
            return { success: false, message: `Invalid current reward set index (${currentRewardSetIndex}).` };
        }

        const isValidIndex = cardIndex >= -1 && cardIndex < currentOptions.length;

        if (!isValidIndex) {
            return { success: false, message: `Invalid card index (${cardIndex}) for current reward options.` };
        }

        // Add null check for currentOptions just in case
        if (!currentOptions) {
            console.error(`Error: Could not find reward options for set index ${currentRewardSetIndex}`);
            return { success: false, message: `Internal server error: Missing reward options for set ${currentRewardSetIndex}.` };
        }

        console.log(`Action 'selectReward' validated. Player selected index ${cardIndex}. Current Set Index: ${currentRewardSetIndex}`);

        // --- Execution ---
        if (cardIndex !== -1) { // Player chose a card (not skipped)
            const chosenCard = currentOptions[cardIndex];
            player.discard.push(chosenCard.id); // Add chosen card ID to discard pile
            player.allCards.push(chosenCard.id); // Also add to the full deck list
            console.log(`Player ${playerId} added ${chosenCard.name} (ID: ${chosenCard.id}) to discard pile and allCards list.`);
        } else {
            console.log(`Player ${playerId} skipped reward set ${currentRewardSetIndex + 1}.`);
        }

        // Increment reward set index
        state.currentRewardSet++;

        // --- Add detailed logging before the check ---
        console.log(`Checking reward completion: currentRewardSet=${state.currentRewardSet}, REWARD_SETS=${gameConfigConstants.REWARD_SETS}, rewardOptions.length=${state.rewardOptions.length}`);
        // --- End added logging ---

        // Check if all reward sets have been processed
        if (state.currentRewardSet >= gameConfigConstants.REWARD_SETS || state.currentRewardSet >= state.rewardOptions.length) {
            console.log(`Finished all reward sets. Transitioning to next fight.`);
            state.rewardOptions = []; // Clear reward options
            state.currentRewardSet = 0; // Reset index
            state.phase = 'fighting';
            this.startNewFight(state); // Set up the next enemy
            this.drawCard(player); // Draw the first card for the new fight
            console.log(`Phase set to 'fighting'. Next fight setup. First card drawn: ${player.nextCard?.name}`);
        } else {
            console.log(`Moving to next reward set (${state.currentRewardSet}/${gameConfigConstants.REWARD_SETS}). Target next index: ${state.currentRewardSet}`); // Updated log
        }

        // Update State
        this.setState(playerId, state);

        // Return Success
        return { success: true };
      } // End case 'selectReward'
      case 'endTurn': { // Added block scope
        // --- Validation ---
        if (state.phase !== 'fighting') {
          return { success: false, message: "Cannot end turn outside of fighting phase." };
        }
        if (state.turn !== 'player') {
          return { success: false, message: "Not player's turn." };
        }
        console.log(`Action 'endTurn' validated. Executing...`);

        // --- Execution ---
        // No need to re-declare state, player, enemy here

        // 1. Apply End-of-Turn Effects (Buffs, etc.) BEFORE switching turn
        this.applyEndOfTurnBuffs(player); // Tick duration/remove buffs
        console.log(`Player ${playerId} manually ended turn. Applied end-of-turn buffs.`);

        // 2. Reset Player Momentum
        player.momentum = 0;
        console.log(`Player ${playerId} momentum reset.`);

        // 3. Switch Turn to Enemy
        state.turn = 'enemy';
        console.log(`Switching turn to enemy.`);
        // Note: Actual enemy turn logic (Step 32) is not triggered here directly.
        // The server (index.ts) will observe the state change and trigger it.
        // Enemy start-of-turn buffs will be handled within runEnemyTurn

        // 4. Update State
        this.setState(playerId, state);

        // 5. Return Success
        console.log(`Action 'endTurn' executed successfully for player ${playerId}. Turn: ${state.turn}`);
        return { success: true };
      } // End case 'endTurn'
      case 'startBattle': { // Added for Step 2
        // --- Validation ---
        if (state.phase !== 'pre_battle') {
          return { success: false, message: 'Cannot start battle now.' };
        }
        console.log(`Action 'startBattle' validated. Executing...`);

        // --- Execution ---
        state.phase = 'fighting';
        this.drawCard(player); // Draw the first card for the battle
        console.log(`Phase changed to 'fighting'. First card drawn: ${player.nextCard?.name}`);

        // Update State
        this.setState(playerId, state);

        // Return Success
        return { success: true };
      } // End case 'startBattle'
      case 'newGame':
        // Placeholder logic
        return { success: true };
      default:
        // const _exhaustiveCheck: never = action; // Optional: Exhaustiveness check
        // console.warn(`Unknown action type received: ${action.type}`); // Error TS2339
        console.warn(`Unknown or unhandled action type received.`); // Corrected log
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
    // --- Start: Step 26 - Implement basic card effect logic ---
    card.effects.forEach(effect => {
      console.log(`  - Applying effect: ${effect.type}, value: ${effect.value}, buff: ${effect.buffType}`);
      switch (effect.type) {
        case 'damage':
          if (effect.value === undefined) {
            console.error(`Card ${card.name} has damage effect without value.`);
            return;
          }
          // Apply damage logic: reduce block first, then HP.
          const damageToDeal = effect.value;
          const blockReduction = Math.min(target.block, damageToDeal);
          target.block -= blockReduction;
          const remainingDamage = damageToDeal - blockReduction;
          if (remainingDamage > 0) {
              target.hp = Math.max(0, target.hp - remainingDamage); // Ensure HP doesn't go below 0
          }
          console.log(`    ${caster.name} dealt ${damageToDeal} damage to ${target.name}. Target HP: ${target.hp}, Block: ${target.block}`);
          break;

        case 'block':
          if (effect.value === undefined) {
            console.error(`Card ${card.name} has block effect without value.`);
            return;
          }
          caster.block += effect.value;
          console.log(`    ${caster.name} gained ${effect.value} block. Total: ${caster.block}`);
          break;

        case 'applyBuff':
          // TODO: Implement buff application logic (requires Buff definitions and handling)
          console.log(`    Applying buff ${effect.buffType} (stacks: ${effect.buffStacks ?? 1}) from ${caster.name} to ${target.name} - Logic pending`);
          if (!effect.buffType) {
              console.error(`Card ${card.name} has applyBuff effect without buffType.`);
              return;
          }
          const buffDef = this.config.buffs[effect.buffType.toLowerCase()];
          if (!buffDef) {
              console.error(`Buff definition not found for type: ${effect.buffType}`);
              return;
          }
          const stacksToAdd = effect.buffStacks ?? 1;
          const duration = 1; // Default duration? Or should cards specify? Let's default to 1 turn for now. Add duration property to CardEffect later if needed.

          this.applyBuff(target, buffDef, stacksToAdd, duration);
          break;

        case 'drawCard':
           if (effect.value === undefined) {
            console.error(`Card ${card.name} has drawCard effect without value.`);
            return;
           }
           // Draw card should always affect the player currently
           if (caster.id === gameState.player.id) {
              const cardsToDraw = effect.value;
              console.log(`    ${caster.name} attempts to draw ${cardsToDraw} card(s).`);
              for (let i = 0; i < cardsToDraw; i++) {
                // Draw sets the *next* card, doesn't add to hand.
                // This effect might need redesign if cards should add directly to hand.
                this.drawCard(gameState.player);
              }
           } else {
              console.log(`    Draw card effect ignored for non-player caster ${caster.name}`);
           }
          break;

        case 'gainEnergy':
          if (effect.value === undefined) {
            console.error(`Card ${card.name} has gainEnergy effect without value.`);
            return;
           }
           // Gain energy should always affect the player currently
           if (caster.id === gameState.player.id) {
             const playerState = gameState.player;
             playerState.energy = Math.min(playerState.maxEnergy, playerState.energy + effect.value);
             console.log(`    ${playerState.name} gained ${effect.value} energy. Total: ${playerState.energy}/${playerState.maxEnergy}`);
           } else {
              console.log(`    Gain energy effect ignored for non-player caster ${caster.name}`);
           }
           break;

        default:
          console.warn(`Unknown card effect type: ${(effect as any).type}`);
      }
    });
    // --- End: Step 26 ---
  }

  /**
   * Applies a buff to a target combatant, handling stacking or adding new buffs.
   * @param target The combatant receiving the buff.
   * @param buffDef The definition of the buff to apply.
   * @param stacks The number of stacks to apply.
   * @param duration The duration (in turns) for the buff (if not permanent).
   */
  private applyBuff(
      target: CombatantState,
      buffDef: BuffDefinition,
      stacks: number,
      duration: number | 'permanent'
  ): void {
      const existingBuffIndex = target.buffs.findIndex(b => b.id === buffDef.id);

      if (existingBuffIndex !== -1) {
          // Buff exists, update stacks and potentially duration
          const existingBuff = target.buffs[existingBuffIndex];
          existingBuff.stacks += stacks;
          // Refresh duration? Rule: Reapplying usually refreshes duration.
          if (duration !== 'permanent' && existingBuff.duration !== 'permanent') {
              existingBuff.duration = Math.max(existingBuff.duration, duration); // Example: take the longer duration
          } else if (duration === 'permanent') {
               existingBuff.duration = 'permanent'; // Applying permanent overrides non-permanent
          }
          console.log(`    Updated buff ${buffDef.name} on ${target.name}. Stacks: ${existingBuff.stacks}, Duration: ${existingBuff.duration}`);
      } else {
          // Buff doesn't exist, add new one
          const newBuff: Buff = {
              ...buffDef,
              stacks: stacks,
              duration: duration,
          };
          target.buffs.push(newBuff);
          console.log(`    Applied new buff ${buffDef.name} to ${target.name}. Stacks: ${newBuff.stacks}, Duration: ${newBuff.duration}`);
      }

      // Ensure stacks don't go below 1 if it's meant to be active
      // Or handle removal if stacks <= 0? Let's handle removal in tick/cleanup logic.
      if (target.buffs[existingBuffIndex]?.stacks <= 0 && existingBuffIndex !== -1) {
          console.log(`    Buff ${buffDef.name} stacks reached 0 or below. Removing.`);
          target.buffs.splice(existingBuffIndex, 1);
      }
  }

  /**
   * Applies start-of-turn effects for a combatant's buffs.
   * Public because index.ts needs to call it for the player turn start.
   * @param combatant The combatant whose turn is starting.
   */
  applyStartOfTurnBuffs(combatant: CombatantState): void {
      console.log(`Applying start-of-turn buffs for ${combatant.name}`);
      // Example: Gain block based on a "Plated Armor" buff
      // combatant.buffs.forEach(buff => {
      //     if (buff.id === 'platedArmor' && buff.stacks > 0) {
      //         combatant.block += buff.stacks;
      //         console.log(`    ${combatant.name} gained ${buff.stacks} block from Plated Armor.`);
      //     }
      // });
      // Add more start-of-turn effects here based on buff IDs
  }

  /**
   * Applies end-of-turn effects and ticks down buff durations. Removes expired buffs.
   * @param combatant The combatant whose turn is ending.
   */
  private applyEndOfTurnBuffs(combatant: CombatantState): void {
      console.log(`Applying end-of-turn buffs/ticks for ${combatant.name}`);
      const remainingBuffs: Buff[] = [];

      combatant.buffs.forEach(buff => {
          // Apply end-of-turn damage/effects (e.g., Poison)
          // if (buff.id === 'poison' && buff.stacks > 0) {
          //     const damage = buff.stacks;
          //     combatant.hp = Math.max(0, combatant.hp - damage);
          //     console.log(`    ${combatant.name} took ${damage} damage from Poison. HP: ${combatant.hp}`);
          // }

          // Tick duration
          let keepBuff = true;
          if (buff.duration !== 'permanent') {
              buff.duration -= 1;
              if (buff.duration <= 0) {
                  console.log(`    Buff ${buff.name} expired for ${combatant.name}.`);
                  keepBuff = false;
              }
          }

          // Also remove buffs if stacks drop to 0 or below (e.g., temporary block buff used up)
          if (buff.stacks <= 0) {
             console.log(`    Buff ${buff.name} stacks depleted for ${combatant.name}.`);
             keepBuff = false;
          }


          if (keepBuff) {
              remainingBuffs.push(buff);
          }
      });

      combatant.buffs = remainingBuffs; // Update the buffs array
      console.log(`    ${combatant.name} finished end-of-turn buffs. Remaining buffs: ${combatant.buffs.length}`);

      // Reset block at end of turn (standard mechanic)
      if (combatant.block > 0) {
        console.log(`    Resetting ${combatant.name}'s block from ${combatant.block} to 0.`);
        combatant.block = 0;
      }
  }

  /**
   * Sets up the game state for the start of a new fight (e.g., next floor).
   * Selects an enemy based on the floor number and resets its state.
   * **Resets the player's deck using their full `allCards` list and shuffles it.**
   * @param gameState The current game state to modify.
   */
  startNewFight(gameState: GameState): void {
    console.log(`Starting new fight for floor ${gameState.floor}`);
    // --- Start Step 38 Implementation ---

    const availableEnemyIds = Object.keys(this.config.enemies);
    if (availableEnemyIds.length === 0) {
      console.error("Cannot start new fight: No enemies defined in config!");
      // Handle this error state appropriately, maybe revert phase or throw
      // For now, let's log and potentially stop progression
      gameState.phase = 'gameOver'; // Or some other error state
      return;
    }

    // Select an enemy based on the floor number (cycling through available enemies)
    // Subtract 1 from floor because floor is 1-based, array index is 0-based
    const enemyIndex = (gameState.floor - 1) % availableEnemyIds.length;
    const enemyIdToSpawn = availableEnemyIds[enemyIndex];
    const enemyDefinition = this.config.enemies[enemyIdToSpawn];

    if (!enemyDefinition) {
      console.error(`Cannot start new fight: Enemy definition not found for ID "${enemyIdToSpawn}"`);
      gameState.phase = 'gameOver'; // Error state
      return;
    }

    console.log(`Spawning enemy for floor ${gameState.floor}: ${enemyDefinition.name}`);

    // Create the new enemy state from the definition
    const newEnemyState: EnemyState = {
      id: enemyDefinition.id,
      name: enemyDefinition.name,
      maxHp: enemyDefinition.maxHp,
      hp: enemyDefinition.maxHp, // Start at full HP
      block: 0,                  // Reset block
      momentum: 0,               // Reset momentum
      buffs: [],                 // Reset buffs
      maxEnergy: enemyDefinition.maxEnergy,
      deck: enemyDefinition.deck.map(id => id.toLowerCase()), // Use normalized IDs
      description: enemyDefinition.description,
    };

    // Update the game state with the new enemy
    gameState.enemy = newEnemyState;

    // --- Reset Player Deck for New Fight ---
    const player = gameState.player;
    console.log(`Resetting player deck for new fight using ${player.allCards.length} cards from allCards.`);
    player.deck = [...player.allCards]; // Copy the full deck into the draw pile
    player.discard = []; // Clear the discard pile
    player.nextCard = null; // Ensure no card is pre-drawn

    // Shuffle the newly reset deck (Fisher-Yates)
    let currentIndex = player.deck.length;
    let randomIndex: number;
    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [player.deck[currentIndex], player.deck[randomIndex]] = [
        player.deck[randomIndex], player.deck[currentIndex]];
    }
    console.log(`Player deck reset and shuffled. Draw pile size: ${player.deck.length}, Discard pile size: ${player.discard.length}`);
    // --- End Player Deck Reset ---


    // Ensure player stats are also ready for the fight (some might be reset in checkCombatEnd already)
    // Note: Block, momentum, and buffs are typically reset in checkCombatEnd when the player wins.
    // Reset player energy to max at the start of a fight? (Optional game design choice)
    // gameState.player.energy = gameState.player.maxEnergy;

    console.log(`New fight started against ${gameState.enemy.name}. State updated.`);
    // --- End Step 38 Implementation ---
  }

  /**
   * Generates reward options after a fight is won.
   * Populates gameState.rewardOptions with sets of card choices.
   * @param gameState The current game state to modify.
   */
  generateRewards(gameState: GameState): void {
    console.log(`Generating rewards for floor ${gameState.floor}`);
    gameState.rewardOptions = []; // Clear previous rewards

    // 1. Get all card definitions and filter out basic cards
    const allCardIds = Object.keys(this.config.cards);
    const basicCardIds = new Set(gameConfigConstants.PLAYER_STARTING_DECK.map(id => id.toLowerCase()));
    const nonBasicCardIds = allCardIds.filter(id => !basicCardIds.has(id));

    if (nonBasicCardIds.length === 0) {
      console.warn("No non-basic cards available to generate rewards.");
      return; // Cannot generate rewards if no non-basic cards exist
    }

    // 2. Generate reward sets
    const numChoices = gameConfigConstants.REWARD_CHOICES_COUNT;
    const numSets = gameConfigConstants.REWARD_SETS;

    for (let i = 0; i < numSets; i++) {
      const rewardSet: CardDefinition[] = [];
      const availableIds = [...nonBasicCardIds]; // Copy available IDs for this set

      // Shuffle available non-basic card IDs (Fisher-Yates)
      for (let j = availableIds.length - 1; j > 0; j--) {
        const k = Math.floor(Math.random() * (j + 1));
        [availableIds[j], availableIds[k]] = [availableIds[k], availableIds[j]];
      }

      // Select the required number of cards
      const count = Math.min(numChoices, availableIds.length); // Handle cases with few non-basic cards
      for (let j = 0; j < count; j++) {
        const cardId = availableIds[j];
        const cardDef = this.config.cards[cardId];
        if (cardDef) {
          rewardSet.push(cardDef);
        } else {
          console.error(`Could not find card definition for reward ID: ${cardId}`);
        }
      }

      if (rewardSet.length > 0) {
          console.log(`Generated reward set ${i + 1}:`, rewardSet.map(c => c.name));
          gameState.rewardOptions.push(rewardSet);
      } else if (availableIds.length > 0) {
          console.warn(`Could not generate reward set ${i + 1} despite available non-basic cards.`);
      }
    }

    if (gameState.rewardOptions.length === 0 && nonBasicCardIds.length > 0) {
        console.error("Failed to generate any reward sets, though non-basic cards exist.");
    } else {
        console.log(`Generated ${gameState.rewardOptions.length} reward sets.`);
    }
  }

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
            console.error(`ERROR: Starting deck card ID "${cardId}" not found in config.cards! Check data/cards.ts and config.ts.`);
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
      deck: [...startingDeckIds], // Use normalized IDs, ensure it's a copy
      hand: [],
      discard: [],
      nextCard: null, // Will be set by 'startBattle' action's drawCard call
      allCards: [...startingDeckIds], // Initialize full deck list with starting deck
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
      phase: 'pre_battle', // Start in pre_battle phase (Changed from 'fighting')
      turn: 'player', // Player starts the turn
      player: playerState,
      enemy: enemyState,
      rewardOptions: [],
      currentRewardSet: 0,
      currency: 0, // Initialize currency
    };

    // Initial setup actions
    console.log(`Player ${playerId}: Initial deck before shuffle:`, [...initialGameState.player.deck]); // Log deck before shuffle
    this.shuffleDeck(initialGameState.player); // Shuffle the starting deck
    console.log(`Player ${playerId}: Initial deck after shuffle:`, [...initialGameState.player.deck]); // Log deck after shuffle
    // Do NOT draw the initial card here; it happens on 'startBattle'
    // this.drawCard(initialGameState.player); // <-- REMOVED

    console.log("Initial game state created (pre_battle phase)."); // Removed full state log, too verbose
    return initialGameState;
  }

  /**
   * Draws the next card for the player, shuffling the discard pile into the deck if necessary.
   * Sets the `playerState.nextCard`. Adds momentum if a shuffle occurs.
   * Implements Step 25 logic.
   * @param playerState The player state to modify.
   */
  private drawCard(playerState: PlayerState): void {
    console.log(`Attempting to draw card for player ${playerState.id}`);
    if (playerState.deck.length === 0) {
      console.log(`Deck empty for player ${playerState.id}. Shuffling discard pile.`);
      this.shuffleDeck(playerState);
      // Add momentum for shuffling
      playerState.momentum += gameConfigConstants.MOMENTUM_PER_SHUFFLE;
      console.log(`Player ${playerState.id} gained ${gameConfigConstants.MOMENTUM_PER_SHUFFLE} momentum from shuffle. Total: ${playerState.momentum}`);

      // Check if deck is still empty after shuffling (means discard was also empty)
      if (playerState.deck.length === 0) {
        console.warn(`Player ${playerState.id} has no cards left in deck or discard to draw.`);
        playerState.nextCard = null; // Ensure nextCard is null if no cards are available
        return; // Cannot draw
      }
    }

    // Draw the top card ID from the deck
    const nextCardId = playerState.deck.shift(); // Removes the first element and returns it

    if (!nextCardId) {
      // This should theoretically not happen if the length check passed, but good for safety
      console.error(`Player ${playerState.id}: Tried to draw card but ID was undefined after length check.`);
      playerState.nextCard = null;
      return;
    }

    // Find the card definition from the config using the ID
    const nextCardDefinition = this.config.cards[nextCardId]; // Assumes IDs are consistent (e.g., lowercase)

    if (!nextCardDefinition) {
      console.error(`Player ${playerState.id}: Could not find card definition for ID: ${nextCardId}`);
      playerState.nextCard = null; // Set to null if card definition is missing
      // Maybe draw the next one instead? For now, set null.
      // Recursive call removed - could lead to infinite loop if many cards are missing.
      // Let the next action attempt the draw again if needed.
      // this.drawCard(playerState); // Attempt to draw the *next* card if the current one was invalid - REMOVED
      return;
    }

    // Set the drawn card as the next card
    playerState.nextCard = nextCardDefinition;
    console.log(`Player ${playerState.id} drew next card: ${nextCardDefinition.name} (ID: ${nextCardId}). Deck size: ${playerState.deck.length}`); // Ensure this log appears and shows the correct card
  }

  /**
   * Shuffles the player's discard pile back into their deck.
   * If the discard pile is empty, it shuffles the existing deck.
   * Called when the draw pile (`playerState.deck`) is empty during combat,
   * OR during initialization to shuffle the starting deck.
   * @param playerState The player state to modify.
   */
  private shuffleDeck(playerState: PlayerState): void {
    if (playerState.discard.length === 0) {
        // Only log this if the deck isn't also empty (initialization case or error)
        if (playerState.deck.length > 0) {
            console.log(`Player ${playerState.id}: Discard pile empty. Shuffling existing draw pile (${playerState.deck.length} cards).`);
        } else {
             console.log(`Player ${playerState.id}: Discard pile and deck are empty. Cannot shuffle.`);
             return; // Cannot shuffle if both are empty
        }
    } else {
        console.log(`Player ${playerState.id}: Shuffling ${playerState.discard.length} cards from discard into deck (current deck size: ${playerState.deck.length}).`);
        // Move all cards from discard to deck
        playerState.deck = [...playerState.deck, ...playerState.discard];
        playerState.discard = []; // Clear the discard pile
    }


    // Fisher-Yates (Knuth) Shuffle algorithm
    let currentIndex = playerState.deck.length;
    let randomIndex: number;

    // While there remain elements to shuffle.
    while (currentIndex !== 0) {
        // Pick a remaining element.
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [playerState.deck[currentIndex], playerState.deck[randomIndex]] = [
        playerState.deck[randomIndex], playerState.deck[currentIndex]];
    }

    console.log(`Player ${playerState.id}: Deck shuffled. New deck size: ${playerState.deck.length}`);
  }

  // --- Add New Helper Method: checkCombatEnd ---
  /**
   * Checks if the combat should end based on player or enemy HP.
   * Updates the game state phase if combat ends. If player loses, calculates currency.
   * @param state The current game state (will be modified directly if phase changes).
   */
  private checkCombatEnd(state: GameState): void { // Returns void, modifies state directly
    // Check only if still in 'fighting' phase
    if (state.phase !== 'fighting') {
      // console.log(`Combat end check skipped, phase is ${state.phase}`); // Reduce noise
      return;
    }

    let phaseChanged = false;
    if (state.player.hp <= 0) {
      console.log(`Player ${state.player.id} defeated. Game Over.`);
      state.phase = 'gameOver';
      state.turn = 'player'; // Ensure player controls during game over screen
      // Step 41: Calculate currency on game over
      state.currency = state.floor * 10; // Example calculation
      console.log(`Game Over. Player earned ${state.currency} currency.`);
      phaseChanged = true;
    } else if (state.enemy.hp <= 0) {
      console.log(`Enemy ${state.enemy.name} defeated by ${state.player.id}. Entering reward phase.`);
      state.phase = 'reward';
      state.turn = 'player'; // Ensure player controls during reward screen
      // Reset player combat stats for next fight (or reward screen display)
      state.player.momentum = 0;
      state.player.block = 0;
      state.player.buffs = []; // Clear buffs between fights
      // --- Start Step 35 Implementation ---
      state.floor++; // Increment floor
      this.generateRewards(state); // Generate rewards (currently a placeholder)
      // --- Ensure currentRewardSet is set to 0 AFTER generating rewards ---
      state.currentRewardSet = 0; // Start reward selection from the first set
      // --- End Step 35 Implementation ---
      // Note: Future steps will handle rewards; for now, just change phase.
      phaseChanged = true;
       // Add log to show generated reward options count right after generation
      console.log(`Generated ${state.rewardOptions.length} reward sets for floor ${state.floor}. Setting currentRewardSet to 0.`);
    }

    if (phaseChanged) {
      console.log(`Combat ended. New phase: ${state.phase}, Floor: ${state.floor}`); // Updated log
      // Clear enemy buffs if player won (enemy state might be replaced later)
      if (state.phase === 'reward' && state.enemy) {
          state.enemy.buffs = [];
          state.enemy.block = 0; // Also clear enemy block
      }
    }
    // No need to return state as it's modified directly
  }
  // --- End Helper Method ---

  // --- Start: Step 32 - Enemy Turn Logic ---
  /**
   * Executes the enemy's turn based on simple logic (plays first card).
   * Modifies the provided gameState directly.
   * @param gameState The current game state.
   */
  runEnemyTurn(gameState: GameState): void {
    console.log(`Starting enemy turn for enemy: ${gameState.enemy.name}`);

    if (gameState.phase !== 'fighting') {
      console.log("Enemy turn skipped: Not in fighting phase.");
      return;
    }
    if (gameState.turn !== 'enemy') {
      console.warn("runEnemyTurn called but it's not the enemy's turn.");
      return; // Should not happen if called correctly
    }

    const enemy = gameState.enemy;
    const player = gameState.player;

    // --- Apply Start of Enemy Turn Buffs ---
    this.applyStartOfTurnBuffs(enemy);
    // Check if buffs killed the enemy
    this.checkCombatEnd(gameState);
    if (gameState.phase !== 'fighting') {
        console.log(`Enemy turn ended early due to combat ending after start-of-turn effects.`);
        return; // Don't proceed if combat ended
    }
    // --- End Apply Start of Enemy Turn Buffs ---

    // Basic Logic: Play the first card in the enemy's deck definition
    if (!enemy.deck || enemy.deck.length === 0) {
      console.log(`Enemy ${enemy.name} has no actions defined in deck. Ending turn.`);
    } else {
      const cardIdToPlay = enemy.deck[0]; // Use the first card ID
      const cardToPlay = this.config.cards[cardIdToPlay.toLowerCase()]; // Ensure lookup is normalized

      if (!cardToPlay) {
        console.error(`Enemy ${enemy.name} tried to play card with unknown ID: ${cardIdToPlay}. Ending turn.`);
      } else {
        console.log(`Enemy ${enemy.name} plays card: ${cardToPlay.name}`);
        // Apply card effects: Enemy is caster, Player is target
        this.applyCardEffects(cardToPlay, enemy, player, gameState);

        // TODO: Add more complex enemy AI later (e.g., energy, patterns, targeting)
      }
    }

    // Check if combat ended after the enemy's action
    this.checkCombatEnd(gameState);

    // Apply End-of-Turn Effects for the Enemy *before* switching turn
    if (gameState.phase === 'fighting') { // Only apply if fight continues
        this.applyEndOfTurnBuffs(enemy);
        // Check if end-of-turn effects killed the enemy
        this.checkCombatEnd(gameState);
    }

    // If combat is still ongoing, switch back to player's turn
    if (gameState.phase === 'fighting') {
      console.log(`Enemy ${enemy.name} turn ending. Switching to player turn.`);
      // Reset enemy block at end of their turn // MOVED to applyEndOfTurnBuffs
      // enemy.block = 0;
      gameState.turn = 'player';
      // TODO: Handle end-of-enemy-turn effects (buff duration ticks, etc.) if needed // DONE via applyEndOfTurnBuffs
      // NOTE: Player start-of-turn buffs are triggered in index.ts *after* this function returns
    } else {
      console.log(`Enemy turn ended, but game phase is now ${gameState.phase}. Turn remains ${gameState.turn}.`);
    }
  }
  // --- End: Step 32 ---
} 