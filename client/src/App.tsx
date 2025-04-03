import './App.css'
import { GamesFunProvider } from '@games-fun/react'
import { SDKOptions } from '@games-fun/sdk'
import { GameProvider } from './context/GameContext'
import Game from './Game'

// --- Determine Server URL based on environment ---
const productionServerUrl = 'https://momentum-rogue.onrender.com/api/validate-action';
const localServerUrl = 'http://localhost:3001/api/validate-action';

// Use local URL in development, production URL otherwise
const gameServerUrl = import.meta.env.DEV ? localServerUrl : productionServerUrl;

// --- Define the SDKOptions ---
const sdkOptions: SDKOptions = {
  gameServerUrl: gameServerUrl, // Use the determined URL
  debug: import.meta.env.DEV, // Enable debug only in development
  dev: {
    enabled: import.meta.env.DEV, // Enable dev features only in development
  },
}

function App() {
  return (
    <GamesFunProvider options={sdkOptions}>
      <GameProvider>
        <Game />
      </GameProvider>
    </GamesFunProvider>
  )
}

export default App
