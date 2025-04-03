import './App.css'
import { GamesFunProvider } from '@games-fun/react'
import { SDKOptions } from '@games-fun/sdk'
import { GameProvider } from './context/GameContext'
import Game from './Game'

// --- Get URLs and settings from environment variables ---
const apiUrl = import.meta.env.VITE_API_URL;
const disableIframeCheck = import.meta.env.VITE_DISABLE_IFRAME_CHECK === 'true'; // Convert string to boolean

// Check if required variables are set
if (!apiUrl) {
  throw new Error("Missing environment variable: VITE_API_URL");
}
// VITE_WS_URL is used in GameContext, VITE_DISABLE_IFRAME_CHECK has a default behaviour if missing

const gameServerUrl = `${apiUrl}/validate-action`; // Construct the full validation URL

// Determine if dev features should be enabled
// Enabled if explicitly disabled iframe check OR if in standard development mode
const enableDevFeatures = disableIframeCheck || import.meta.env.DEV;

// --- Define the SDKOptions ---
const sdkOptions: SDKOptions = {
  gameServerUrl: gameServerUrl,
  // Debug logs are useful in dev or when specifically bypassing iframe check
  debug: enableDevFeatures,
  dev: {
    enabled: enableDevFeatures, // Enable dev features (like mock privyId)
  },
}

console.log("App Config:", {
  apiUrl,
  gameServerUrl,
  disableIframeCheck,
  enableDevFeatures,
  sdkOptions,
  isDevMode: import.meta.env.DEV,
});

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
