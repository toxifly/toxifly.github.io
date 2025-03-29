import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { GamesFunProvider, GamesFunProviderOptions } from '@games-fun/react'
import { GameProvider } from './context/GameContext'
import Game from './Game'

// Define the GamesFunProvider options
// TODO: Move gameServerUrl to environment variables
const gamesFunOptions: GamesFunProviderOptions = {
  debug: true,
  gameServerUrl: 'http://localhost:3001', // Assuming the server runs on port 3001
  dev: {
    enabled: true,
  },
};

function App() {
  return (
    <GamesFunProvider options={gamesFunOptions}>
      <GameProvider>
        <Game />
      </GameProvider>
    </GamesFunProvider>
  )
}

export default App
