# Development Plan: Toxifly Game Enhancements

This plan outlines the steps to add PostgreSQL persistence, environment separation (testing/production on Render), and a "buy points for tokens" feature.

## Phase 1: Environment & Database Setup

1.  **Git Branches:**
    *   Ensure you have two main branches: `main` (for production) and `develop` (or `staging`, for testing).
2.  **PostgreSQL Databases (Render):**
    *   Create two separate PostgreSQL instances on Render: one named like `toxifly-db-prod` and one `toxifly-db-test`.
    *   Note down the "Internal Connection String" for each database. These will be used as `DATABASE_URL` environment variables.
3.  **Server Deployments (Render):**
    *   Create two "Web Service" deployments on Render for the `server/` directory.
    *   **Production Service:** Linked to the `main` branch. Set environment variables:
        *   `NODE_ENV`: `production`
        *   `DATABASE_URL`: Internal connection string for `toxifly-db-prod`.
        *   `PORT`: Render provides this, usually 10000.
        *   `CLIENT_URL`: The URL of your production client deployment.
    *   **Testing Service:** Linked to the `develop` branch. Set environment variables:
        *   `NODE_ENV`: `development` (or `staging`)
        *   `DATABASE_URL`: Internal connection string for `toxifly-db-test`.
        *   `PORT`: Render provides this.
        *   `CLIENT_URL`: The URL of your testing client deployment.
4.  **Client Deployments (Render):**
    *   Create two "Static Site" deployments on Render for the `client/` directory.
    *   **Production Site:** Linked to the `main` branch. Set environment variables (used during build):
        *   `VITE_API_URL`: URL of the production server service (e.g., `https://your-prod-server.onrender.com`).
        *   `VITE_WS_URL`: WebSocket URL of the production server (e.g., `wss://your-prod-server.onrender.com`).
        *   `VITE_DISABLE_IFRAME_CHECK`: `false` (or leave unset).
    *   **Testing Site:** Linked to the `develop` branch. Set environment variables:
        *   `VITE_API_URL`: URL of the testing server service.
        *   `VITE_WS_URL`: WebSocket URL of the testing server.
        *   `VITE_DISABLE_IFRAME_CHECK`: `true` (allows testing outside iframe even in this "production-like" build).
5.  **Local `.env` Files:**
    *   `server/.env`: `DATABASE_URL=<your_LOCAL_or_TESTING_db_connection_string>` (e.g., point to the Render testing DB or a local Docker instance), `NODE_ENV=development`, `CLIENT_URL=http://localhost:5173` (or your client dev server port).
    *   `client/.env.development`: `VITE_API_URL=http://localhost:3001` (or your server dev port), `VITE_WS_URL=ws://localhost:3001`, `VITE_DISABLE_IFRAME_CHECK=true`.

## Phase 2: Server - PostgreSQL Integration

1.  **Install Dependencies:**
    *   `cd server`
    *   `npm install pg @types/pg`
2.  **Database Module (`server/src/db/database.ts`):**
    *   Create this file.
    *   Import `pg`.
    *   Initialize a `pg.Pool` using `process.env.DATABASE_URL`.
    *   Define `async` function `initializeDatabase()`: Executes `CREATE TABLE IF NOT EXISTS players (...)` SQL. Schema:
        ```sql
        CREATE TABLE IF NOT EXISTS players (
            id VARCHAR(255) PRIMARY KEY,
            game_state JSONB NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        -- Optional: Trigger to auto-update updated_at
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
           NEW.updated_at = NOW();
           RETURN NEW;
        END;
        $$ language 'plpgsql';

        DROP TRIGGER IF EXISTS update_players_updated_at ON players;
        CREATE TRIGGER update_players_updated_at
        BEFORE UPDATE ON players
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
        ```
    *   Define `async` function `getPlayerState(playerId: string): Promise<GameState | null>`: Queries the `players` table for the `game_state` JSONB by `id`.
    *   Define `async` function `savePlayerState(playerId: string, state: GameState): Promise<void>`: Uses `INSERT ... ON CONFLICT (id) DO UPDATE SET game_state = EXCLUDED.game_state, updated_at = NOW();` to insert or update the player's state.
3.  **Initialize Database Connection (`server/src/index.ts`):**
    *   Import `initializeDatabase` from `./db/database.ts`.
    *   Call `initializeDatabase()` near the start of the server initialization, before starting the HTTP server. Handle potential errors.
4.  **Game Manager Modifications (`server/src/gameManager.ts`):**
    *   Import `getPlayerState` and `savePlayerState`.
    *   Remove the `private playerStates: Record<string, PlayerState> = {};` field. Or, keep it as an optional short-term cache if desired (adds complexity).
    *   Modify `getState(playerId)`:
        *   Make it `async`.
        *   Call `await getPlayerState(playerId)`.
        *   If state exists in DB, return it.
        *   If state is `null`, generate the `initialPlayerState`.
        *   Call `await savePlayerState(playerId, initialState)`.
        *   Return the `initialState`.
    *   Modify **all** methods that currently mutate the state object (e.g., applying card effects, drawing cards, ending turns, starting combat, processing rewards):
        *   Make them `async`.
        *   After modifying the state object in memory, call `await savePlayerState(playerId, updatedState)`. Ensure you are saving the *complete* `GameState` associated with the player ID.

## Phase 3: Points for Tokens Feature

1.  **Constants & Configuration:**
    *   Define a constant `BUY_POINTS_ACTION = 'buyPoints'` (e.g., in `server/src/config.ts`).
    *   Define the exchange rate (e.g., `POINTS_PER_TOKEN = 100`) in `server/src/config.ts`. Add this rate to the `GameConfig` sent to the client if the client needs to display the cost. Decide which "points" are being bought (Energy? A new currency like `premiumPoints`?). Let's assume buying **Max Energy** for simplicity for now. Update `initialPlayerState` if a new currency field is added.
2.  **Server - Action Validation (`server/src/gameManager.ts`):**
    *   Add `buyPoints` to the `GameConfig['rules']` (in `server/config/gameConfig.ts`). The validation might be minimal here, just ensuring required parameters exist.
        ```typescript
        // Example rule in gameConfig.ts rules section
        [BUY_POINTS_ACTION]: [
          {
             validate: async (action, state) => {
               // Basic check: SDK already handled token deduction
               // We just need to ensure the parameters make sense if needed.
               // Example: const { amount } = action.params; return typeof amount === 'number' && amount > 0;
               return true; // Assume SDK handles the core validation (token balance)
             },
             errorMessage: 'Invalid parameters for buying points.'
          }
        ]
        ```
    *   In `gameManager.ts`'s `validateAction` method, add a case for `BUY_POINTS_ACTION`:
        *   Perform the rule validation.
        *   If valid:
            *   Get `amount` (of tokens spent) from `action.params`.
            *   Load the current `GameState` using `await getPlayerState(action.playerId)`.
            *   Calculate `pointsToAdd = amount * POINTS_PER_TOKEN`.
            *   Increase the relevant stat (e.g., `state.player.maxEnergy += pointsToAdd`).
            *   Save the updated state: `await savePlayerState(action.playerId, state)`.
            *   Return a success response.
3.  **Client - SDK Registration:**
    *   In the client file where `useGamesFunActions` is called (e.g., `client/src/Game.tsx`), add the action:
        ```typescript
        const GAME_ACTIONS = {
          // ... other actions
          [BUY_POINTS_ACTION]: "Buy Max Energy with Tokens" // Use the imported constant
        };
        ```
4.  **Client - UI Implementation:**
    *   Add UI elements (e.g., a button in `PlayerDisplay.tsx` or a dedicated shop section).
    *   On button click, determine the `amount` of tokens the user wants to spend.
    *   Call the SDK action: `actions.buyPoints({ amount: number })`. Handle potential errors (e.g., user cancels the transaction in the Games.fun overlay). Update the UI optimistically or based on the next `state_update` from the server.

## Phase 4: Client - Testing Mode & Final Touches

1.  **Install UUID:**
    *   `cd client`
    *   `npm install uuid @types/uuid`
2.  **Implement Testing Mode (`client/src/App.tsx`):**
    *   Import `v4 as uuidv4` from `uuid`.
    *   Before initializing `GamesFunProvider`:
        ```typescript
        const IS_IN_IFRAME = window.self !== window.top;
        const VITE_API_URL = import.meta.env.VITE_API_URL; // Make sure these are defined
        const VITE_WS_URL = import.meta.env.VITE_WS_URL;
        const VITE_DISABLE_IFRAME_CHECK = import.meta.env.VITE_DISABLE_IFRAME_CHECK === 'true';

        let testPlayerId = null;
        const storageKey = 'toxifly_test_player_id';

        if (!IS_IN_IFRAME) {
            testPlayerId = localStorage.getItem(storageKey);
            if (!testPlayerId) {
                testPlayerId = uuidv4();
                localStorage.setItem(storageKey, testPlayerId);
            }
            console.log('Running in Test Mode. Player ID:', testPlayerId);
        }

        const sdkOptions = {
            debug: import.meta.env.DEV || VITE_DISABLE_IFRAME_CHECK,
            gameServerUrl: `${VITE_API_URL}/api/validate-action`, // Use env var for base URL
            dev: {
                enabled: !IS_IN_IFRAME || VITE_DISABLE_IFRAME_CHECK || import.meta.env.DEV,
                mock: !IS_IN_IFRAME ? { // Only mock fully if not in iframe
                    wallet: {
                        address: `test-wallet-${testPlayerId.substring(0, 4)}`,
                        tokenBalance: '10000', // Mock tokens for testing purchases
                        solBalance: '1',
                        privyId: testPlayerId // Use the generated/retrieved UUID
                    }
                } : undefined // Let SDK handle connection if in iframe (unless DEV flags force mock)
            }
            // Add other SDK options if needed
        };
        ```
    *   Pass `sdkOptions` to `<GamesFunProvider options={sdkOptions}>`.
3.  **Verify Environment Variables (`client/src/context/GameContext.tsx` and `client/src/App.tsx`):**
    *   Double-check that `VITE_WS_URL` is correctly read from `import.meta.env` in `GameContext.tsx`.
    *   Ensure `VITE_API_URL` is correctly used in `App.tsx` for constructing `gameServerUrl`.

## Phase 5: Deployment & Documentation

1.  **Deploy:**
    *   Push changes to the `develop` branch. Verify the Render testing deployment (Server & Client). Test non-iframe UUID persistence, iframe connection (if `VITE_DISABLE_IFRAME_CHECK=true`), database saving/loading, and the "Buy Points" flow.
    *   Merge `develop` into `main`. Verify the Render production deployment. Test primarily within the Games.fun iframe environment.
2.  **Documentation (`instructions.md`, `readme.md`):**
    *   Update `instructions.md` with details about the PostgreSQL setup, the two environments, the `DATABASE_URL` variable, persistence logic, the "Buy Points" feature, and the updated testing mode.
    *   Update `readme.md` with setup instructions covering environment variables (`.env` files for local dev, Render setup) and basic database setup/migration notes if needed for local development. Mention the two branches and deployment strategy.

## Phase 6: Local Development & Testing Setup

1.  **Local Database:**
    *   Install Docker Desktop (if not already installed).
    *   Run a local PostgreSQL instance using Docker:
        ```bash
        # Replace mysecretpassword with your own password
        docker run --name toxifly-postgres-local -e POSTGRES_PASSWORD=mysecretpassword -p 5432:5432 -d postgres
        ```
    *   Your local connection string will be similar to `postgresql://postgres:mysecretpassword@localhost:5432/postgres`.
2.  **Environment Files:**
    *   **`server/.env`**: Create/update this file with `DATABASE_URL` pointing to your local DB, `NODE_ENV=development`, and `CLIENT_URL` pointing to your local client dev server (e.g., `http://localhost:5173`).
    *   **`client/.env.development`**: Ensure this file sets `VITE_API_URL` and `VITE_WS_URL` to your local server (e.g., `http://localhost:3001`, `ws://localhost:3001`) and includes `VITE_DISABLE_IFRAME_CHECK=true`.
3.  **Running Locally:**
    *   Ensure the Docker PostgreSQL container is running.
    *   In separate terminals:
        *   `cd server && npm run dev` (or your server start script)
        *   `cd client && npm run dev` (or your client start script)
4.  **Testing Locally:**
    *   Open the client URL (e.g., `http://localhost:5173`) in your browser.
    *   The client uses `localStorage` and UUIDs for player identity outside the iframe.
    *   The local server connects to the local PostgreSQL database to load/save game state for these UUIDs.
    *   Progress persists between browser sessions for the same UUID.
    *   Different browsers/incognito windows create separate player sessions/UUIDs.
    *   The "Buy Points" feature uses mock token balances defined in the client's `sdkOptions` for testing.

## Phase 7: Deployment & Documentation (Renumbered)

1.  **Deploy:**
    *   Push changes to the `develop` branch. Verify the Render testing deployment (Server & Client). Test non-iframe UUID persistence, iframe connection (if `VITE_DISABLE_IFRAME_CHECK=true`), database saving/loading, and the "Buy Points" flow against the *testing database*.
    *   Merge `develop` into `main`. Verify the Render production deployment. Test primarily within the Games.fun iframe environment against the *production database*.
2.  **Documentation (`instructions.md`, `readme.md`):**
    *   Update `instructions.md` with details about the PostgreSQL setup, the two environments, the `DATABASE_URL` variable, persistence logic, the "Buy Points" feature, the updated testing mode, and the local development setup.
    *   Update `readme.md` with setup instructions covering environment variables (`.env` files for local dev, Render setup), local Docker database setup, and basic usage notes. Mention the two branches and deployment strategy.
