# Project Documentation

This document provides a summary of the JavaScript files and the functions they contain.

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
    *   **Purpose:** An object containing references to various DOM elements, obtained using `document.getElementById`. This provides a central place to access UI elements.

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
    *   **Purpose:** Updates the displayed stats (HP, Energy, Block) for both the player and the enemy.
    *   **Input:**
        *   `player` (Object) - The player object containing stats like `hp`, `maxHp`, `block`, `energy`, `maxEnergy`.
        *   `enemy` (Object, optional) - The enemy object containing similar stats. If not provided, enemy stats display is cleared.
    *   **Output:** None.
    *   **Side Effects:** Modifies the `textContent` of various stat display elements (`elements.playerHp`, `elements.playerEnergy`, `elements.enemyHp`, etc.). Logs the update process.

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

11. **`showRewardUI(rewardCardIds, onRewardChosen)`**
    *   **Purpose:** Displays the reward screen, allowing the player to choose one card from a selection or skip the reward.
    *   **Input:**
        *   `rewardCardIds` (Array) - An array of card IDs offered as rewards.
        *   `onRewardChosen` (Function) - A callback function that is executed when the player makes a choice. It receives the chosen card ID (or `null` if skipped) as an argument.
    *   **Output:** None.
    *   **Side Effects:** Makes the `elements.rewardContainer` visible, populates `elements.rewardOptions` with card elements and a skip button, and adds event listeners to them. Logs the UI display process and the choice made.

12. **`showGameOverUI(victory, floor)`**
    *   **Purpose:** Displays the game over screen with a victory or defeat message.
    *   **Input:**
        *   `victory` (Boolean) - `true` if the player won, `false` otherwise.
        *   `floor` (Number) - The floor number reached by the player.
    *   **Output:** None.
    *   **Side Effects:** Makes the `elements.gameOver` element visible, updates the message, and disables battle/navigation buttons. Logs the UI display.

13. **`hideGameOverUI()`**
    *   **Purpose:** Hides the game over screen.
    *   **Input:** None.
    *   **Output:** None.
    *   **Side Effects:** Hides the `elements.gameOver` element. Logs the UI hiding action.

14. **`showDeckUI(player)`**
    *   **Purpose:** Displays the deck view/builder screen.
    *   **Input:** `player` (Object) - The player object, needed to display the deck and stats.
    *   **Output:** None.
    *   **Side Effects:** Makes the `elements.deckBuilder` element visible and calls `updateDeckViewUI` to populate it. Logs the UI display.

15. **`hideDeckUI()`**
    *   **Purpose:** Hides the deck view/builder screen.
    *   **Input:** None.
    *   **Output:** None.
    *   **Side Effects:** Hides the `elements.deckBuilder` element. Logs the UI hiding action.

16. **`updateDeckViewUI(player)`**
    *   **Purpose:** Updates the content of the deck view screen, displaying player stats, deck statistics, and the cards in the deck.
    *   **Input:** `player` (Object) - The player object containing the deck and stats.
    *   **Output:** None.
    *   **Side Effects:** Clears and repopulates `elements.deckGrid`, `elements.deckStats`, and `elements.playerStats`. Groups identical cards and displays counts. Sorts cards for display. Logs the update process.

## `game.js`

Manages the core game logic, state, and flow for the Card Battler game. It integrates functionalities from `utils.js`, `ui.js`, `cards.js`, and `enemies.js`.

### Class: `CardBattler`

The main class orchestrating the game.

#### Properties

*   `player`: (Object) Stores the player's current state (HP, energy, deck, hand, etc.).
*   `enemy`: (Object) Stores the current enemy's state.
*   `currentFloor`: (Number) Tracks the current floor number.
*   `inBattle`: (Boolean) Flag indicating if a battle is currently active.
*   `battleTurn`: (Number) Tracks the current turn number within a battle.

#### Methods

1.  **`constructor()`**
    *   **Purpose:** Initializes the game instance, sets up initial state properties, binds UI event listeners, and starts a new game.
    *   **Input:** None.
    *   **Output:** None.
    *   **Side Effects:** Creates player/enemy objects, sets floor, binds listeners, calls `setUpNewGame`. Logs initialization steps.

2.  **`setUpNewGame()`**
    *   **Purpose:** Resets the game to its starting state for a new game. Initializes player stats, deck, generates the first enemy, updates UI elements, and clears the log.
    *   **Input:** None.
    *   **Output:** None.
    *   **Side Effects:** Resets `player`, `currentFloor`, generates `enemy`, updates UI (`floorInfo`, stats, buttons, log), hides game over/deck UI. Logs setup process.

3.  **`generateEnemy()`**
    *   **Purpose:** Creates a new enemy appropriate for the `currentFloor` using `generateEnemyForFloor` from `enemies.js`.
    *   **Input:** None.
    *   **Output:** None.
    *   **Side Effects:** Updates the `this.enemy` property, updates the enemy name and stats in the UI. Logs enemy generation.

4.  **`startBattle()`**
    *   **Purpose:** Initiates a battle sequence against the current enemy. Resets battle-specific player and enemy states (hand, draw pile, block, energy, status effects).
    *   **Input:** None.
    *   **Output:** None.
    *   **Side Effects:** Sets `inBattle` to `true`, resets `battleTurn`, shuffles decks, resets block/energy/status, updates UI (disables buttons), calls `startPlayerTurn`. Logs battle start.

5.  **`startPlayerTurn()`**
    *   **Purpose:** Begins the player's turn. Increments turn counter, resets player block and energy, handles start-of-turn effects (Berserk damage, Vulnerable countdown), draws cards, updates UI, and schedules the automated player action.
    *   **Input:** None.
    *   **Output:** None.
    *   **Side Effects:** Modifies player state (block, energy, status effects, hand, draw/discard piles), updates UI, logs turn start and effects, calls `drawCard`, schedules `playPlayerTurn`.

6.  **`playPlayerTurn()`**
    *   **Purpose:** Simulates the player's turn using a simple AI. Finds the first playable card, plays it (updates state, triggers effects, animates), and schedules the next action or ends the turn if no cards are playable.
    *   **Input:** None.
    *   **Output:** (Promise) Resolves when the action (playing a card or deciding to end turn) is complete.
    *   **Side Effects:** Modifies player state (energy, hand, discard pile), calls card effects, updates UI, animates card play, logs actions, schedules itself recursively or calls `endPlayerTurn`.

7.  **`endPlayerTurn()`**
    *   **Purpose:** Concludes the player's turn. Discards the player's hand and schedules the enemy's turn.
    *   **Input:** None.
    *   **Output:** None.
    *   **Side Effects:** Moves cards from player's hand to discard pile, updates UI, logs turn end, schedules `startEnemyTurn`.

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

10. **`endEnemyTurn()`**
    *   **Purpose:** Concludes the enemy's turn. Discards the enemy's hand (internally) and schedules the player's next turn.
    *   **Input:** None.
    *   **Output:** None.
    *   **Side Effects:** Moves cards from enemy's hand to discard pile, updates UI stats, logs turn end, schedules `startPlayerTurn`.

11. **`drawCard()`**
    *   **Purpose:** Draws a single card for the player from their draw pile into their hand. Handles reshuffling the discard pile if the draw pile is empty and respects the maximum hand size limit (burning cards if full).
    *   **Input:** None.
    *   **Output:** None.
    *   **Side Effects:** Modifies player state (hand, draw pile, discard pile). Logs reshuffling and card burning.

12. **`dealDamage(source, target, amount, ignoreBlock = false)`**
    *   **Purpose:** Calculates and applies damage from a source entity to a target entity. Considers strength, vulnerability, and block (unless ignored). Triggers visual effects and checks for lethal damage.
    *   **Input:**
        *   `source` (Object) - The entity dealing damage.
        *   `target` (Object) - The entity receiving damage.
        *   `amount` (Number) - The base damage amount.
        *   `ignoreBlock` (Boolean, optional, default: `false`) - If `true`, block is not applied.
    *   **Output:** (Boolean) - `true` if the target was defeated, `false` otherwise.
    *   **Side Effects:** Modifies target's `hp` and `block`, updates UI stats, shows damage effect, logs damage dealt/blocked, calls `enemyDefeated` or `gameOver` if lethal.

13. **`enemyDefeated()`**
    *   **Purpose:** Handles the logic when an enemy is defeated. Ends the battle state, logs the victory message, checks for game win condition (max floor reached), or shows the reward screen and enables progression.
    *   **Input:** None.
    *   **Output:** None.
    *   **Side Effects:** Sets `inBattle` to `false`, updates UI (stats, enables buttons), logs defeat, calls `gameOver` or `showReward`.

14. **`showReward()`**
    *   **Purpose:** Generates card reward options based on rarity and floor number, then displays the reward UI.
    *   **Input:** None.
    *   **Output:** None.
    *   **Side Effects:** Calls `UI.showRewardUI` with generated card IDs and the `handleRewardChoice` callback. Logs reward generation steps.

15. **`handleRewardChoice(chosenCardId)`**
    *   **Purpose:** Callback function executed when the player selects a reward card or skips. Adds the chosen card to the player's deck or logs the skip.
    *   **Input:** `chosenCardId` (String | null) - The ID of the chosen card, or `null` if skipped.
    *   **Output:** None.
    *   **Side Effects:** Modifies `player.deck` if a card is chosen, logs the choice.

16. **`nextFloor()`**
    *   **Purpose:** Advances the game to the next floor. Heals the player slightly, generates a new enemy, updates UI, and enables the battle start button.
    *   **Input:** None.
    *   **Output:** None.
    *   **Side Effects:** Increments `currentFloor`, modifies `player.hp`, calls `generateEnemy`, updates UI (floor info, stats, buttons), shows heal effect, logs floor progression.

17. **`gameOver(victory)`**
    *   **Purpose:** Ends the current game session, displaying either a victory or defeat message on the game over screen. Disables game interaction buttons.
    *   **Input:** `victory` (Boolean) - `true` if the player won, `false` otherwise.
    *   **Output:** None.
    *   **Side Effects:** Sets `inBattle` to `false`, calls `UI.showGameOverUI`, logs game over message, disables UI buttons.

18. **`restart()`**
    *   **Purpose:** Resets the game to the initial state by calling `setUpNewGame`.
    *   **Input:** None.
    *   **Output:** None.
    *   **Side Effects:** Calls `setUpNewGame`. Logs restart.

19. **`viewDeck()`**
    *   **Purpose:** Displays the deck view/builder screen.
    *   **Input:** None.
    *   **Output:** None.
    *   **Side Effects:** Calls `UI.showDeckUI`. Logs action.

20. **`hideViewDeck()`**
    *   **Purpose:** Hides the deck view/builder screen.
    *   **Input:** None.
    *   **Output:** None.
    *   **Side Effects:** Calls `UI.hideDeckUI`. Logs action.

21. **`updateUI()`**
    *   **Purpose:** Convenience method to update both the stats display and the player's hand display in the UI.
    *   **Input:** None.
    *   **Output:** None.
    *   **Side Effects:** Calls `updateStats` and `UI.updatePlayerHandUI`.

22. **`updateStats()`**
    *   **Purpose:** Updates the player and enemy stat displays (HP, Energy, Block, etc.) in the UI.
    *   **Input:** None.
    *   **Output:** None.
    *   **Side Effects:** Calls `UI.updateStatsUI`.

23. **`log(message, type = 'system')`**
    *   **Purpose:** Adds a message to the in-game log display area using the UI module.
    *   **Input:**
        *   `message` (String) - The text to log.
        *   `type` (String, optional, default: `'system'`) - Type for styling (e.g., 'player', 'enemy').
    *   **Output:** None.
    *   **Side Effects:** Calls `UI.logMessage`.

## `constants.js`

Contains constant values used across the application.

### Variables

1.  **`CARD_TYPES`**
    *   **Purpose:** An object defining constant string values for different card types (`ATTACK`, `DEFENSE`, `SKILL`).
    *   **Usage:** Provides consistent identifiers for card types throughout the codebase.

## `enemies.js`

Defines enemy templates and logic for generating enemies based on game progression.

### Variables

1.  **`ENEMIES`**
    *   **Purpose:** An array of template objects, each defining a base enemy type. Includes properties like `id`, `name`, `hp`, `maxHp`, `energy`, `deck`, and `difficulty`.

### Functions

1.  **`generateEnemyForFloor(currentFloor)`**
    *   **Purpose:** Selects an appropriate enemy template based on the `currentFloor` and its difficulty, scales its stats (like HP) based on the floor, potentially adds extra cards to its deck on higher floors, and initializes its battle state properties (hand, piles, block, status effects).
    *   **Input:** `currentFloor` (Number) - The current floor number in the game.
    *   **Output:** (Object) - A new enemy object, based on a template but scaled and initialized for the current battle.
    *   **Side Effects:** Logs the generation process, including selected type, scaling, and final data.

## `cards.js`

Defines card templates, including their effects, and provides a way to retrieve them.

### Variables

1.  **`CARD_TEMPLATES`**
    *   **Purpose:** An array of template objects, each defining a specific card. Includes properties like `id`, `name`, `type`, `cost`, `description`, `rarity`, and an `effect` function.
    *   **`effect(game, source, target)`:** A function within each card template that defines the card's logic when played. It receives the game instance (`game`), the entity playing the card (`source`), and the target entity (`target`), and modifies the game state accordingly.

### Functions

1.  **`getCardTemplate(id)`**
    *   **Purpose:** Retrieves a specific card template object from the `CARD_TEMPLATES` array based on its unique `id`.
    *   **Input:** `id` (String) - The ID of the card template to find.
    *   **Output:** (Object | undefined) - The found card template object, or `undefined` if no template with the given ID exists.
    *   **Side Effects:** Logs an error if the template is not found. 