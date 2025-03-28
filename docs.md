# Project Documentation

This document provides a summary of the JavaScript files and the functions they contain.

## Project Structure

The project includes the following key folders:
- `images/` - Contains game images and visual assets
  - `cards/` - Contains card artwork and icons

## `constants.js`

Contains constant values used across the application.

### Variables

1.  **`CARD_TYPES`**
    *   **Purpose:** An object defining constant string values for different card types (`ATTACK`, `DEFENSE`, `SKILL`).
    *   **Usage:** Provides consistent identifiers for card types throughout the codebase.
2.  **`MAX_MOMENTUM`**
    *   **Purpose:** Defines the maximum momentum a player can accumulate (currently 10). Reaching this value ends the player's turn.
3.  **`MOMENTUM_GAIN_ZERO_COST`**
    *   **Purpose:** Defines the amount of momentum gained from playing a 0-cost card (currently 2).
4.  **`MOMENTUM_GAIN_DEFAULT`**
    *   **Purpose:** Defines the amount of momentum gained from playing a 1 or 2-cost card (currently 1).
5.  **`NUM_REWARD_CHOICES`**
    *   **Purpose:** The number of card options presented to the player after winning a battle. Default: `4`.
6.  **`NUM_REWARD_PICKS`**
    *   **Purpose:** The maximum number of cards the player can select from the offered reward choices. Default: `2`.

## `utils.js`

Contains general utility functions used throughout the application.

### Functions

1.  **`shuffleArray(array)`**
    *   **Purpose:** Randomly shuffles the elements of an array in place using the Fisher-Yates (Knuth) algorithm.
    *   **Input:** `array` (Array) - The array to be shuffled.
    *   **Output:** (Array) - The same array instance, now shuffled.
    *   **Side Effects:** Modifies the input array directly. Logs the start of the shuffling process.

2.  **`delay(ms)`**
    *   **Purpose:** Creates a pause in execution for a specified duration. Useful for animations or pacing.
    *   **Input:** `ms` (Number) - The duration of the delay in milliseconds.
    *   **Output:** (Promise) - A Promise that resolves after the specified `ms` have passed.

## `ui.js`

Handles all interactions with the Document Object Model (DOM), updating the user interface based on the game state.

### Variables

1.  **`elements`**
    *   **Purpose:** An object containing references to various DOM elements, obtained using `document.getElementById`. Includes references for player/enemy stats, hand, log, buttons, game over/reward/deck screens, **and player momentum display (`playerMomentum`, `playerMaxMomentum`)**.

### Functions

1.  **`createCardElement(cardTemplate)`**
    *   **Purpose:** Creates a DOM element (`div`) representing a game card based on its template.
    *   **Input:** `cardTemplate` (Object) - An object containing card details like `id`, `name`, `cost`, `description`, and `type`.
    *   **Output:** (HTMLElement) - A `div` element styled and populated with the card's information.
    *   **Side Effects:** Logs the creation of the card element.

2.  **`updatePlayerHandUI(hand)`**
    *   **Purpose:** Updates the player's hand display area in the UI, clearing the previous hand and rendering the new cards.
    *   **Input:** `hand` (Array) - An array of card IDs representing the cards currently in the player's hand.
    *   **Output:** None.
    *   **Side Effects:** Modifies the `innerHTML` of the `elements.playerHand` element. Logs the update process and any errors if card templates are not found.

3.  **`updateStatsUI(player, enemy)`**
    *   **Purpose:** Updates the displayed stats (HP, Energy, Block, **Momentum**) for both the player and the enemy.
    *   **Input:**
        *   `player` (Object) - The player object containing stats like `hp`, `maxHp`, `block`, `energy`, `maxEnergy`, **`momentum`**.
        *   `enemy` (Object, optional) - The enemy object containing similar stats. If not provided, enemy stats display is cleared.
    *   **Output:** None.
    *   **Side Effects:** Modifies the `textContent` of various stat display elements (`elements.playerHp`, `elements.playerEnergy`, `elements.playerMomentum`, `elements.enemyHp`, etc.). Logs the update process.

4.  **`updateFloorInfoUI(floor)`**
    *   **Purpose:** Updates the display showing the current floor number.
    *   **Input:** `floor` (Number) - The current floor number.
    *   **Output:** None.
    *   **Side Effects:** Modifies the `textContent` of the `elements.floorInfo` element. Logs the update.

5.  **`logMessage(message, type = 'system')`**
    *   **Purpose:** Adds a message to the game's log area.
    *   **Input:**
        *   `message` (String) - The text to be logged.
        *   `type` (String, optional, default: `'system'`) - A type string (e.g., 'player', 'enemy', 'system') used for styling the log entry.
    *   **Output:** None.
    *   **Side Effects:** Appends a new `div` element to `elements.logContainer` and scrolls the container to the bottom. Logs the addition of the message.

6.  **`clearLog()`**
    *   **Purpose:** Clears all messages from the game log area.
    *   **Input:** None.
    *   **Output:** None.
    *   **Side Effects:** Sets the `innerHTML` of `elements.logContainer` to an empty string. Logs the clearing action.

7.  **`showDamageEffect(targetElement, damage)`**
    *   **Purpose:** Creates a visual effect (shake, flash, floating text) on a target element to indicate damage.
    *   **Input:**
        *   `targetElement` (HTMLElement) - The DOM element representing the entity taking damage (e.g., `elements.player` or `elements.enemy`).
        *   `damage` (Number) - The amount of damage taken.
    *   **Output:** None.
    *   **Side Effects:** Adds/removes CSS classes for animation, creates temporary floating text elements in the `document.body`. Logs the effect being shown.

8.  **`showHealEffect(targetElement, amount)`**
    *   **Purpose:** Creates a visual effect (floating text) on a target element to indicate healing.
    *   **Input:**
        *   `targetElement` (HTMLElement) - The DOM element representing the entity being healed.
        *   `amount` (Number) - The amount of health restored.
    *   **Output:** None.
    *   **Side Effects:** Creates temporary floating text elements in the `document.body`. Logs the effect being shown.

9.  **`animateCardPlay(cardId, cardTemplate, sourceIsPlayer)`**
    *   **Purpose:** Animates a card being played, potentially removing it from the player's hand display and showing a floating card name effect.
    *   **Input:**
        *   `cardId` (String) - The unique ID of the card being played.
        *   `cardTemplate` (Object) - The template object for the card being played.
        *   `sourceIsPlayer` (Boolean) - `true` if the player played the card, `false` if the enemy played it.
    *   **Output:** None.
    *   **Side Effects:** If `sourceIsPlayer` is true, finds the corresponding card element in the hand, applies animation classes, and removes it after a delay. Creates a temporary floating card name element in `document.body`. Logs the animation process.

10. **`getCardTypeColor(type)`**
    *   **Purpose:** Returns a hex color code based on the card type.
    *   **Input:** `type` (String) - The type of the card (e.g., `CARD_TYPES.ATTACK`).
    *   **Output:** (String) - A hex color code string (e.g., `#ff5555`).

11. **`showMomentumBurstEffect()`**
    *   **Purpose:** Creates a temporary visual effect (centered image fade-in/out) to indicate that maximum momentum has been reached and the turn is ending.
    *   **Input:** None.
    *   **Output:** None.
    *   **Side Effects:** Creates and removes a temporary `div` containing an `img` element (`/images/momentum-burst.png`) in the `document.body`. Logs the effect being shown.

12. **`showRewardUI(rewardCardIds, currentPickNum, totalPicks, onRewardChosen)`**
    *   **Purpose:** Displays the reward screen as a modal overlay for a single pick stage. Allows the player to choose *one* card from the selection or skip the current pick.
    *   **Input:**
        *   `rewardCardIds` (Array) - An array of card IDs offered for this specific pick stage.
        *   `currentPickNum` (Number) - The number of the current pick stage (e.g., 1 for the first pick).
        *   `totalPicks` (Number) - The total number of picks allowed in the reward phase.
        *   `onRewardChosen` (Function) - A callback function executed when the player makes a choice (clicks a card or the skip button). It receives the chosen card ID (or `null` if skipped) as an argument for this single pick.
    *   **Output:** None.
    *   **Side Effects:** Makes `elements.rewardContainer` visible with modal styling. Updates title/info text. Populates `elements.rewardOptions` with card elements and a skip button for the current stage. Adds event listeners. Hides the modal and executes the callback upon choice.

13. **`showGameOverUI(victory, floor)`**
    *   **Purpose:** Displays the game over screen with a victory or defeat message.
    *   **Input:**
        *   `victory` (Boolean) - `true` if the player won, `false` otherwise.
        *   `floor` (Number) - The floor number reached by the player.
    *   **Output:** None.
    *   **Side Effects:** Makes the `elements.gameOver` element visible, updates the message, and disables battle/navigation buttons. Logs the UI display.

14. **`hideGameOverUI()`**
    *   **Purpose:** Hides the game over screen.
    *   **Input:** None.
    *   **Output:** None.
    *   **Side Effects:** Hides the `elements.gameOver` element. Logs the UI hiding action.

15. **`showDeckUI(player)`**
    *   **Purpose:** Displays the deck view/builder screen.
    *   **Input:** `player` (Object) - The player object, needed to display the deck and stats.
    *   **Output:** None.
    *   **Side Effects:** Makes the `elements.deckBuilder` element visible and calls `updateDeckViewUI` to populate it. Logs the UI display.

16. **`hideDeckUI()`**
    *   **Purpose:** Hides the deck view/builder screen.
    *   **Input:** None.
    *   **Output:** None.
    *   **Side Effects:** Hides the `elements.deckBuilder` element. Logs the UI hiding action.

17. **`updateDeckViewUI(player)`**
    *   **Purpose:** Updates the content of the deck view screen, displaying player stats, deck statistics, and the cards in the deck.
    *   **Input:** `player` (Object) - The player object containing the deck and stats.
    *   **Output:** None.
    *   **Side Effects:** Clears and repopulates `elements.deckGrid`, `elements.deckStats`, and `elements.playerStats`. Groups identical cards and displays counts. Sorts cards for display. Logs the update process.

18. **`startRewardPhase()`**
    *   **Purpose:** Initializes the sequential reward picking process after a battle win. Resets the pick counter and calls `presentSingleRewardChoice` for the first pick.
    *   **Input:** None.
    *   **Output:** None.
    *   **Side Effects:** Resets `this.rewardPicksMade`, calls `presentSingleRewardChoice`.

19. **`presentSingleRewardChoice()`**
    *   **Purpose:** Generates a set of `NUM_REWARD_CHOICES` card options for the current reward pick stage and displays them using `UI.showRewardUI`.
    *   **Input:** None.
    *   **Output:** None.
    *   **Side Effects:** Calls `shuffleArray`, `getCardTemplate`, `UI.showRewardUI`.

20. **`handleSingleRewardChoice(chosenCardId)`**
    *   **Purpose:** Callback executed after the player makes a choice for a single reward pick stage. Adds the card to the deck (if chosen), logs the action, increments the pick counter. If more picks remain, calls `presentSingleRewardChoice` again; otherwise, calls `nextFloor`.
    *   **Input:** `chosenCardId` (String | null) - The ID of the chosen card for this stage, or `null` if skipped.
    *   **Output:** None.
    *   **Side Effects:** Modifies `player.deck`, logs choice, increments `this.rewardPicksMade`, potentially calls `presentSingleRewardChoice` or `nextFloor`.

21. **`nextFloor()`**
    *   **Purpose:** Advances the game to the next floor. Called automatically after the entire reward phase (all picks made/skipped). Hides reward UI, disables 'Next Floor' button, increments floor count, heals player, generates enemy, updates UI, enables battle start button.
    *   **Input:** None.
    *   **Output:** None.
    *   **Side Effects:** Hides reward UI, disables `elements.nextFloorBtn`, increments `currentFloor`, modifies `player.hp`, calls `generateEnemy`, updates UI (floor info, stats, buttons), shows heal effect, logs floor progression, enables `elements.startBattleBtn`.

## `game.js`

Manages the core game logic, state, and flow for the Card Battler game. It integrates functionalities from `utils.js`, `ui.js`, `cards.js`, and `enemies.js`.

### Class: `CardBattler`

The main class orchestrating the game.

#### Momentum Mechanic

*   **Momentum** is a resource gained by playing cards.
*   Playing 0-cost cards grants 2 Momentum.
*   Playing 1 or 2-cost cards grants 1 Momentum.
*   Momentum resets to 0 at the start of each player turn.
*   If Momentum reaches `MAX_MOMENTUM` (10), the player's turn immediately ends after the current card resolves, and a visual effect is shown.
*   Certain cards can **spend** Momentum for additional effects. This spending is usually mandatory if the card specifies it and the player has sufficient Momentum.

#### Properties

*   `player`: (Object) Stores the player's current state (HP, energy, deck, hand, **momentum**, etc.).
*   `enemy`: (Object) Stores the current enemy's state.
*   `currentFloor`: (Number) Tracks the current floor number.
*   `inBattle`: (Boolean) Flag indicating if a battle is currently active.
*   `battleTurn`: (Number) Tracks the current turn number within a battle.

#### Methods

1.  **`constructor()`**
    *   **Purpose:** Initializes the game instance, sets up initial state properties (including `player.momentum = 0`), binds UI event listeners, and starts a new game.
    *   **Input:** None.
    *   **Output:** None.
    *   **Side Effects:** Creates player/enemy objects, sets floor, binds listeners, calls `setUpNewGame`. Logs initialization steps.

2.  **`setUpNewGame()`**
    *   **Purpose:** Resets the game to its starting state for a new game. Initializes player stats (including `momentum = 0`), deck, generates the first enemy, updates UI elements, and clears the log.
    *   **Input:** None.
    *   **Output:** None.
    *   **Side Effects:** Resets `player`, `currentFloor`, generates `enemy`, updates UI (`floorInfo`, stats, buttons, log), hides game over/deck UI. Logs setup process.

3.  **`generateEnemy()`**
    *   **Purpose:** Creates a new enemy appropriate for the `currentFloor` using `generateEnemyForFloor` from `enemies.js`.
    *   **Input:** None.
    *   **Output:** None.
    *   **Side Effects:** Updates the `this.enemy` property, updates the enemy name and stats in the UI. Logs enemy generation.

4.  **`startBattle()`**
    *   **Purpose:** Initiates a battle sequence against the current enemy. Resets battle-specific player and enemy states (hand, draw pile, block, energy, status effects, **momentum**).
    *   **Input:** None.
    *   **Output:** None.
    *   **Side Effects:** Sets `inBattle` to `true`, resets `battleTurn`, shuffles decks, resets block/energy/status/**momentum**, updates UI (disables buttons), calls `startPlayerTurn`. Logs battle start.

5.  **`startPlayerTurn()`**
    *   **Purpose:** Begins the player's turn. Increments turn counter, resets player block, energy, **and momentum**, handles start-of-turn effects, draws cards, updates UI, and schedules the automated player action.
    *   **Input:** None.
    *   **Output:** None.
    *   **Side Effects:** Modifies player state (block, energy, **momentum**, status effects, hand, draw/discard piles), updates UI, logs turn start and effects, calls `drawCard`, schedules `playPlayerTurn`.

6.  **`playPlayerTurn()`**
    *   **Purpose:** Simulates the player's turn using a simple AI. Finds a playable card, plays it (spends energy, potentially spends momentum via card effect, updates state, triggers effects, animates), increases momentum based on card cost, checks if momentum cap is reached (ending turn if so), and schedules the next action or ends the turn if no cards are playable.
    *   **Input:** None.
    *   **Output:** (Promise) Resolves when the action (playing a card or deciding to end turn) is complete.
    *   **Side Effects:** Modifies player/enemy state (energy, **momentum**, hand, discard pile, HP, block), calls card effects, updates UI, animates card play, logs actions, potentially calls `UI.showMomentumBurstEffect` and `endPlayerTurn` early, schedules itself recursively or calls `endPlayerTurn`.

7.  **`endPlayerTurn()`**
    *   **Purpose:** Concludes the player's turn. **Previously discarded the player's hand, but now retains cards in hand.** Schedules the enemy's turn.
    *   **Input:** None.
    *   **Output:** None.
    *   **Side Effects:** Updates UI, logs turn end, schedules `startEnemyTurn`. **Does NOT modify player's hand anymore.**

8.  **`startEnemyTurn()`**
    *   **Purpose:** Begins the enemy's turn. Resets enemy block and energy, handles start-of-turn effects, draws cards (internally, no UI), updates stats, and schedules the enemy's action.
    *   **Input:** None.
    *   **Output:** None.
    *   **Side Effects:** Modifies enemy state (block, energy, status effects, hand, draw/discard piles), updates UI stats, logs turn start and effects, schedules `playEnemyTurn`.

9.  **`playEnemyTurn()`**
    *   **Purpose:** Simulates the enemy's turn using a simple AI. Finds the first playable card, plays it (updates state, triggers effects, animates minimally), and schedules the next action or ends the turn.
    *   **Input:** None.
    *   **Output:** (Promise) Resolves when the action (playing a card or deciding to end turn) is complete.
    *   **Side Effects:** Modifies enemy state (energy, hand, discard pile), calls card effects, updates UI, animates card play (name only), logs actions, schedules itself recursively or calls `endEnemyTurn`.

10. **`drawCard()`**
    *   **Purpose:** Draws a single card for the player from their draw pile into their hand. Handles reshuffling the discard pile if the draw pile is empty. **Respects the maximum hand size limit, burning the drawn card (moving it directly to discard) if the hand is already full.**
    *   **Input:** None.
    *   **Output:** None.
    *   **Side Effects:** Modifies player state (hand, draw pile, discard pile). Logs reshuffling and card burning.

11. **`dealDamage(source, target, amount, ignoreBlock = false)`**
    *   **Purpose:** Calculates and applies damage from a source entity to a target entity. Considers strength, vulnerability, and block (unless ignored). Triggers visual effects and checks for lethal damage.
    *   **Input:**
        *   `source` (Object) - The entity dealing damage.
        *   `target` (Object) - The entity receiving damage.
        *   `amount` (Number) - The base damage amount.
        *   `ignoreBlock` (Boolean, optional, default: `false`) - If `true`, block is not applied.
    *   **Output:** (Boolean) - `true` if the target was defeated, `false` otherwise.
    *   **Side Effects:** Modifies target's `hp` and `block`, updates UI stats, shows damage effect, logs damage dealt/blocked, calls `enemyDefeated` or `gameOver` if lethal.

12. **`enemyDefeated()`**
    *   **Purpose:** Handles the logic when an enemy is defeated. Ends the battle state, logs the victory message, checks for game win condition (max floor reached), or shows the reward screen and enables progression.
    *   **Input:** None.
    *   **Output:** None.
    *   **Side Effects:** Sets `inBattle` to `false`, updates UI (stats, enables buttons), logs defeat, calls `gameOver` or `showReward`.

13. **`showReward()`**
    *   **Purpose:** Generates card reward options based on rarity and floor number, then displays the reward UI.
    *   **Input:** None.
    *   **Output:** None.
    *   **Side Effects:** Calls `UI.showRewardUI` with generated card IDs and the `handleRewardChoice` callback. Logs reward generation steps.

14. **`handleRewardChoice(chosenCardIds)`**
    *   **Purpose:** Callback function executed after the player finalizes their reward selection via the UI. Adds the chosen cards (if any) to the player's deck. Automatically proceeds to the next floor.
    *   **Input:** `chosenCardIds` (Array) - An array containing the IDs of the chosen cards (empty if skipped).
    *   **Output:** None.
    *   **Side Effects:** Modifies `player.deck` if cards were chosen, logs the choices, calls `nextFloor()`.

15. **`nextFloor()`**
    *   **Purpose:** Advances the game to the next floor. Called automatically after reward selection/skip. Disables the 'Next Floor' button, increments floor count, heals the player slightly, generates a new enemy, updates UI, and enables the battle start button.
    *   **Input:** None.
    *   **Output:** None.
    *   **Side Effects:** Disables `elements.nextFloorBtn`, increments `currentFloor`, modifies `player.hp`, calls `generateEnemy`, updates UI (floor info, stats, buttons), shows heal effect, logs floor progression.

16. **`gameOver(victory)`**
    *   **Purpose:** Ends the current game session, displaying either a victory or defeat message on the game over screen. Disables game interaction buttons.
    *   **Input:** `victory` (Boolean) - `true` if the player won, `false` otherwise.
    *   **Output:** None.
    *   **Side Effects:** Sets `inBattle` to `false`, calls `UI.showGameOverUI`, logs game over message, disables UI buttons.

17. **`restart()`**
    *   **Purpose:** Resets the game to the initial state by calling `setUpNewGame`.
    *   **Input:** None.
    *   **Output:** None.
    *   **Side Effects:** Calls `setUpNewGame`. Logs restart.

18. **`viewDeck()`**
    *   **Purpose:** Displays the deck view/builder screen.
    *   **Input:** None.
    *   **Output:** None.
    *   **Side Effects:** Calls `UI.showDeckUI`. Logs action.

19. **`hideViewDeck()`**
    *   **Purpose:** Hides the deck view/builder screen.
    *   **Input:** None.
    *   **Output:** None.
    *   **Side Effects:** Calls `UI.hideDeckUI`. Logs action.

20. **`updateUI()`**
    *   **Purpose:** Convenience method to update both the stats display and the player's hand display in the UI.
    *   **Input:** None.
    *   **Output:** None.
    *   **Side Effects:** Calls `updateStats` and `UI.updatePlayerHandUI`.

21. **`updateStats()`**
    *   **Purpose:** Updates the player and enemy stat displays (HP, Energy, Block, **Momentum**, etc.) in the UI.
    *   **Input:** None.
    *   **Output:** None.
    *   **Side Effects:** Calls `UI.updateStatsUI`.

22. **`log(message, type = 'system')`**
    *   **Purpose:** Adds a message to the in-game log display area using the UI module.
    *   **Input:**
        *   `message` (String) - The text to log.
        *   `type` (String, optional, default: `'system'`) - Type for styling (e.g., 'player', 'enemy').
    *   **Output:** None.
    *   **Side Effects:** Calls `UI.logMessage`.

23. **`generateRewards()`**
    *   **Purpose:** Generates reward options after a battle is won. Selects `NUM_REWARD_CHOICES` unique, non-starter cards and displays them using `UI.showRewardUI`, allowing `NUM_REWARD_PICKS`.
    *   **Input:** None.
    *   **Output:** None.
    *   **Side Effects:** Logs the reward generation process, calls `UI.showRewardUI`.

## `enemies.js`

Defines enemy templates and logic for generating enemies based on game progression.

### Variables

1.  **`ENEMIES`**
    *   **Purpose:** An array of template objects, each defining a base enemy type. Includes properties like `id`, `name`, `hp`, `maxHp`, `