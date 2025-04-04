# Project Instructions

## Overview

This project is a web-based card game, likely a roguelike deck-builder, involving a client (built with React/Vite) and a server (built with Node.js/Express/WebSocket) potentially using the Games Fun SDK. The client handles presentation and user interaction, while the server manages game state, logic, and rules. **The player's turn proceeds automatically, playing cards sequentially as long as the player has enough energy for the `nextCard`. The turn only ends and passes to the enemy when the player cannot afford the cost of their `nextCard` or has no cards left to draw.**
Update this file every time you edit something or you notice that the content is different than what you'd expect based on this description.

## File Structure
.
├── client/ # Frontend React application (Vite) - Responsible for displaying the game state received from the server and sending user actions back.
│   ├── .env.development # Environment variables for local development (e.g., API/WS URLs, disable iframe check).
│   ├── .env.production # Environment variables for production builds (used by default, overridden by hosting provider env vars).
│   ├── node_modules/ # Project dependencies for the client (React, Vite plugins, etc.).
│   ├── public/ # Static assets accessible directly by the browser (e.g., favicon, initial images, enemy backgrounds, card images, buff icons).
│   │   ├── images/
│   │   │   ├── backgrounds/ # Background images (e.g., enemy_background.png)
│   │   │   ├── buffs/ # Buff icons (e.g., strength.png)
│   │   │   ├── cards/ # Card artwork (e.g., strike.png)
│   │   │   └── enemies/ # Enemy sprites (e.g., goblin.png)
│   │   └── ... (other public assets)
│   ├── src/    # Client-side source code (React components, context providers, API/WebSocket communication logic, styles).
│   │   ├── App.tsx # The main application component. **Reads API URL (`VITE_API_URL`) and iframe bypass flag (`VITE_DISABLE_IFRAME_CHECK`) from environment variables. Constructs the `gameServerUrl` for the SDK. Sets `SDKOptions`, enabling `debug` and `dev` flags if `import.meta.env.DEV` is true OR if `VITE_DISABLE_IFRAME_CHECK` is set to 'true' (allowing iframe bypass in production builds for testing).** Wraps the application with `GamesFunProvider` and `GameProvider`.
│   │   ├── Game.tsx # Renders the game interface (`GameUI`, `RewardScreen`), manages loading/error states, uses `useGame` and `useGamesFunActions`. **Includes a `useEffect` hook (dependent on `gameState`, `gameConfig`, `actions`) to automatically schedule the player's next card play (`actions.autoPlayCard`) using `setTimeout`. It extracts the `cardId` from `gameState.player.nextCard` (which is a `CardInstance`) to look up the `CardDefinition` and check energy cost. The timeout duration is dynamically calculated based on `gameConfig.CARD_ANIMATION_DELAY_MS` + `gameConfig.CARD_ANIMATION_DURATION_MS` + a small buffer (e.g., 200ms). Uses `useRef`s (`gameStateRef`, `timeoutRef`) for state checks within the timeout callback (comparing `instanceId`s) and concurrency management.**
│   │   ├── components/ # Reusable UI components.
│   │   │   ├── GameUI.tsx # Displays the main fighting/pre-battle UI (Floor, Enemy, Player, Cards). Fetches `gameConfig` via `useGame`. Looks up `CardDefinition` for the playable card using the `cardId` from `player.nextCard` (a `CardInstance`) and for the preview card using the `cardId` from `player.deck[0]` (a `CardInstance`). **Includes a `previousCardId` state and a `useEffect` hook to track changes to the `nextDrawCardId`.** Renders `CardDisplay` for playable card (using `key={'card-' + playableCardInstance?.instanceId ?? 'empty'}`) and next draw preview **(using `key={'preview-' + nextDrawCardInstance?.instanceId ?? 'empty'}`). Passes animation timing props (`animationDelay`, `animationDuration`) and the `instanceId` from the playable card instance to the playable `CardDisplay`. Passes the `previousCardId` state to the preview `CardDisplay`.** Derives `maxMomentum` from `gameConfig`.
│   │   │   ├── CombatantDisplay.tsx # Displays HP, Block (always visible), Momentum (`current / maxMomentum`), and buffs.
│   │   │   ├── PlayerDisplay.tsx # Displays player stats (HP, Block, Energy, Momentum) using `CombatantDisplay`. Dark theme with blue border. Uses `PlayerDisplay.css`.
│   │   │   ├── PlayerDisplay.css # Styles for `PlayerDisplay` (dark theme, layout).
│   │   │   ├── EnemyDisplay.tsx # Displays enemy stats using `CombatantDisplay`, uses enemy image as background. Dark theme with purple border. Uses `EnemyDisplay.css`.
│   │   │   ├── EnemyDisplay.css # Styles for `EnemyDisplay` (container, info box).
│   │   │   ├── ActionLog.tsx # Displays action log (currently not rendered).
│   │   │   ├── BuffIcon.tsx # Displays buff icon, name, description, stacks, duration on hover.
│   │   │   ├── CardDisplay.tsx # Renders a card or placeholder. Uses CSS Modules (`CardDisplay.module.css`). **Accepts `card` (CardDefinition), `instanceId`, `isNextCard`, `isNextDrawPreview`, `animationDelay`, `animationDuration`, and `previousCardId` props. Uses an internal `useEffect` hook (dependent on `instanceId`, `isNextCard`, `animationDelay`) to schedule the playing animation start via `setTimeout` for the playable card. Uses `useRef` (`currentInstanceIdRef`) to track the currently displayed instance ID for the playable card. Sets `isAnimating` state when the timeout fires. Applies `.playing` class conditionally based on `isAnimating`. Applies `animationDuration` via inline style. Uses `onAnimationEnd` to reset `isAnimating` state and set `animationCompleted` state to `true` (only if `isNextCard` is true). If `isNextCard` and `animationCompleted` are both true, it renders an empty placeholder. Displays info from the `card` prop, but uses `instanceId` for animation logic.** **Includes a separate `useEffect` hook (dependent on `card`, `previousCardId`, `isNextDrawPreview`) to handle fade transitions for the preview card. Uses `isFadingOut` and `isFadingIn` states managed by `setTimeout` to apply CSS classes for a fade-out/fade-in effect when the `card.id` changes and `isNextDrawPreview` is true.**
│   │   │   ├── CardDisplay.module.css # CSS Module for `CardDisplay`. Includes dark theme, `.nextCard` highlight, **`@keyframes throwAndRotate` animation. The `.playing` class applies the animation name/timing/fill-mode, but the `animation-duration` is set dynamically via inline style in the component.** Includes `.nextDrawPreview` and `.placeholder` styles. **Adds a `transition: opacity` to `.nextDrawPreview`. Defines `.fadingOut`, `.fadingIn`, and `@keyframes fadeIn` to implement the fade effect for the preview card.**
│   │   │   ├── RewardScreen.tsx # Displays card reward options (`CardDefinition[]`). Uses `useGame` to get `gameState` (including `rewardOptions`) and `useGamesFunActions` to trigger the `selectReward` action. Renders each reward option using `CardDisplay`, passing `instanceId={null}`. Needs dark theme update.
│   │   │   ├── ActionPanel.tsx # Renders Start Battle/View Deck buttons. Dark theme. Uses `ActionPanel.module.css`.
│   │   │   ├── ActionPanel.module.css # Styles for `ActionPanel`.
│   │   │   ├── DeckView.tsx # Modal for displaying a list of cards passed via the `deck` prop (array of card IDs). Fetches `CardDefinition` for each ID from `gameConfig`. Renders each card using `CardDisplay`, passing `instanceId={null}`. Needs dark theme update. Uses `DeckView.module.css`.
│   │   │   └── DeckView.module.css # Styles for `DeckView`.
│   │   ├── context/ # React context providers.
│   │   │   └── GameContext.tsx # Manages WebSocket connection, state, config updates. **Reads WebSocket URL (`VITE_WS_URL`) from environment variables.** Uses `useGamesFun` to get `privyId`. Connects via WebSocket, handles 'register', 'init', 'state_update', 'error' messages. Provides `gameState`, `gameConfig`, `isConnected`, `error`, and `sendMessage` via context.
│   │   └── ... (other client files)
│   ├── styles/ # Global styles or theme configuration.
│   │   └── App.css # Global CSS. Styles `#root`, layout classes (`.game-ui-container`, `.card-area`, etc.).
│   ├── index.html # Main HTML entry point.
│   ├── package.json # Client dependencies and scripts.
│   ├── tsconfig.json # Client TypeScript configuration.
│   └── ... (other Vite config files)
├── server/ # Backend Node.js application - Manages game logic, state, action validation, WebSocket communication.
│   ├── node_modules/ # Server dependencies.
│   ├── src/ # Server-side source code (TypeScript).
│   │   ├── api/
│   │   │   └── routes.ts # **Defines and registers all Express API route handlers (`/healthz`, `/api/config`, `/api/state/:playerId`, `/api/validate-action`). Handles request validation, calls `gameManager`, and triggers WebSocket broadcasts via `activeConnections`.**
│   │   ├── config/
│   │   │   └── gameConfig.ts # **Loads constants from `../config.ts` and data definitions (`cards`, `enemies`, `buffs`). Constructs the flat `GameConfig` object used throughout the server and sent to the client.**
│   │   ├── data/ # Contains static data definitions for game elements.
│   │   │   ├── cards.ts # Defines `CardDefinition` interface and exports `cards` object.
│   │   │   ├── enemies.ts # Defines `EnemyDefinition` interface and exports `enemies` object.
│   │   │   └── buffs.ts # Defines `BuffDefinition` interface and exports `buffs` object.
│   │   ├── websocket/
│   │   │   └── connectionHandler.ts # **Manages WebSocket connections using `wss`, `activeConnections`, and `wsPlayerMap`. Handles `register` messages, sends `init` messages with state and config, and manages connection cleanup.**
│   │   ├── config.ts # Stores static game configuration constants (e.g., player stats, momentum values, reward counts, animation timings).
│   │   ├── gameManager.ts # Implements the core game logic (`DefaultGameManager`). Holds `playerStates`. Includes methods for state management, action validation, applying effects, turn logic, combat setup/end, rewards, initialization, drawing/shuffling.
│   │   ├── types.ts # Contains shared TypeScript types (re-exporting definitions from `data/`), interfaces (`GameState`, `PlayerState`, `CardInstance`, `GameConfig`, etc.).
│   │   └── index.ts # **Main server entry point. Initializes Express, HTTP server, WebSocket server. Loads game config, instantiates `GameManager`. Wires up API routes (from `api/routes.ts`) and WebSocket handling (from `websocket/connectionHandler.ts`). Starts the server.**
│   ├── package.json # Server dependencies and scripts.
│   └── tsconfig.json # Server TypeScript configuration.
├── instructions.md # This file - Detailed project overview, file structure, component/module descriptions.
└── readme.md # Project README - High-level description, basic setup, usage guidelines.

## Update
When you are asked to update the file you should make sure that the descriptions include all the necessary description about

## Additional instructions
After reading the instructions you should answer with the files that I should provide you for context to answer the question.
Create comprehensive descriptions of the files that would include everything anyone would need to understand which files do what and which functions they include - update any files whenever you notice that the content changed or was missing something.
Try to keep this and other files below 250 lines.