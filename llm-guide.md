# Building Games with Games.fun SDK: A Guide for LLMs

## Overview
This guide helps you create web-based games that integrate with the Games.fun platform, handling wallet connections, token balances, and game actions. The SDK provides a bridge between your game and the Games.fun platform, enabling token-based transactions and wallet interactions.

## Project Structure
A complete game implementation requires:

1. Game Server:
   - Node.js/Express server
   - WebSocket for real-time updates
   - Game state management
   - Action validation

2. Game Client:
   - React or Vanilla JS frontend
   - Games.fun SDK integration
   - UI components
   - Game logic

## Server Implementation

### 1. Project Setup
```bash
mkdir my-game-server
cd my-game-server
npm init -y
npm install express ws @types/ws typescript @types/express
```

### 2. Game Configuration
```typescript
// src/types.ts
export interface GameConfig {
  items: {
    [itemId: string]: {
      id: string;
      name: string;
      description: string;
      price: number;
      duration: number;
    };
  };
  rules: {
    [actionName: string]: Array<{
      validate: (action: ActionRequest, state: PlayerState) => Promise<boolean>;
      errorMessage: string;
    }>;
  };
  initialState: {
    coins: number;
    inventory: Record<string, number>;
  };
}

export interface PlayerState {
  id: string;
  coins: number;
  inventory: Record<string, number>;
}

export interface ActionRequest {
  actionName: string;
  requestId: string;
  params: Record<string, any>;
  timestamp: string;
}
```

### 3. Game Manager Implementation
```typescript
// src/gameManager.ts
export class GameManager {
  private state: Record<string, PlayerState> = {};
  private config: GameConfig;

  constructor(config: GameConfig) {
    this.config = config;
  }

  public getState(playerId: string): PlayerState {
    if (!this.state[playerId]) {
      this.state[playerId] = {
        id: playerId,
        coins: this.config.initialState.coins,
        inventory: { ...this.config.initialState.inventory }
      };
    }
    return this.state[playerId];
  }

  public async validateAction(action: ActionRequest) {
    const state = this.getState(action.params.privyId);
    const rules = this.config.rules[action.actionName];

    if (!rules) return { success: true };

    for (const rule of rules) {
      if (!await rule.validate(action, state)) {
        return {
          success: false,
          error: rule.errorMessage
        };
      }
    }

    // Update state based on action
    if (action.actionName === 'purchaseItem') {
      const { itemId, price } = action.params;
      state.coins -= price;
      state.inventory[itemId] = (state.inventory[itemId] || 0) + 1;
    }

    return { success: true };
  }
}
```

### 4. Server Setup
```typescript
// src/index.ts
import express from 'express';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { GameManager } from './gameManager';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

const gameConfig = {
  items: {
    shield: {
      id: 'shield',
      name: 'Shield Power-up',
      description: '30 seconds of invincibility',
      price: 100,
      duration: 30
    }
  },
  rules: {
    purchaseItem: [{
      validate: async (action, state) => {
        const { itemId, price } = action.params;
        return state.coins >= price && itemId in gameConfig.items;
      },
      errorMessage: 'Insufficient coins or invalid item'
    }]
  },
  initialState: {
    coins: 1000,
    inventory: {}
  }
};

const gameManager = new GameManager(gameConfig);
const connections = new Map();

wss.on('connection', (ws) => {
  ws.on('message', (data) => {
    const message = JSON.parse(data.toString());
    if (message.type === 'register') {
      connections.set(message.playerId, ws);
      ws.send(JSON.stringify({
        type: 'init',
        state: gameManager.getState(message.playerId),
        config: { items: gameConfig.items }
      }));
    }
  });
});

app.post('/api/validate-action', async (req, res) => {
  const result = await gameManager.validateAction(req.body);
  if (result.success) {
    const state = gameManager.getState(req.body.playerId);
    const ws = connections.get(req.body.playerId);
    if (ws) {
      ws.send(JSON.stringify({ type: 'state_update', state }));
    }
  }
  res.json(result);
});

server.listen(3001);
```

## Client Implementation

### React Implementation

1. Project Setup
```bash
npm create vite@latest my-game -- --template react-ts
cd my-game
npm install @games-fun/react @games-fun/sdk
```

2. Provider Setup
```typescript
// src/App.tsx
import { GamesFunProvider } from '@games-fun/react';

function App() {
  return (
    <GamesFunProvider
      options={{
        debug: true,
        gameServerUrl: "http://localhost:3001/api/validate-action",
        dev: {
          enabled: true, // Enable dev mode for testing
          mock: {
            wallet: {
              address: 'test-wallet',
              tokenBalance: '1000',
              solBalance: '10',
              privyId: 'test-player'
            }
          }
        }
      }}
    >
      <Game />
    </GamesFunProvider>
  );
}
```

3. Game Component
```typescript
// src/Game.tsx
import { useGamesFun, useGamesFunActions, ConnectionStatus } from '@games-fun/react';
import { useEffect, useState } from 'react';

const GAME_ACTIONS = {
  purchaseItem: "Purchase in-game item",
  useItem: "Use inventory item"
};

function Game() {
  const { connection } = useGamesFun();
  const actions = useGamesFunActions(GAME_ACTIONS);
  const [gameState, setGameState] = useState(null);
  const [gameServer, setGameServer] = useState(null);

  useEffect(() => {
    if (connection?.privyId) {
      // Connect to game server
      const ws = new WebSocket('ws://localhost:3001');
      
      ws.onopen = () => {
        ws.send(JSON.stringify({
          type: 'register',
          playerId: connection.privyId
        }));
      };

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.type === 'init' || message.type === 'state_update') {
          setGameState(message.state);
        }
      };

      setGameServer(ws);
      return () => ws.close();
    }
  }, [connection?.privyId]);

  const handlePurchase = async (itemId: string, price: number) => {
    try {
      await actions.purchaseItem({ itemId, price });
      console.log(`Purchased ${itemId}`);
    } catch (error) {
      console.error(`Purchase failed: ${error.message}`);
    }
  };

  return (
    <div>
      <ConnectionStatus />
      <div>Coins: {gameState?.coins || 0}</div>
      <div>
        <h2>Shop</h2>
        <button onClick={() => handlePurchase('shield', 100)}>
          Buy Shield (100 coins)
        </button>
      </div>
      <div>
        <h2>Inventory</h2>
        {Object.entries(gameState?.inventory || {}).map(([itemId, count]) => (
          <div key={itemId}>
            {itemId}: {count}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Message Flow

1. Game Initialization:
   ```
   Client -> SDK: Initialize with gameServerUrl
   SDK -> Client: Dev mode mock wallet data
   Client -> Game Server: WebSocket connection + player registration
   Game Server -> Client: Initial state and config
   ```

2. Action Flow:
   ```
   User -> Client: Click purchase button
   Client -> SDK: triggerAction('purchaseItem', { itemId, price })
   SDK -> Game Server: POST /api/validate-action
   Game Server: Validate action & update state
   Game Server -> Client: WebSocket state update
   Client: Update UI with new state
   ```

### Development Tips

1. Always use dev mode during development:
```typescript
dev: {
  enabled: true,
  mock: {
    wallet: {
      address: 'test-wallet',
      tokenBalance: '1000',
      solBalance: '10',
      privyId: 'test-player'
    }
  }
}
```

2. Log all messages for debugging:
```typescript
// In React components
console.log('[Game] WebSocket message:', message);

// In SDK
debug: true // Enables SDK logging
```

3. Handle connection states:
```typescript
const { connection, isInitializing, error } = useGamesFun();

if (isInitializing) return <div>Connecting...</div>;
if (error) return <div>Error: {error.message}</div>;
if (!connection) return <div>Not connected</div>;
```

4. Clean up resources:
```typescript
useEffect(() => {
  const ws = new WebSocket('...');
  setGameServer(ws);
  return () => {
    ws.close();
    gameServer?.cleanup();
  };
}, []);
```

## Best Practices

1. Server-side Validation
   - Always validate actions server-side
   - Check player resources (coins, inventory)
   - Verify action parameters
   - Handle edge cases

2. State Management
   - Keep state in one place (game server)
   - Use WebSocket for real-time updates
   - Update UI only after server confirmation
   - Handle disconnections gracefully

3. Error Handling
   - Provide clear error messages
   - Handle network errors
   - Validate input client-side
   - Log errors for debugging

4. Testing
   - Use dev mode for testing
   - Test with mock wallet data
   - Verify all game actions
   - Test error scenarios

5. Security
   - Validate all inputs
   - Use HTTPS in production
   - Implement rate limiting
   - Secure WebSocket connections

This guide provides everything needed to build a complete game with the Games.fun SDK. Follow the implementation steps, handle edge cases properly, and maintain good development practices for a robust game implementation.


Vanilla Example:
```javascript
import { GamesFunSDK } from "https://unpkg.com/@games-fun/sdk@0.1.92/dist/index.js";
import { GameServer } from "./gameServer.js";
import { UI } from "./ui.js";

let ui = null;
let sdk = null;
let gameConfig = null;
let gameState = null;
const gameServerUrl = "wss://demo-game-server-development.up.railway.app";

// Register action handlers
const handleAction = async (actionName, params, checks = {}) => {
    if (!sdk) {
        ui.addLog("SDK not initialized", "error");
        return;
    }

    if (checks.coins && (!gameState || gameState.coins < checks.coins)) {
        ui.addLog("Insufficient coins", "error");
        return;
    }

    if (checks.inventory && (!gameState || !gameState.inventory[params.itemId])) {
        ui.addLog("Item not available", "error");
        return;
    }

    try {
        ui.addLog(`Initiating ${actionName}...`);
        const result = await sdk.triggerAction(actionName, params);
        if (!result.success) {
            throw new Error(result.error || `${actionName} failed`);
        }
    } catch (error) {
        ui.addLog(`${actionName} failed: ${error.message}`, "error");
    }
};

// Global action functions for UI
window.purchaseItem = (itemId, price) => 
    handleAction("purchaseItem", { itemId, price }, { coins: price });

window.useItem = (itemId) => 
    handleAction("useItem", { itemId }, { inventory: true });

window.transferTokens = (recipient, amount) =>
    handleAction("transferTokens", { recipient, amount });

window.validateTransfer = (signature, sender, recipient) =>
    handleAction("validateTransfer", { signature, sender, recipient });

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
    // Initialize UI helper
    ui = new UI();

    // Initialize SDK
    sdk = new GamesFunSDK({
        debug: true,
        gameServerUrl: "https://demo-game-server-development.up.railway.app/api/validate-action",
        onConnect: (connection) => {
            ui.updateConnectionStatus(connection, connection.walletAddress);

            // Initialize game server
            const gameServer = new GameServer(gameServerUrl);
            
            // Set up game server event handlers
            gameServer.on('log', ({ message, type }) => ui.addLog(message, type));
            gameServer.on('init', ({ config, state }) => {
                gameConfig = config;
                gameState = state;
                ui.updateGameState(state);
                ui.renderInventory(config, state);
                ui.renderShop(config);
            });
            gameServer.on('stateUpdate', (state) => {
                gameState = state;
                ui.updateGameState(state);
                ui.renderInventory(gameConfig, state);
            });

            // Connect to game server
            gameServer.connect(connection.privyId);
        },
        onBalanceUpdate: (connection) => {
            ui.updateConnectionStatus(connection, connection.walletAddress);
        }
    });

    // Register game actions
    sdk.registerActions({
        purchaseItem: "Purchase in-game item",
        useItem: "Use inventory item",
        transferTokens: "Transfer tokens to game wallet",
        validateTransfer: "Validate existing token transfer"
    });
});
```

React Example
```
import { GamesFunProvider, useGamesFun, useGamesFunActions, ConnectionStatus } from '@games-fun/react';
import { SDKError } from '@games-fun/sdk';
import { Inventory } from './components/Inventory';
import { Shop } from './components/Shop';
import { ActionLog } from './components/ActionLog';
import { TokenActions } from './components/TokenActions';
import { GameProvider, useGame } from './context/GameContext';
import './App.css';

const GAME_SERVER_URL_HTTPS = 'https://demo-game-server-development.up.railway.app/api/validate-action';

const GAME_ACTIONS = {
  purchaseItem: "Purchase in-game item",
  useItem: "Use inventory item",
  transferTokens: "Transfer tokens to game wallet",
  validateTransfer: "Validate existing token transfer"
} as const;

function Game() {
  const { connection } = useGamesFun();
  const { gameState, gameConfig, addLog, logs } = useGame();

  // Register all actions at once
  const actions = useGamesFunActions(GAME_ACTIONS);

  // Action handlers
  const handlePurchase = async (itemId: string, price: number) => {
    if (!gameState || gameState.coins < price) {
      addLog('Insufficient coins', 'error');
      return;
    }

    try {
      await actions.purchaseItem({ itemId, price });
      addLog(`Purchased ${itemId}`);
    } catch (error) {
      if (error instanceof SDKError) {
        addLog('Please connect your wallet first', 'error');
      } else {
        addLog(`Purchase failed: ${error instanceof Error ? error.message : String(error)}`, 'error');
      }
    }
  };

  const handleUse = async (itemId: string) => {
    if (!gameState?.inventory[itemId]) {
      addLog('Item not available', 'error');
      return;
    }

    try {
      await actions.useItem({ itemId });
      addLog(`Used ${itemId}`);
    } catch (error) {
      addLog(`Failed to use item: ${error instanceof Error ? error.message : String(error)}`, 'error');
    }
  };


  return (
    <div className="sample-game">
      <h2>Games.fun SDK Demo</h2>
      <p>This demo shows how to use the Games.fun SDK for client-side game actions.</p>

      {/* Connection Status */}
      <div className="token-info">
        <h3>Connection Info</h3>
        <ConnectionStatus />
        <div className="coins">
          Game Points: {gameState ? Math.floor(gameState.coins) : 0}
        </div>
        <TokenActions
          onTransferTokens={async (recipient: string, amount: number) => {
            try {
              await actions.transferTokens({ recipient, amount });
              addLog(`Transferred ${amount} tokens to ${recipient}`);
            } catch (error) {
              addLog(`Transfer failed: ${error instanceof Error ? error.message : String(error)}`, 'error');
            }
          }}
          onValidateTransfer={async (signature: string, sender: string, recipient: string) => {
            try {
              await actions.validateTransfer({ signature, sender, recipient });
              addLog(`Validated transfer from ${sender} to ${recipient}`);
            } catch (error) {
              addLog(`Validation failed: ${error instanceof Error ? error.message : String(error)}`, 'error');
            }
          }}
          isConnected={!!connection}
        />
      </div>

      {/* Game Panel */}
      <div className="game-panel">
        <h3>Player Inventory</h3>
        <Inventory
          gameConfig={gameConfig}
          gameState={gameState}
          onUseItem={handleUse}
          isConnected={!!connection}
        />

        <h3>Item Shop</h3>
        <Shop
          gameConfig={gameConfig}
          gameState={gameState}
          onPurchaseItem={handlePurchase}
          isConnected={!!connection}
        />
      </div>

      {/* Action Log */}
      <div>
        <h3>Action Log</h3>
        <ActionLog logs={logs} />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <div className="app">
      <GamesFunProvider
        options={{
          debug: true,
          gameServerUrl: GAME_SERVER_URL_HTTPS,
          // dev: {
          //   enabled: true // Auto-enable dev mode with mock data
          // }
        }}
      >
        <GameProvider>
          <Game />
        </GameProvider>
      </GamesFunProvider>
    </div>
  );
}
```

Server Example
import express, { Express } from 'express';
import cors from 'cors';
import { WebSocket, WebSocketServer } from 'ws';
import { createServer } from 'http';
import { DefaultGameManager } from './gameManager.js';
import { GameConfig } from './types.js';
const app: Express = express();
const port = process.env.PORT || 3001;

// Create HTTP server
const server = createServer(app);

// Create WebSocket server
const wss = new WebSocketServer({ server });

// Game configuration
const gameConfig: GameConfig = {
  items: {
    shield: {
      id: 'shield',
      name: 'Shield Power-up',
      description: '30 seconds of invincibility',
      price: 100,
      duration: 30
    },
    speedBoost: {
      id: 'speedBoost',
      name: 'Speed Boost',
      description: '15 seconds of increased speed',
      price: 150,
      duration: 15
    }
  },
  rules: {
    purchaseItem: [
      {
        validate: async (action, state) => {
          const { itemId, price } = action.params as { itemId: string; price: number };
          return state.coins >= price && itemId in gameConfig.items;
        },
        errorMessage: 'Insufficient coins or invalid item'
      }
    ],
    useItem: [
      {
        validate: async (action, state) => {
          const { itemId } = action.params as { itemId: string };
          return (state.inventory[itemId] || 0) > 0 && itemId in gameConfig.items;
        },
        errorMessage: 'Item not available in inventory'
      }
    ],
    transferTokens: [
      {
        validate: async (action, state) => {
          const { recipient, amount } = action.params as { recipient: string; amount: number };
          // Always validate token transfers as successful for this demo
          return true;
        },
        errorMessage: 'Invalid token transfer'
      }
    ]
  },
  initialState: {
    coins: 1000,
    inventory: {}
  }
};

// Initialize game manager
const gameManager = new DefaultGameManager(gameConfig);

// Store WebSocket connections by player ID
const connections = new Map<string, WebSocket>();

// WebSocket connection handler
wss.on('connection', (ws) => {
  let playerId: string;

  ws.on('message', (messageData) => {
    try {
      const message = messageData.toString();
      const data = JSON.parse(message);
      
      // Handle player registration
      if (data.type === 'register') {
        playerId = data.playerId;
        connections.set(playerId, ws);
        
        // Send initial state and config
        const state = gameManager.getState(playerId);
        ws.send(JSON.stringify({
          type: 'init',
          state,
          config: {
            items: gameConfig.items
          }
        }));
      }
    } catch (err) {
      console.error('WebSocket message error:', err);
    }
  });

  ws.on('close', () => {
    if (playerId) {
      connections.delete(playerId);
    }
  });
});

// Middleware
app.use(cors());
app.use(express.json());

// Route handlers
app.post('/api/validate-action', async (req, res) => {
  try {
    const result = await gameManager.validateAction(req.body);
    
    // If validation succeeds, send state update to connected client
    if (result.success) {
      const state = gameManager.getState(req.body.playerId);
      const ws = connections.get(req.body.playerId);
      if (ws && ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({
          type: 'state_update',
          state
        }));
      }
    }
    
    res.json(result);
  } catch (err) {
    console.error('Action validation failed:', err);
    res.status(500).json({
      success: false,
      actionName: req.body?.actionName || '',
      requestId: req.body?.requestId || '',
      params: req.body?.params || {},
      timestamp: new Date().toISOString(),
      details: {
        validated: false,
        platform: 'Games.fun',
        actionId: '',
        error: err instanceof Error ? err.message : 'Internal server error'
      }
    });
  }
});

app.get('/api/state/:playerId', (req, res) => {
  try {
    const { playerId } = req.params;
    const state = gameManager.getState(playerId);
    res.json(state);
  } catch (err) {
    console.error('Failed to get state:', err);
    res.status(500).json({
      id: '',
      coins: 0,
      inventory: {}
    });
  }
});

app.get('/api/config', (_req, res) => {
  res.json({
    items: gameConfig.items
  });
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Start server
server.listen(port, () => {
  console.log(`Game server running on port ${port}`);
});

// Handle shutdown gracefully
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

export default app;

import { ActionRequest, ActionResponse } from '@gamesfun/server-sdk';
import { PlayerState, GameManager, GameConfig } from './types.js';

export class DefaultGameManager implements GameManager {
  private state: Record<string, PlayerState> = {};
  private config: GameConfig;

  constructor(config: GameConfig) {
    this.config = config;
  }

  public getState(playerId: string): PlayerState {
    if (!this.state[playerId]) {
      this.state[playerId] = {
        id: playerId,
        coins: this.config.initialState.coins ?? 1000,
        inventory: this.config.initialState.inventory ?? {}
      };
    }
    return this.state[playerId];
  }

  public setState(playerId: string, state: PlayerState): void {
    this.state[playerId] = state;
  }

  public async validateAction(action: ActionRequest): Promise<ActionResponse> {
    try {
      const state = this.getState(action.playerId);
      const rules = this.config.rules[action.actionName];

      // If no rules defined, auto-validate
      if (!rules || rules.length === 0) {
        return {
          success: true,
          actionName: action.actionName,
          requestId: action.requestId,
          params: action.params,
          timestamp: new Date().toISOString(),
          details: {
            validated: true,
            platform: 'Games.fun',
            actionId: Math.random().toString(36).substring(2)
          }
        };
      }

      // Run validation rules
      const validationPromises = rules.map(rule => rule.validate(action, state));
      const validationResults = await Promise.all(validationPromises);
      const success = validationResults.every(result => result === true);

      if (!success) {
        const failedRule = rules[validationResults.findIndex(result => !result)];
        return {
          success: false,
          actionName: action.actionName,
          requestId: action.requestId,
          params: action.params,
          timestamp: new Date().toISOString(),
          details: {
            validated: false,
            platform: 'Games.fun',
            actionId: '',
            error: failedRule.errorMessage || 'Validation failed'
          }
        };
      }

      // Update state based on action
      if (action.actionName === 'purchaseItem') {
        const { itemId, price } = action.params as { itemId: string; price: number };
        if (this.config.items[itemId]) {
          state.coins -= price;
          state.inventory[itemId] = (state.inventory[itemId] || 0) + 1;
          this.setState(action.playerId, state);
        }
      } else if (action.actionName === 'useItem') {
        const { itemId } = action.params as { itemId: string };
        if (this.config.items[itemId]) {
          state.inventory[itemId]--;
          this.setState(action.playerId, state);
        }
      } else if (action.actionName === 'transferTokens') {
        // When tokens are transferred, add 100 game points to the user
        const { amount } = action.params as { recipient: string; amount: number };
        state.coins += amount * 10; // Add 10 coins per token transferred
        this.setState(action.playerId, state);
        console.log(`Added ${amount * 10} coins to player ${action.playerId} for transferring ${amount} tokens`);
      }

      return {
        success: true,
        actionName: action.actionName,
        requestId: action.requestId,
        params: action.params,
        timestamp: new Date().toISOString(),
        details: {
          validated: true,
          platform: 'Games.fun',
          actionId: Math.random().toString(36).substring(2)
        }
      };

    } catch (error) {
      console.error('Action validation failed:', error);
      return {
        success: false,
        actionName: action.actionName,
        requestId: action.requestId,
        params: action.params,
        timestamp: new Date().toISOString(),
        details: {
          validated: false,
          platform: 'Games.fun',
          actionId: '',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }
}
```