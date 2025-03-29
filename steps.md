Phase 1: Project Setup & Server Foundation
## Step 1: Initialize Projects (Done)

**Next:** Proceed to Step 2: Configuration File (`server/src/config.ts`).

Configuration File (server/src/config.ts):
Create this file to store constants.
Define values like MAX_HP, START_ENERGY, MAX_MOMENTUM, MOMENTUM_PER_CARD, MOMENTUM_PER_ZERO_COST_CARD, MOMENTUM_PER_SHUFFLE, REWARD_CHOICES_COUNT, REWARD_SETS, ANIMATION_SPEEDS, etc.
Type Definitions (server/src/types.ts):
Define core interfaces:
CardDefinition: id, name, description, cost, image, effects (e.g., [{ type: 'damage', value: 5 }, { type: 'block', value: 3 }]).
Buff: id, name, description, image, duration (turns or permanent), stacks.
CombatantState: id, name, hp, maxHp, block, energy (player only), momentum, maxMomentum, buffs: Buff[], image (for enemy).
PlayerState extends CombatantState: deck: CardDefinition[], hand: CardDefinition[], discard: CardDefinition[], nextCard?: CardDefinition.
EnemyState extends CombatantState: actionPattern?: any (how the enemy chooses actions).
GameState: playerId, floor, player: PlayerState, enemy: EnemyState, turn: 'player' | 'enemy', phase: 'fighting' | 'reward' | 'gameOver', rewardOptions?: CardDefinition[][], currentRewardSet.
Extend GameConfig from the guide to include cards: Record<string, CardDefinition>, enemies: Record<string, Omit<EnemyState, 'hp' | 'block' | 'momentum' | 'buffs'>>, and potentially floor difficulty scaling rules.
Card & Enemy Data:
Create data files (e.g., server/src/data/cards.json, server/src/data/enemies.json) or define them directly in GameConfig. Populate with initial cards (Strike, Defend) and a basic enemy for Floor 1. Include image filenames corresponding to files in images/cards/ and images/enemies/.
Game Manager (server/src/gameManager.ts):
Implement DefaultGameManager similar to the example.
constructor(config: GameConfig): Load card/enemy definitions.
getState(playerId): Initialize GameState for a new player (Floor 1, create PlayerState with starting deck, generate first EnemyState based on floor, set phase: 'fighting', turn: 'player'). Draw initial card(s)/set next card.
Add helper methods: drawCard(playerState), shuffleDeck(playerState), applyCardEffects(card, caster, target), startNewFight(gameState), generateRewards(gameState).
Basic Server (server/src/index.ts):
Set up Express, HTTP server, and WebSocketServer as shown in the guide.
Load GameConfig. Instantiate gameManager.
wss.on('connection'): Handle register message: store ws in connections map, call gameManager.getState(playerId), send init message with full GameState and relevant GameConfig parts (like card/buff definitions for client-side display).
Implement /api/validate-action: Initially, just accept any request and return success, preparing for later logic.
Implement /api/config: Return necessary static config (card definitions, buff definitions) if not sent during init.
Implement /api/state/:playerId: Return the current GameState.
Phase 2: Client Setup & Basic Display
SDK Provider (client/src/App.tsx):
Wrap the main application component with <GamesFunProvider>.
Configure options: debug: true, gameServerUrl (pointing to your server's /api/validate-action), dev: { enabled: true }.
Game Context (client/src/context/GameContext.tsx):
Create a GameProvider component.
State: gameState: GameState | null, gameConfig: GameConfig | null, isConnected: boolean, error: string | null.
Use useGamesFun hook inside the provider to get connection.
useEffect hook dependent on connection?.privyId:
Establish WebSocket connection (ws = new WebSocket('ws://your-server-url')).
ws.onopen: Send { type: 'register', playerId: connection.privyId }.
ws.onmessage: Parse message. Handle init (set gameState, gameConfig), state_update (update gameState), error (set error state).
ws.onclose, ws.onerror: Handle connection issues.
Return cleanup function to close ws.
Provide state and potentially a sendMessage function via context value.
Main Game Component (client/src/Game.tsx):
Use useGame() (your context hook) to get gameState, gameConfig.
Use useGamesFun() to get isInitializing, connection.
Render loading/error/connection states.
If gameState, render display components.
Display Components (client/src/components/):
CombatantDisplay.tsx: Reusable component to show HP (hp/maxHp), Block ([block]), Momentum (momentum/maxMomentum). Takes combatant: CombatantState as prop. Add logic to display buffs below stats using BuffIcon.tsx.
PlayerDisplay.tsx: Uses CombatantDisplay, adds Energy display.
EnemyDisplay.tsx: Uses CombatantDisplay, adds enemy image background (images/enemies/${enemy.image}.png).
CardDisplay.tsx: Takes card: CardDefinition, isNextCard: boolean. Renders cost, name, description, background image (images/cards/${card.image || 'placeholder'}.png). Add styling for "next card" indication.
BuffIcon.tsx: Takes buff: Buff. Displays icon (images/buffs/${buff.image}.png) with tooltip/hover showing name, description, stacks/duration.
GameUI.tsx: Main layout component organizing PlayerDisplay, EnemyDisplay, the current card to be played (gameState.player.hand[0]), and the next card (gameState.player.nextCard).
Phase 3: Implementing Core Game Loop & Actions
Define Game Actions:
Client (Game.tsx): const GAME_ACTIONS = { autoPlayCard: "Play Card", endTurn: "End Turn", selectReward: "Select Reward" } as const;
Server (types.ts): Add these action names to relevant types if needed.
Server: Action Validation & Logic (gameManager.ts):
Flesh out validateAction(action: ActionRequest):
case 'autoPlayCard':
Get current GameState for action.playerId.
Check if gameState.turn === 'player'.
Check if player.hand.length > 0.
Get the card to play: card = player.hand[0].
Check if player.energy >= card.cost.
If valid:
Deduct energy: player.energy -= card.cost.
Apply card effects using applyCardEffects(card, player, enemy).
Apply "on play" buffs (like poison tick).
Add momentum: player.momentum += (card.cost === 0 ? config.MOMENTUM_PER_ZERO_COST_CARD : config.MOMENTUM_PER_CARD).
Move card from hand to discard: player.discard.push(player.hand.shift()).
Draw next card using drawCard(player). This handles deck shuffling (adding config.MOMENTUM_PER_SHUFFLE) and setting player.nextCard.
Check momentum cap: if (player.momentum >= player.maxMomentum) { player.momentum = 0; gameState.turn = 'enemy'; /* potentially trigger enemy turn */ }.
Check win/loss conditions.
Update state: this.setState(action.playerId, gameState).
Return success response.
If invalid: Return failure response with error message.
case 'endTurn': (May not be needed if momentum auto-ends turn). If implemented, switch gameState.turn, handle end-of-turn effects (buff durations, block decay).
case 'selectReward': (Implement in Phase 4).
Implement runEnemyTurn(gameState): Logic for AI to choose and play cards, update state, check momentum/win/loss, switch turn back to player. Trigger this when gameState.turn becomes 'enemy'.
Server: State Updates (index.ts):
Modify /api/validate-action: After successful gameManager.validateAction, retrieve the updated state = gameManager.getState(req.body.playerId). Broadcast this full state via WebSocket to the relevant client.
Modify WebSocket handler: When an enemy turn completes on the server, get the updated state and broadcast it.
Client: Triggering Actions (Game.tsx / GameUI.tsx):
Use useGamesFunActions(GAME_ACTIONS).
useEffect hook watching gameState:
If gameState.turn === 'player' and gameState.player.hand.length > 0:
Implement a slight delay (using setTimeout) for visual pacing.
Trigger actions.autoPlayCard({}). (Params might be empty if the server knows which card to play).
Maybe set a local isPlayerActing state to prevent multiple triggers and provide visual feedback.
Animations (client):
In CardDisplay.tsx or GameUI.tsx, use CSS transitions or a library.
When actions.autoPlayCard is triggered (or just before), apply a CSS class to the current card to animate it moving towards the enemy/player display. Reset the animation after a short duration or when the state updates.
Phase 4: Floors, Rewards, and Polish
Server: Floor Progression (gameManager.ts):
In applyCardEffects or a dedicated checkCombatEnd function: If enemy HP <= 0:
Increment gameState.floor.
Set gameState.phase = 'reward'.
Call generateRewards(gameState) to populate gameState.rewardOptions.
Set gameState.currentRewardSet = 0.
Reset player block, momentum (keep HP, buffs). Reset energy to max.
Update state.
Server: Reward Logic (gameManager.ts):
generateRewards: Select config.REWARD_CHOICES_COUNT random non-basic cards. Repeat for config.REWARD_SETS. Store in gameState.rewardOptions.
validateAction for selectReward:
Check gameState.phase === 'reward'.
Get chosen card index from action.params.cardIndex.
If cardIndex is valid (and not skipping): Add gameState.rewardOptions[gameState.currentRewardSet][cardIndex] to player.discard pile.
Increment gameState.currentRewardSet.
If gameState.currentRewardSet >= config.REWARD_SETS:
Clear rewardOptions.
Set gameState.phase = 'fighting'.
Call startNewFight(gameState) to generate the enemy for the new floor.
Draw the first card for the fight.
Update state. Return success.
Client: Reward Screen (RewardScreen.tsx):
Conditionally render this component in Game.tsx when gameState.phase === 'reward'.
Display cards from gameState.rewardOptions[gameState.currentRewardSet] using CardDisplay.
Add onClick handlers to each card to call actions.selectReward({ cardIndex: index }).
Add a "Skip Reward" button calling actions.selectReward({ cardIndex: -1 }) (or similar indicator).
Server: Game Over (gameManager.ts):
In applyCardEffects or checkCombatEnd: If player HP <= 0:
Set gameState.phase = 'gameOver'.
Calculate currency: currency = gameState.floor * 10 (or a more complex formula). Store this in gameState. (Actual awarding might involve another action or off-chain logic).
Update state.
Client: Game Over Display: Conditionally render a simple "Game Over" message in Game.tsx when gameState.phase === 'gameOver', showing gameState.floor reached and calculated currency. Add a button to potentially trigger a "start new game" action (which would reset state on the server).
Buffs/Debuffs Implementation:
Server:
Define buff logic within applyCardEffects (apply buffs), startOfTurn (e.g., gain energy buff), endOfTurn (e.g., poison damage, duration decay), onPlayCard (e.g., poison tick).
Modify CombatantState to include buffs: Buff[].
Update applyCardEffects to add/remove/stack buffs correctly.
Client: Use BuffIcon.tsx within CombatantDisplay.tsx to render active buffs based on combatant.buffs.
Refinement & Testing:
Adjust values in server/src/config.ts for balance.
Add more visual feedback for actions, buffs, damage, block gain.
Implement robust error handling for failed actions and WebSocket issues.
Test edge cases (empty deck, specific card interactions, disconnects).
Documentation: Update instructions.md describing the new files (config.ts, component files, context), the GameState structure, and the defined GAME_ACTIONS.
This plan provides a detailed roadmap. Remember to commit changes frequently and test each phase thoroughly. Good luck!