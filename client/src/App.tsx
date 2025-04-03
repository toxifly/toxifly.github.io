import './App.css'
import { GamesFunProvider } from '@games-fun/react'
import { SDKOptions } from '@games-fun/sdk'
import { GameProvider } from './context/GameContext'
import Game from './Game'

// Define the SDKOptions
// TODO: Move gameServerUrl to environment variables
const sdkOptions: SDKOptions = {
  gameServerUrl: 'http://localhost:3001/api/validate-action',
  debug: true,
  dev: {
    enabled: true,
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
