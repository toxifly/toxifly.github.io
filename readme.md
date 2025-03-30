# Your Game Name (Replace This)

A web-based card game.

## Project Structure

*   `/client`: Contains the frontend React application built with Vite.
*   `/server`: Contains the backend Node.js/Express/WebSocket server. Handles game logic, state management, action validation, WebSocket communication, and serves API endpoints.

## Initial Setup

1.  **Clone the repository (if applicable).**
2.  **Install Server Dependencies:**
    ```bash
    cd server
    npm install # Installs Express, WebSocket (ws), TypeScript, cors, etc.
    ```
3.  **Install Client Dependencies:**
    ```bash
    cd ../client
    npm install # Installs React, Vite, GamesFun SDK, etc.
    ```

## Running the Application

1.  **Start the Server:**
    ```bash
    cd server
    npm run dev # Or 'npm start' depending on your package.json scripts
    ```
    This will start the Node.js server (usually listening on `http://localhost:3001`). It handles game logic and API requests. Check the server console for confirmation.

2.  **Start the Client (Development Mode):**
    ```bash
    cd ../client # If you are still in the server directory
    # Or just 'cd client' if you are in the root directory
    npm run dev
    ```
    This will start the Vite development server (usually at `http://localhost:5173`). Open this URL in your browser to view the game client.

## Development Notes

*   The server uses TypeScript, configured via `server/tsconfig.json`. It uses the `cors` middleware to allow requests from the client's origin.
*   The client uses TypeScript, configured via `client/tsconfig.json`.
