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

## Development Environment Setup

To set up the project for local development, follow these steps:

1.  **Prerequisites:**
    *   Ensure you have [Node.js](https://nodejs.org/) installed (which includes npm). Version 18 or later is recommended.
    *   You can use `npm` or `yarn` as your package manager. Commands below use `npm`.
2.  **Clone the Repository:**
    *   If you haven't already, clone the project repository to your local machine.
3.  **Install Server Dependencies:**
    *   Navigate to the `server` directory in your terminal:
        ```bash
        cd server
        ```
    *   Install the required packages:
        ```bash
        npm install
        ```
4.  **Install Client Dependencies:**
    *   Navigate to the `client` directory in your terminal:
        ```bash
        cd ../client 
        ```
    *   Install the required packages:
        ```bash
        npm install
        ```
5.  **Run the Development Server:**
    *   In the `server` directory terminal:
        ```bash
        npm run dev 
        ```
    *   This will start the backend server, typically listening on `http://localhost:3001`. It should also watch for file changes and restart automatically.
6.  **Run the Development Client:**
    *   In the `client` directory terminal:
        ```bash
        npm run dev
        ```
    *   This will start the Vite development server for the frontend, usually accessible at `http://localhost:5173` (Vite will output the exact address). It provides features like Hot Module Replacement (HMR).
7.  **Access the Application:**
    *   Open your web browser and navigate to the address provided by the Vite development server (e.g., `http://localhost:5173`).
    *   The client is configured to automatically connect to the local backend server (`http://localhost:3001`) when running in development mode (`npm run dev`).