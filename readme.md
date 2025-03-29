# Your Game Name (Replace This)

A web-based card game.

## Project Structure

*   `/client`: Contains the frontend React application built with Vite.
*   `/server`: Contains the backend Node.js/Express/WebSocket server.

## Initial Setup

1.  **Clone the repository (if applicable).**
2.  **Install Server Dependencies:**
    ```bash
    cd server
    npm install
    ```
3.  **Install Client Dependencies:**
    ```bash
    cd ../client
    npm install
    ```

## Running the Application (Preliminary)

*   **Client (Development Mode):**
    ```bash
    cd client
    npm run dev
    ```
    This will start the Vite development server (usually at `http://localhost:5173`). It currently shows the default Vite React page.

*   **Server:**
    *(Instructions will be added once the server entry point `server/src/index.ts` is created).*

## Development Notes

*   The server uses TypeScript, configured via `server/tsconfig.json`.
*   The client uses TypeScript, configured via `client/tsconfig.json`.
