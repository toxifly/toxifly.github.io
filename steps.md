Work on the next step of the project. After you're done with a step or part of it adjust the steps.md file.
Explain how I can validate if it's working. 

# Project Steps
## Phase 3: Implementing Core Game Loop & Actions
**Step 23: Define Game Actions Constant (`client/src/Game.tsx`)**
   - Define `GAME_ACTIONS` object (e.g., `autoPlayCard`, `endTurn`, `selectReward`).

**Step 24: Server: Initial Player State (`server/src/gameManager.ts`)**
   - Implement logic within `getState` for a *new* player:
     - Initialize `Floor 1`.
     - Create `PlayerState` with starting deck (from config), max HP/Energy.
     - Generate first `EnemyState` based on Floor 1 config.
     - Set `phase: 'fighting'`, `turn: 'player'`.
     - Draw initial hand/set next card using helper methods (implement stubs first).
    - *Note:* Added temporary state initialization in `gameManager.ts` to allow `getState` to function for new players. Full initialization logic is still pending in Step 24.

**Step 25: Server: Deck Handling Helpers (`server/src/gameManager.ts`)**
   - Implement `drawCard(playerState)`: Draw from `player.deck`, handle empty deck (shuffle discard, add momentum), set `player.nextCard`.
   - Implement `shuffleDeck(playerState)`.

**Step 26: Server: Basic Card Effects (`server/src/gameManager.ts`)**
   - Implement basic `applyCardEffects` logic (e.g., deal damage, gain block).

**Step 27: Server: 'autoPlayCard' Action Validation (`server/src/gameManager.ts`)**
   - Flesh out `validateAction` for `case 'autoPlayCard'`:
     - Get current `GameState`.
     - Check turn, hand size, energy cost.

**Step 28: Server: 'autoPlayCard' Action Logic (`server/src/gameManager.ts`)**
   - If valid:
     - Deduct energy.
     - Call `applyCardEffects`.
     - Add momentum (handle zero-cost cards).
     - Move card from hand to discard.
     - Call `drawCard`.
     - Check momentum cap -> potentially switch turn.
     - Check win/loss conditions (basic HP check).
     - Update state using `this.setState`.
     - Return success.
   - If invalid: Return failure.

**Step 29: Server: State Broadcasting (`server/src/index.ts`)**
   - Modify `/api/validate-action`: After successful `gameManager.validateAction`, retrieve updated state `gameManager.getState(playerId)` and broadcast via WebSocket using the stored `ws`.

**Step 30: Client: Triggering Actions (`client/src/Game.tsx`)**
   - Use `useGamesFunActions(GAME_ACTIONS)`.
   - Add `useEffect` hook watching `gameState`.
   - If `gameState.turn === 'player'` and `hand.length > 0`:
     - Use `setTimeout` for visual delay.
     - Call `actions.autoPlayCard({})`.
     - (Optional) Set local `isPlayerActing` state.

**Step 31: Client: Basic Card Animation (`client/src/components/CardDisplay.tsx` or `GameUI.tsx`)**
   - Use CSS transitions.
   - Trigger animation when `actions.autoPlayCard` is called.

**Step 32: Server: Enemy Turn Logic (`server/src/gameManager.ts`)**
   - Implement stub `runEnemyTurn(gameState)`.
   - Trigger this when `gameState.turn` becomes `'enemy'` (e.g., after player momentum cap).
   - Basic logic: Play enemy's first card (if any), update state, check momentum/win/loss, switch turn to 'player'.

**Step 33: Server: Broadcasting After Enemy Turn (`server/src/index.ts` / `gameManager.ts`)**
   - After `runEnemyTurn` completes, get the updated state and broadcast it to the client.

**Step 34: Server: End Turn Action (Optional) (`server/src/gameManager.ts`)**
   - If implementing manual end turn: Add `validateAction` case for `'endTurn'`.
   - Logic: Switch turn, handle end-of-turn effects (buff duration, block decay).

## Phase 4: Floors, Rewards, and Polish

**Step 35: Server: Combat End Check (`server/src/gameManager.ts`)**
   - Create or modify existing check (e.g., `checkCombatEnd` called after effects).
   - If enemy HP <= 0:
     - Set `gameState.phase = 'reward'`.
     - Increment `gameState.floor`.
     - Call `generateRewards(gameState)`.
     - Set `gameState.currentRewardSet = 0`.
     - Reset player block/momentum/energy.
     - Update state.

**Step 36: Server: Reward Generation (`server/src/gameManager.ts`)**
   - Implement `generateRewards`:
     - Select random non-basic cards based on `config.REWARD_CHOICES_COUNT`.
     - Repeat for `config.REWARD_SETS`.
     - Store results in `gameState.rewardOptions`.

**Step 37: Server: 'selectReward' Action (`server/src/gameManager.ts`)**
   - Add `validateAction` case for `'selectReward'`:
     - Check `phase === 'reward'`.
     - Get chosen `cardIndex` from params.
     - If valid index: Add chosen card `rewardOptions[currentRewardSet][cardIndex]` to `player.discard`.
     - Increment `currentRewardSet`.
     - If `currentRewardSet >= config.REWARD_SETS`:
       - Clear `rewardOptions`.
       - Set `phase = 'fighting'`.
       - Call `startNewFight(gameState)`.
       - Draw first card.
     - Update state. Return success.

**Step 38: Server: Starting New Fight (`server/src/gameManager.ts`)**
   - Implement `startNewFight`:
     - Generate enemy based on `gameState.floor` and `config.enemies`.
     - Reset enemy HP/block/etc.
     - Set `gameState.enemy`.

**Step 39: Client: Reward Screen Component (`client/src/components/RewardScreen.tsx`)**
   - Create component.
   - Display cards from `gameState.rewardOptions[gameState.currentRewardSet]` using `CardDisplay`.
   - Add `onClick` handlers to call `actions.selectReward({ cardIndex: index })`.
   - Add a "Skip Reward" button (e.g., calling with `cardIndex: -1`).

**Step 40: Client: Conditional Reward Screen Rendering (`client/src/Game.tsx`)**
   - Conditionally render `RewardScreen` when `gameState.phase === 'reward'`.

**Step 41: Server: Game Over Check (`server/src/gameManager.ts`)**
   - In `checkCombatEnd` or similar: If player HP <= 0:
     - Set `gameState.phase = 'gameOver'`.
     - Calculate and store currency (e.g., `gameState.currency = floor * 10`).
     - Update state.

**Step 42: Client: Game Over Display (`client/src/Game.tsx`)**
   - Conditionally render a "Game Over" message when `phase === 'gameOver'`.
   - Show floor reached and currency.
   - (Optional) Add "New Game" button (requires server action to reset state).

**Step 43: Buffs/Debuffs - Server State (`server/src/types.ts`)**
   - Add `buffs: Buff[]` to `CombatantState`.

**Step 44: Buffs/Debuffs - Server Logic (`server/src/gameManager.ts`)**
   - Modify `applyCardEffects` to add/remove/stack buffs.
   - Implement buff triggers: start of turn, end of turn, on card play.

**Step 45: Buffs/Debuffs - Client Display (`client/src/components/CombatantDisplay.tsx`)**
   - Use `BuffIcon.tsx`