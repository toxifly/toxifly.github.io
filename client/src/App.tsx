import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { GamesFunProvider, GamesFunProviderProps } from '@games-fun/react'
import { GameProvider } from './context/GameContext'
import Game from './Game'

// Define the GamesFunProvider options
// TODO: Move gameServerUrl to environment variables
const gamesFunOptions: GamesFunProviderProps = {
  debug: true,
  gameServerUrl: 'http://localhost:3001/api/validate-action',
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
