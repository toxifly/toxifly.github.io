# Project Instructions

## Overview

This project is a web-based card game, likely a roguelike deck-builder, involving a client (built with React/Vite) and a server (built with Node.js/Express/WebSocket) potentially using the Games Fun SDK. The client handles presentation and user interaction, while the server manages game state, logic, and rules.

## File Structure
.
├── client/ # Frontend React application (Vite) - Responsible for displaying the game state received from the server and sending user actions back.
│   ├── node_modules/ # Project dependencies for the client (React, Vite plugins, etc.).
│   ├── public/ # Static assets accessible directly by the browser (e.g., favicon, initial images).
│   ├── src/    # Client-side source code (React components, context providers, API/WebSocket communication logic, styles).
│   │   ├── App.tsx # The main application component. It sets up the GamesFunProvider to initialize the SDK and provide its context to the rest of the application. Renders the main Game component.
│   │   ├── Game.tsx # The core component responsible for rendering the game interface. It uses the `useGamesFun` hook to get SDK status/connection details and the `useGame` hook (from `GameContext`) to access the game state, configuration, and WebSocket connection status. It displays loading/error states and conditionally renders different UI views (e.g., `GameUI` during fighting, rewards, game over) based on the current `gameState.phase`.
│   │   ├── components/ # Reusable UI components.
│   │   │   ├── GameUI.tsx # The main UI displayed during the 'fighting' phase. Takes the current `GameState` and arranges the `PlayerDisplay`, `EnemyDisplay`, and `CardDisplay` components to show the player's stats, the enemy's stats, the current card in hand (if any), and the next card to be drawn.
│   │   │   ├── CombatantDisplay.tsx # Displays core combatant stats (HP, Block, Momentum) and any active buffs/debuffs (using BuffIcon) based on a CombatantState object. Intended for reuse by PlayerDisplay and EnemyDisplay.
│   │   │   ├── PlayerDisplay.tsx # Displays the player's specific stats, leveraging the CombatantDisplay component and adding player-specific information like energy. Takes a `PlayerState` object as a prop.
│   │   │   ├── EnemyDisplay.tsx # Displays the enemy's stats by wrapping CombatantDisplay. It adds a specific background image for the enemy based on `enemy.id` (from `public/images/enemies/`). Takes an `EnemyState` object as a prop.
│   │   │   ├── BuffIcon.tsx # Displays an icon for a given Buff, showing its name, description, stacks, and duration on hover. Uses images from `public/images/buffs/` based on the buff ID.
│   │   │   └── CardDisplay.tsx # Renders a single card based on its `CardDefinition`. Displays cost, name, description, and image (from `public/images/cards/`). Includes an optional visual style to indicate if it's the "next card" via the `isNextCard` prop.
│   │   ├── context/ # React context providers for managing global state.
│   │   │   └── GameContext.tsx # Manages the WebSocket connection to the game server, triggered by the `privyId` from `useGamesFun`. Establishes the connection, sends a 'register' message upon opening, and handles incoming messages: 'init' (sets initial `GameState` and `GameConfig`), 'state_update' (updates `GameState`), and 'error'. Manages connection state (`isConnected`, `error`) and provides the game state, config, connection status, and a `sendMessage` function to child components via the `useGame` hook. Includes cleanup logic to close the WebSocket on disconnect or component unmount.
│   │   └── ... (other components, contexts, etc.)
│   ├── index.html # Main HTML entry point for the single-page application.
│   ├── package.json # Defines client dependencies (e.g., `react`, `@privy-io/react-auth`, `@games-fun/react`) and npm scripts (e.g., `dev`, `build`).
│   ├── tsconfig.json # TypeScript configuration specific to the client application.
│   └── ... (other Vite config files) # Configuration for the Vite build tool.
├── server/ # Backend Node.js application - Manages game logic, state persistence per player, action validation, and WebSocket communication with clients.
│   ├── node_modules/ # Project dependencies for the server (Express, WebSocket library, etc.).
│   ├── src/ # Server-side source code (TypeScript).
│   │   ├── config.ts # Stores static game configuration constants (e.g., `PLAYER_MAX_HP`, `PLAYER_START_ENERGY`, `MOMENTUM_PER_CARD`, reward counts) used for balancing and defining core game rules.
│   │   ├── data/ # Contains static data definitions for game elements.
│   │   │   ├── cards.ts # Defines all available cards in the game, including their cost, effects (as an array of `CardEffect`), and description. Card images are derived from the card `id` (e.g., `id: 'strike'` corresponds to `strike.png`). Exports a `cards` object mapping card IDs to `CardDefinition`.
│   │   │   └── enemies.ts # Defines the base stats (`maxHp`, `maxEnergy`) and decks for all enemy types. Enemy images are derived from the enemy `id`. Exports an `enemies` object mapping enemy IDs to `EnemyDefinition`.
│   │   └── types.ts # Contains all shared TypeScript type definitions and interfaces for game entities (e.g., `CardEffect`, `CardDefinition`, `Buff`, `CombatantState`, `PlayerState`, `EnemyState`, `EnemyDefinition`, `GameState`, `GameConfig`) and actions (`ActionRequest`). Ensures type safety across the server codebase and consistency with client expectations. `GameState` includes player/enemy details and reward options. `GameConfig` holds static game data (cards, enemies, constants). `ActionRequest` defines the structure for client-to-server commands.
│   │   └── gameManager.ts # Implements the core game logic and state management using the `DefaultGameManager` class. It holds the game state for active players, validates actions, applies card effects, manages turns, handles fight progression (starting new fights, generating rewards), and initializes game state for new players. It uses the `GameConfig` provided during instantiation to access card/enemy data and game constants.
│   │   └── index.ts # The main entry point for the server application. Initializes the Express app, creates an HTTP server, and sets up WebSocket communication (`ws`). It loads the game configuration (`GameConfig`) and instantiates the `DefaultGameManager`. It handles incoming WebSocket connections (`wss.on('connection')`), specifically listening for a 'register' message containing a `playerId`. Upon registration, it retrieves the initial `GameState` (using `gameManager.getState`) and the `GameConfig`, sending them back to the client in an 'init' message. It maintains maps (`activeConnections`, `wsPlayerMap`) to associate player IDs with their WebSocket connections and handles connection cleanup (`ws.on('close')`, `ws.on('error')`). It also defines basic HTTP API endpoints:
│   │   │   - `GET /api/config`: Returns the static `GameConfig` object.
│   │   │   - `GET /api/state/:playerId`: Returns the current `GameState` for the specified player, initializing it if necessary.
│   │   │   - `POST /api/validate-action`: Accepts a player action (body: `{ playerId: string, action: ActionRequest }`) and currently returns a stub success response (actual validation logic pending).
│   ├── package.json # Defines server dependencies (e.g., `express`, `ws`, `typescript`, `ts-node`) and npm scripts (e.g., `start`, `dev`).
│   └── tsconfig.json # TypeScript configuration specific to the server application.
├── instructions.md # This file - Provides an up-to-date, detailed overview of the project, file structure explanations, descriptions of key functions/modules, and potentially setup/run instructions for development.
└── readme.md # Project README - Standard README file containing a high-level project description, basic setup instructions, and usage guidelines, suitable for external viewers or as a quickstart guide.